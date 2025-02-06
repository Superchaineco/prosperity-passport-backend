import { EAS__factory } from '@ethereum-attestation-service/eas-contracts/dist/typechain-types/factories/contracts/EAS__factory';

import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import {
  ATTESTATOR_SIGNER_PRIVATE_KEY,
  EAS_CONTRACT_ADDRESS,
  JSON_RPC_PROVIDER,
  SAFE_ACCOUNT,
  SUPER_CHAIN_ATTESTATION_SCHEMA,
} from '../config/superChain/constants';
import { superChainAccountService } from './superChainAccount.service';
import { ResponseBadge } from './badges/badges.service';
import Safe from '@safe-global/protocol-kit';
import { MetaTransactionData, OperationType } from '@safe-global/types-kit';

export class AttestationsService {
  private easContractAddress = EAS_CONTRACT_ADDRESS;
  private schemaString = '(uint256 badgeId, uint256 level)[] badges';
  private provider = new JsonRpcProvider(JSON_RPC_PROVIDER);
  private wallet = new Wallet(ATTESTATOR_SIGNER_PRIVATE_KEY, this.provider);
  private eas = EAS__factory.connect(this.easContractAddress, this.wallet);
  private schemaEncoder = new SchemaEncoder(this.schemaString);



  async estimateGas(account: string, txData: any) {
    const calldata = await this.eas.attest.populateTransaction(txData);

    const txRequest: ethers.TransactionRequest = {
      to: this.easContractAddress,
      from: this.wallet.address,
      data: calldata.data,
    };
    const gasPrice = await this.provider.estimateGas(txRequest);
    const gasEstimate = await this.eas.attest.estimateGas(txData);
    const estimatedCost = gasEstimate * gasPrice;
    const estimatedCostInEth = ethers.formatEther(estimatedCost);
    console.log(ATTESTATOR_SIGNER_PRIVATE_KEY)
    console.log(`Gas Estimate: ${gasEstimate.toString()} units`);
    console.log(`Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    console.log(`Estimated Cost: ${estimatedCostInEth} ETH`);
    return estimatedCost
  }

  


  async tryAttestWithSafe(account: string, txData: any): Promise<string | boolean> {

    

    const safeSdk = await Safe.default.init({
      provider: JSON_RPC_PROVIDER,
      signer: ATTESTATOR_SIGNER_PRIVATE_KEY,
      safeAddress: SAFE_ACCOUNT
    })


    const calldata = await this.eas.attest.populateTransaction(txData);

    const safeTransactionData: MetaTransactionData = {
      to: this.easContractAddress,
      value: '0',
      data: calldata.data,
      operation: OperationType.Call
    }

    const safeTransaction = await safeSdk.createTransaction({
      transactions: [safeTransactionData]
    })

    // const gasRequired = await this.estimateGas(account, txData)
    // const balance = await safeSdk.getBalance()
    // console.log('Currente balance:', balance, ' ETH')

    const isValid = await safeSdk.isValidTransaction(safeTransaction);

    if(!isValid)
      return isValid;



    
  }

  async tryAttestWithGelato(account: string, txData: any): Promise<string | boolean> {


    const safeSdk = await Safe.default.init({
      provider: JSON_RPC_PROVIDER,
      signer: ATTESTATOR_SIGNER_PRIVATE_KEY,
      safeAddress: SAFE_ACCOUNT
    })


    return false;

  }

  public async attest(
    account: string,
    totalPoints: number,
    badges: ResponseBadge[],
    badgeUpdates: { badgeId: number; level: number }[]
  ) {

    const encodedData = this.schemaEncoder.encodeData([
      {
        name: 'badges',
        value: badgeUpdates,
        type: '(uint256,uint256)[]'
      },
    ]);


    try {
      const isLevelUp = await superChainAccountService.getIsLevelUp(
        account,
        totalPoints
      );

      const txData = {
        schema: SUPER_CHAIN_ATTESTATION_SCHEMA,
        data: {
          recipient: account,
          data: encodedData,
          expirationTime: BigInt(0),
          value: BigInt(0),
          refUID: ethers.ZeroHash,
          revocable: false,
        },
      };





      let attestSuccess = await this.tryAttestWithSafe(account, txData);
      if (!attestSuccess)
        attestSuccess = await this.tryAttestWithGelato(account, txData)

      if (!attestSuccess)
        throw new Error('Not enough funds');

      const badgeImages = Array.from(
        new Set(
          badges.flatMap((badge) =>
            badgeUpdates
              .filter((update) => badge.badgeId === update.badgeId)
              .map(
                (update) =>
                  badge.badgeTiers.find(
                    (tier) => Number(tier.tier) === Number(update.level)
                  )?.metadata?.['2DImage']
              )
              .filter((image) => image)
          )
        )
      );


      await this.claimBadgesOptimistically(account, badgeUpdates);

      return {
        hash: receipt?.hash,
        isLevelUp,
        badgeImages,
        totalPoints,
        badgeUpdates,
      };
    } catch (error: any) {
      console.error('Error attesting', error);
      throw new Error(error);
    }
  }
}
