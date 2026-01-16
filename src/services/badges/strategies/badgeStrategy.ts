import { Alchemy, AssetTransfersCategory, Network } from 'alchemy-sdk';
import { Badge, ResponseBadge } from '../badges.service';
import { redisService } from '@/services/redis.service';
export interface BadgeStrategy {
  calculateTier(
    eoas: string[],
    badgeData: Badge,
    extraData: any | undefined,
    account?: string
  ): Promise<ResponseBadge>;
}

export const DEFAULT_TTL = 3600
export abstract class BaseBadgeStrategy implements BadgeStrategy {
  abstract getValue(
    eoas: string[],
    extraData: any | undefined,
    badgeData: Badge
  ): Promise<number | boolean>;

  protected isDecending = false;

  async calculateTier(
    eoas: string[],
    badgeData: Badge,
    extraData: any | undefined,
    account: string
  ): Promise<ResponseBadge> {
    const value = await this.getValue(eoas, extraData, badgeData);

    let claimableTier: number | null = null;
    let claimable = false;

    if (typeof value === 'number') {
      claimableTier = this.calculateNumericTier(badgeData, value);
      claimable = claimableTier ? badgeData.tier < claimableTier : false;
    } else if (typeof value === 'boolean') {
      claimableTier = value ? 1 : null;
      claimable = value ? badgeData.tier != 1 : false;
    }

    if (claimableTier !== null && claimableTier < Number(badgeData.tier)) {
      claimableTier = Number(badgeData.tier);
    }

    return {
      ...badgeData.badge,
      points: badgeData.points,
      tier: badgeData.tier,
      claimableTier,
      claimable,
    };
  }

  protected calculateNumericTier(badgeData: Badge, value: number): number {
    const badgeTiers = badgeData.badge.badgeTiers;
    if (!badgeTiers) throw new Error('No tiers found for badge');

    if (this.isDecending) {
      for (let i = badgeTiers.length - 1; i >= 0; i--) {
        if (value <= badgeTiers[i].metadata!.minValue) {
          return i + 1;
        }
      }
      return 0;
    }

    for (let i = badgeTiers.length - 1; i >= 0; i--) {
      if (value >= badgeTiers[i].metadata!.minValue) {
        return i + 1;
      }
    }
    return 0;
  }

  protected async getAlchemyTransactionsCount(
    chainKey: string,
    network: Network,
    eoas: string[],
    season: string,
    fromBlockNum: number,
    toBlockNum: number
  ): Promise<number> {
    const cacheKey = `${chainKey}-transactions-${season}-${eoas.join(",")}`;


    const fetchFunction = async (): Promise<number> => {
      const alchemy = new Alchemy({
        apiKey: process.env.ALCHEMY_PRIVATE_KEY!,
        network,
      });


      const currentBlock: number = await alchemy.core.getBlockNumber();

      if (currentBlock < fromBlockNum) {
        return 0;
      }

      const fromBlockHex = `0x${fromBlockNum.toString(16)}`;
      const toBlockHex = `0x${toBlockNum.toString(16)}`;
      const useToBlock = currentBlock >= toBlockNum;


      const count = await eoas.reduce(async (accPromise, eoa) => {
        const acc = await accPromise;
        const result = await alchemy.core.getAssetTransfers({
          fromBlock: fromBlockHex,
          toBlock: useToBlock ? toBlockHex : undefined,
          fromAddress: eoa,
          excludeZeroValue: false,
          category: [
            AssetTransfersCategory.EXTERNAL,
            AssetTransfersCategory.ERC20,
            AssetTransfersCategory.ERC1155,
          ],
        });
        return acc + result.transfers.length;
      }, Promise.resolve(0));

      return count;
    };

    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, DEFAULT_TTL);
  }
}
