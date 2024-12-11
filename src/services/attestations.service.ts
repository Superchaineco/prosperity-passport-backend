import { EAS__factory } from '@ethereum-attestation-service/eas-contracts/dist/typechain-types/factories/contracts/EAS__factory';

import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import {
  ATTESTATOR_SIGNER_PRIVATE_KEY,
  EAS_CONTRACT_ADDRESS,
  JSON_RPC_PROVIDER,
  SUPER_CHAIN_ATTESTATION_SCHEMA,
} from '../config/superChain/constants';
import { superChainAccountService } from './superChainAccount.service';
import { ResponseBadge } from './badges/badges.service';

export class AttestationsService {
  private easContractAddress = EAS_CONTRACT_ADDRESS;
  private schemaString = '(uint256 badgeId, uint256 level)[] badges';
  private provider = new JsonRpcProvider(JSON_RPC_PROVIDER);
  private wallet = new Wallet(ATTESTATOR_SIGNER_PRIVATE_KEY, this.provider);
  private eas = EAS__factory.connect(this.easContractAddress, this.wallet);
  private schemaEncoder = new SchemaEncoder(this.schemaString);

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

      const tx = await this.eas.attest({
        schema:
          SUPER_CHAIN_ATTESTATION_SCHEMA,
        data: {
          recipient: account,
          data: encodedData,
          expirationTime: BigInt(0),
          value: BigInt(0),
          refUID: ethers.ZeroHash,
          revocable: false,
        },
      });
      const _badges = badges.filter(badge => badgeUpdates.some(update => update.badgeId == badge.badgeId)).map(badge => ({...badge, tier: badgeUpdates.find(update=> update.badgeId === badge.badgeId).level.toString()}));
     
      const receipt = await tx.wait();
      return { hash: receipt.hash, isLevelUp, badges: _badges, totalPoints };

    } catch (error: any) {
      console.error('Error attesting', error);
      throw new Error(error);
    }
  }
}
