import { EAS__factory } from '@ethereum-attestation-service/eas-contracts/dist/typechain-types/factories/contracts/EAS__factory';

import { ethers, JsonRpcProvider, Wallet, ZeroAddress, zeroPadValue } from 'ethers';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import {
  ATTESTATOR_SIGNER_PRIVATE_KEY,
  BADGES_RPC_URL,
  EAS_CONTRACT_ADDRESS,
  JSON_RPC_PROVIDER,
  PIMLICO_API_KEY,
  SAFE_ADDRESS,
  SUPER_CHAIN_ATTESTATION_SCHEMA,
} from '../config/superChain/constants';
import { superChainAccountService } from './superChainAccount.service';
import { redisService } from './redis.service';
import { BadgesServices, ResponseBadge } from './badges/badges.service';
import Safe, { encodeMultiSendData, OnchainAnalyticsProps } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import Safe4337Pack from '@safe-global/relay-kit/dist/src/packs/safe-4337/Safe4337Pack';
import { MetaTransactionData, OperationType } from '@safe-global/types-kit';
import config from '@/config';
import { setAccountEOAs, setAccountNoun, updateAccountStats } from './account.service';

export class AttestationsService {
  private easContractAddress = EAS_CONTRACT_ADDRESS;
  private schemaString = '(uint256 badgeId, uint256 level)[] badges';
  private provider = new JsonRpcProvider(JSON_RPC_PROVIDER);
  private wallet = new Wallet(ATTESTATOR_SIGNER_PRIVATE_KEY, this.provider);
  private eas = EAS__factory.connect(this.easContractAddress, this.wallet);
  private schemaEncoder = new SchemaEncoder(this.schemaString);

  async tryAttestWithSafe(txData: any): Promise<string | boolean> {
    const onchainAnalytics: OnchainAnalyticsProps = {
      project: 'ProsperityAccounts',
      platform: 'Web',
    };
    // @ts-expect-error ESM import
    const safeSdk = await Safe.default.init({
      provider: JSON_RPC_PROVIDER,
      signer: ATTESTATOR_SIGNER_PRIVATE_KEY,
      safeAddress: SAFE_ADDRESS,
      onchainAnalytics,
    });

    const data = this.eas.interface.encodeFunctionData('attest', [txData]);

    const safeTransactionData: MetaTransactionData = {
      to: this.easContractAddress,
      value: '0',
      data: data,
    };


    const safeTransaction = await safeSdk.createTransaction({
      transactions: [safeTransactionData],
    });

    const isValid = await safeSdk.isValidTransaction(safeTransaction, {
      from: SAFE_ADDRESS,
    });


    if (!isValid) return isValid;

    try {
      const executeTxResponse = await safeSdk.executeTransaction(safeTransaction)
      return executeTxResponse.hash;
    } catch (e) {
      console.error('Unexpected error executing transaction with SAFE:', e);
    }
  }

  async tryAttestWithRelayKit(
    account: string,
    txData: any
  ): Promise<string | boolean> {
    const onchainAnalytics: OnchainAnalyticsProps = {
      project: 'SuperAccounts',
      platform: 'Web',
    };
    const safe4337Pack = await (
      await Safe4337Pack
    ).Safe4337Pack.init({
      provider: JSON_RPC_PROVIDER,
      signer: ATTESTATOR_SIGNER_PRIVATE_KEY,
      bundlerUrl: `https://api.pimlico.io/v2/${config.constants.CELO_CHAIN_ID}/rpc?apikey=${PIMLICO_API_KEY}`,
      options: {
        owners: [this.wallet.address],
        threshold: 1,
        safeAddress: SAFE_ADDRESS,
      },
      paymasterOptions: {
        isSponsored: true,
        paymasterUrl: `https://api.pimlico.io/v2/${config.constants.CELO_CHAIN_ID}/rpc?apikey=${PIMLICO_API_KEY}`,
      },
      onchainAnalytics,
    });
    const calldata = await this.eas.attest.populateTransaction(txData);
    const transaction: MetaTransactionData = {
      to: this.easContractAddress,
      value: '0',
      data: calldata.data,
      operation: OperationType.Call,
    };
    const safeOperation = await safe4337Pack.createTransaction({
      transactions: [transaction],
    });
    const signedSafeOperation = await safe4337Pack.signSafeOperation(
      safeOperation
    );
    try {
      const userOperationHash = await safe4337Pack.executeTransaction({
        executable: signedSafeOperation,
      });
      console.log('Hash: ', userOperationHash);
      return userOperationHash;
    } catch (e) {
      console.error(
        'Unexpected error executing transaction with PAYMASTER:',
        e
      );
    }
  }

