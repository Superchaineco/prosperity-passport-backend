import {
  GetUserBadgesDocument,
  GetUserBadgesQuery,
  GetUserBadgesQueryVariables,
  execute,
} from '../../../.graphclient';
import type { ExecutionResult } from 'graphql';
import IpfsService from '../ipfs.service';
import { redisService } from '../redis.service';
import { BadgeStrategyContext } from '../badges/strategies/context';
import { superChainAccountService } from '../superChainAccount.service';
export type Badge = GetUserBadgesQuery['accountBadges'][number];
export type ResponseBadge = {
  points: string;
  tier: string;
} & Badge['badge'] & {
  claimableTier: number | null;
  claimable: boolean;
};

export class BadgesServices {
  private badges: ResponseBadge[] = [];

  public async getCachedBadges(account: string, extraData?: any | undefined): Promise<any[]> {
    const CACHE_KEY = `cached_badges:${account}`;
    const OPTIMISTIC_KEY = `optimistic_updated_cached_badges:${account}`;

    const fetchFresh = async (): Promise<any[]> => {
      const eoas = await superChainAccountService.getEOAS(account);
      const freshData = await this.getBadges(eoas, account, { ...(extraData ?? {}), account });
      await redisService.setCachedData(CACHE_KEY, freshData, null);
      return freshData;
    };

    const optimisticData = await redisService.getCachedData(OPTIMISTIC_KEY);
    const cachedData = await redisService.getCachedData(CACHE_KEY);

    if (optimisticData && cachedData) {
      void fetchFresh().then(fresh => {
        if (JSON.stringify(fresh) !== JSON.stringify(cachedData)) {
          redisService.setCachedData(CACHE_KEY, fresh, null);
          redisService.deleteCachedData(OPTIMISTIC_KEY);
        }
      }).catch(err => console.error('Error fetching fresh data:', err));
      return optimisticData;
    }

    if (cachedData) {
      const fresh = await fetchFresh();
      if (JSON.stringify(fresh) !== JSON.stringify(cachedData)) {
        return fresh;
      }
      return cachedData;
    }

    return await fetchFresh();
  }


  public async fetchBadges(account: string) {
    const CACHE_KEY = `user_badges:${account}`;
    const ttl = 3600;

    const fetchFunction = async () => {
      const { data, errors }: ExecutionResult<GetUserBadgesQuery> =
        await execute(GetUserBadgesDocument, {
          user: account,
        } as GetUserBadgesQueryVariables);
      if (errors) {
        console.error('Error fetching badges:', errors);
        throw new Error('Error fetching badges');
      }
      return data;
    };

    // return redisService.getCachedDataWithCallback(CACHE_KEY, fetchFunction, ttl);
    return fetchFunction();
  }

  public async getBadges(eoas: string[], account: string, extraData: any | undefined): Promise<any[]> {
    const data = await this.fetchBadges(account);

    const accountBadgesIds =
      data?.accountBadges.map((accountBadge) => accountBadge.badge.badgeId) ??
      [];
    const unclaimedBadges = (
      data!.badges?.filter(
        (badge) => !accountBadgesIds.includes(badge.badgeId)
      ) ?? []
    ).map((badge) => ({
      tier: 0,
      points: 0,
      badge: {
        ...badge,
      },
    }));

    const activeBadges = [
      ...(data?.accountBadges ?? []).map((badge) => {

        return ({
          ...badge,
          tier: parseInt(badge.tier),
          points: parseInt(badge.points),
        })
      }),
      ...unclaimedBadges,
    ] as Badge[];
    const promises = activeBadges.flatMap((badge) =>
      badge.badge.badgeTiers.map((tier) => this.getBadgeLevelMetadata(tier))
    );
    const results = await Promise.all(promises);

    for (const badge of activeBadges) {
      badge.badge['metadata'] = await this.getBadgeMetadata(badge);
      badge.badge.badgeTiers.forEach((tier) => {
        const result = results.find((res) => res.tier.uri === tier.uri);
        if (result) {
          tier['metadata'] = result.metadata;
        }
      });
    }

    for (const badge of activeBadges) {
      await this.updateBadgeDataForAccount(eoas, badge, extraData);
    }

    return this.badges;
  }

  public getTotalPoints(badges: ResponseBadge[]): number {
    return badges.reduce((totalSum, badge) => {
      if (!badge.claimable) {
        return totalSum;
      }

      const { tier, badgeTiers, claimableTier } = badge;
      const startIndex =
        badgeTiers.findIndex((t) => Number(t.tier) === Number(tier)) + 1;
      const endIndex = badgeTiers.findIndex(
        (t) => Number(t.tier) === Number(claimableTier)
      );

      if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) {
        return totalSum;
      }

      const tierPoints = badgeTiers
        .slice(startIndex, endIndex + 1)
        .reduce((tierSum, { metadata }) => {
          return tierSum + Number(metadata!.points);
        }, 0);
      return totalSum + tierPoints;
    }, 0);
  }

  public getBadgeUpdates(
    badges: ResponseBadge[]
  ): { badgeId: number; level: number; points: number }[] {
    return badges
      .filter(({ claimable }) => claimable)
      .map((badge) => ({
        badgeId: badge.badgeId,
        level: badge.claimableTier!,
        points: Number(badge.points),
        previousLevel: badge.tier,
      }));
  }

  public async getBadgeMetadata(badge: Badge) {
    const CACHE_KEY = `badge:${badge.badge.uri}`;
    const ttl = -1;

    const fetchFunction = async () => {
      const metadataJson = await IpfsService.getIPFSData(badge.badge.uri);
      try {
        const metadata = JSON.parse(metadataJson);
        return metadata;
      } catch (error) {
        console.debug(badge.badge.uri);
        console.error(
          `Error parsing JSON from IPFS (Badge metadata): ${error}`
        );
        return null;
      }
    };

    return redisService.getCachedDataWithCallback(
      CACHE_KEY,
      fetchFunction,
      ttl
    );
  }

  public async getBadgeLevelMetadata(
    badgeLevel: Badge['badge']['badgeTiers'][0]
  ) {
    const CACHE_KEY = `badgeLevel:${badgeLevel.uri}`;
    const ttl = -1;
    const fetchFunction = async () => {
      const metadataJson = await IpfsService.getIPFSData(badgeLevel.uri);
      try {
        const metadata = JSON.parse(metadataJson);
        return { tier: badgeLevel, metadata };
      } catch (error) {
        console.debug(badgeLevel.uri);
        console.error(
          `Error parsing JSON from IPFS (Badge Tier metadata): ${error}`
        );
        throw new Error('Error parsing JSON from IPFS');
      }
    };

    return redisService.getCachedDataWithCallback(
      CACHE_KEY,
      fetchFunction,
      ttl
    );
  }

  private async updateBadgeDataForAccount(
    eoas: string[],
    badgeData: Badge,
    extraData: any | undefined
  ) {
    try {
      const strategy = BadgeStrategyContext.getBadgeStrategy(badgeData.badge.metadata!.name);
      const badgeResponse = await strategy.calculateTier(
        eoas,
        badgeData, extraData
      );
      this.badges.push(badgeResponse);
    } catch (error) {
      console.error(
        'Error updating badge data:',
        badgeData.badge.badgeId,
        badgeData.badge.metadata,
        error
      );
      this.badges = this.badges.filter(
        (b) => b.badgeId !== badgeData.badge.badgeId
      );
    }
  }
}