  async createSafeTransactions(txDatas: any[]) {
    const safeTransactions: MetaTransactionData[] = [];
    for (const txData of txDatas) {
      const data = this.eas.interface.encodeFunctionData('attest', [txData]);

      const safeTransactionData: MetaTransactionData = {
        to: this.easContractAddress,
        value: '0',
        data: data,
      };
      safeTransactions.push(safeTransactionData);
    }
    return safeTransactions;
  }


  public async batchAttest(
    batchData: {
      account: string;
      totalPoints: number;
      badges: ResponseBadge[];
      badgeUpdates: { badgeId: number; level: number; points: number }[];
    }[]
  ) {
    const onchainAnalytics: OnchainAnalyticsProps = {
      project: 'SuperAccounts',
      platform: 'Web',
    };

    console.log(BADGES_RPC_URL, SAFE_ADDRESS)
    // @ts-expect-error ESM import
    const safeSdk = await Safe.default.init({
      provider: BADGES_RPC_URL,
      signer: ATTESTATOR_SIGNER_PRIVATE_KEY,
      safeAddress: SAFE_ADDRESS,
      onchainAnalytics,
    });

    const txDatas = [];
    for (const data of batchData) {
      console.log('Attesting:', data.account);
      const encodedData = this.schemaEncoder.encodeData([
        {
          name: 'badges',
          value: data.badgeUpdates,
          type: '(uint256,uint256)[]',
        },
      ]);

      txDatas.push({
        schema: SUPER_CHAIN_ATTESTATION_SCHEMA,
        data: {
          recipient: data.account,
          data: encodedData,
          expirationTime: BigInt(0),
          value: BigInt(0),
          refUID: ethers.ZeroHash,
          revocable: false,
        },
      });
    }

    const preResponses = await Promise.all(
      batchData.map(async (data) => {
        const isLevelUp = await superChainAccountService.getIsLevelUp(
          data.account,
          data.totalPoints
        );

        return {
          data,
          isLevelUp
        };
      })
    );


    const safeTransactions = await this.createSafeTransactions(txDatas);

    const safeTransaction = await safeSdk.createTransaction({
      transactions: safeTransactions,
    });
    const multiSendData = encodeMultiSendData(safeTransactions);
    console.log(
      '🧾🧾🧾🧾🧾 Calldata sent to Safe (batch multiSend):',
      multiSendData
    );

    try {
      const executeTxResponse = await safeSdk.executeTransaction(
        safeTransaction
      );

      await this.provider.waitForTransaction(executeTxResponse.hash, 1);

      const responses = await Promise.all(
        preResponses.map(async (data) => {


          const updatedBadges = data.data.badges.filter((badge) =>
            data.data.badgeUpdates.some((update) => update.badgeId === badge.badgeId)
          );

          return {
            account: data.data.account,
            hash: executeTxResponse.hash,
            isLevelUp: data.isLevelUp,
            totalPoints: data.data.totalPoints,
            badgeUpdates: data.data.badgeUpdates,
            updatedBadges,
          };
        })
      );

      await Promise.all(
        batchData.map(
          async (data) =>
            await this.claimBadgesOptimistically(
              data.account,
              data.badgeUpdates
            )
        )
      );

      return responses;
    } catch (e) {
      console.error('Unexpected error executing transaction with SAFE:', e);
      throw e;
    }
  }
  public async attest(
    account: string,
    totalPoints: number,
    badges: ResponseBadge[],
    badgeUpdates: { badgeId: number; level: number; points: number }[]
  ) {
    const encodedData = this.schemaEncoder.encodeData([
      {
        name: 'badges',
        value: badgeUpdates,
        type: '(uint256,uint256)[]',
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
      let attestSuccess = await this.tryAttestWithSafe(txData);

      if (!attestSuccess)
        attestSuccess = await this.tryAttestWithRelayKit(account, txData);


      if (!attestSuccess) throw new Error('Not enough funds');

      if (typeof attestSuccess === 'string') {
        await this.provider.waitForTransaction(attestSuccess, 1);
      }

      const updatedBadges = badges.filter(badge =>
        badgeUpdates.some(update => update.badgeId === badge.badgeId)
      );

      await this.claimBadgesOptimistically(account, badgeUpdates);

      return {
        hash: attestSuccess,
        isLevelUp,
        totalPoints,
        badgeUpdates,
        updatedBadges,
      };
    } catch (error: any) {
      console.error('Error attesting', error);
      throw new Error(error);
    }
  }




  public async claimBadgesOptimistically(
    account: string,
    badgeUpdates: { badgeId: number; level: number; points: number }[]
  ): Promise<void> {
    const CACHE_KEY = `cached_badges:${account}`;


    const existingData = await redisService.getCachedData(CACHE_KEY);
    if (!existingData) {
      console.log('Existing data not found');
      return;
    }

    const updatedBadges = existingData.map((badge: any) => {
      const update = badgeUpdates.find((u) => u.badgeId === badge.badgeId);
      if (update) {
        badge.tier = update.level;
        badge.points += update.points;
        badge.claimable = false;
      }
      return badge;
    });


    await redisService.setCachedData(
      CACHE_KEY,
      updatedBadges,
      60
    );


    const level = await superChainAccountService.getAccountLevel(account);
    const total_badges = updatedBadges.reduce((acc, badge) => acc + badge.tier, 0)
    const total_points = totalBadgePoints(updatedBadges)
    updateAccount(account, level, total_points, total_badges);
    const eoas = await superChainAccountService.getEOAS(account)
    const accountData = await superChainAccountService.getSuperChainSmartAccount(account)
    const noun = getAvatarNoun(accountData)
    setAccountNoun(account, noun);
    setAccountEOAs(account, eoas)
    console.log('Optimistic updated badges for:', account);
  }
}


function getAvatarNoun(superchainsmartaccount: any) {
  return {
    background: parseInt(superchainsmartaccount[4][0]),
    body: parseInt(superchainsmartaccount[4][1]),
    accessory: parseInt(superchainsmartaccount[4][2]),
    head: parseInt(superchainsmartaccount[4][3]),
    glasses: parseInt(superchainsmartaccount[4][4]),
  }
}

async function updateAccount(account: string, level: number, total_points: number, total_badges: number) {
  try {
    updateAccountStats(account, { level, total_points, total_badges })
  } catch (error) {
    console.error('Error updating account stats:', error);
  }

}

export function totalBadgePoints(badges: any[]): number {
  return badges.reduce((total, b) => {
    const currTier = Number(b.tier);
    if (!Number.isFinite(currTier)) return total;

    const sumForBadge = (b.badgeTiers ?? []).reduce((acc, t) => {
      const tierNum = Number(t.tier);
      const pts = Number(t.points);
      return acc + (Number.isFinite(tierNum) && tierNum <= currTier ? (Number.isFinite(pts) ? pts : 0) : 0);
    }, 0);

    return total + sumForBadge;
  }, 0);
}

