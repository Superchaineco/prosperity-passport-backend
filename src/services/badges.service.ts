import { BadgesHelper, type IBadgesHelper } from "./badges.helper";
import {
  GetUserBadgesDocument,
  GetUserBadgesQuery,
  GetUserBadgesQueryVariables,
  execute,
} from "../../.graphclient";
import type { ExecutionResult } from "graphql";
import IpfsService from "./ipfs.service";
import { redisService } from "./redis.service"; // Importar RedisService

export type Badge = GetUserBadgesQuery["accountBadges"][number];
export type ResponseBadge = {
  points: string;
  tier: string;
} & Badge["badge"] & {
  claimableTier: number | null;
  claimable: boolean;
};

export class BadgesServices {
  private badges: ResponseBadge[] = [];
  private helper: IBadgesHelper;

  constructor() {
    this.helper = new BadgesHelper();
  }

  public async getBadges(eoas: string[], account: string): Promise<any[]> {
    const { data, errors }: ExecutionResult<GetUserBadgesQuery> = await execute(
      GetUserBadgesDocument,
      {
        user: account,
      } as GetUserBadgesQueryVariables,
    );
    if (errors) {
      console.error("Error fetching badges:", errors);
      throw new Error("Error fetching badges");
    }
    const accountBadgesIds =
      data?.accountBadges.map((accountBadge) => accountBadge.badge.badgeId) ??
      [];
    const unclaimedBadges = (
      data!.badges?.filter(
        (badge) => !accountBadgesIds.includes(badge.badgeId),
      ) ?? []
    ).map((badge) => ({
      tier: 0,
      points: 0,
      badge: {
        ...badge,
      },
    }));

    const activeBadges = [
      ...(data?.accountBadges ?? []).map((badge) => ({
        ...badge,
        tier: parseInt(badge.tier),
        points: parseInt(badge.points),
      })),
      ...unclaimedBadges,
    ] as Badge[];
    const promises = activeBadges.flatMap((badge) =>
      badge.badge.badgeTiers.map((tier) => this.getBadgeLevelMetadata(tier)),
    );
    const results = await Promise.all(promises);

    for (const badge of activeBadges) {
      badge.badge["metadata"] = await this.getBadgeMetadata(badge);
      badge.badge.badgeTiers.forEach((tier) => {
        const result = results.find((res) => res.tier.uri === tier.uri);
        if (result) {
          tier["metadata"] = result.metadata;
        }
      });
    }

    for (const badge of activeBadges) {
      try {
        await this.updateBadgeDataForAccount(eoas, badge);
      } catch (e) {
        console.error(
          "Error updating badge data:",
          badge.badge.badgeId,
          badge.badge.metadata,
          e,
        );
      }
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
        (t) => Number(t.tier) === Number(claimableTier),
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
    badges: ResponseBadge[],
  ): { badgeId: number; level: number }[] {
    return badges
      .filter(({ claimable }) => claimable)
      .map(({ badgeId, claimableTier }) => ({
        badgeId,
        level: claimableTier!,
      }));
  }

  public async getBadgeMetadata(badge: Badge) {
    const CACHE_KEY = `badge:${badge.badge.uri}`;
    const ttl = 3600; // 1 hora

    const fetchFunction = async () => {
      const metadataJson = await IpfsService.getIPFSData(badge.badge.uri);
      try {
        const metadata = JSON.parse(metadataJson);
        return metadata;
      } catch (error) {
        console.error(`Error parsing JSON from IPFS: ${error}`);
        return null;
      }
    };

    return redisService.getCachedData(CACHE_KEY, fetchFunction, ttl);
  }

  public async getBadgeLevelMetadata(badgeLevel: Badge["badge"]["badgeTiers"][0]) {
    const CACHE_KEY = `badgeLevel:${badgeLevel.uri}`;
    const ttl = 3600; // 1 hora
    const fetchFunction = async () => {
      const metadataJson = await IpfsService.getIPFSData(badgeLevel.uri);
      try {
        const metadata = JSON.parse(metadataJson);
        return { tier: badgeLevel, metadata };
      } catch (error) {
        console.error(`Error parsing JSON from IPFS: ${error}`);
        throw new Error("Error parsing JSON from IPFS");
      }
    };

    return redisService.getCachedData(CACHE_KEY, fetchFunction, ttl);
  }

  private async updateBadgeDataForAccount(eoas: string[], badgeData: Badge) {
    switch (badgeData.badge.metadata!.name) {
      case "Celo genesis":
        const celoGenesis =
          await this.helper.getCeloGenesis(eoas);
        if (!badgeData.badge.badgeTiers)
          throw new Error("No tiers found for badge");
        let celoGenesisTier = 0;
        for (let i = badgeData.badge.badgeTiers.length - 1; i >= 0; i--) {
          if (
            celoGenesis <=
            badgeData.badge.badgeTiers[i].metadata!.minValue
          ) {
            celoGenesisTier = i + 1;
            break;
          }
        }
        this.badges.push({
          ...badgeData.badge,
          points: badgeData.points,
          tier: badgeData.tier,
          claimableTier: celoGenesisTier,
          claimable: celoGenesisTier ? badgeData.tier < celoGenesisTier : false,
        });

        break;

      case "Celo Transactions":
        const celoTransactions =
          await this.helper.getCeloTransactions(eoas);
        if (!badgeData.badge.badgeTiers)
          throw new Error("No tiers found for badge");
        let celoTransactionsTier = 0;
        for (let i = badgeData.badge.badgeTiers.length - 1; i >= 0; i--) {
          if (
            celoTransactions >=
            badgeData.badge.badgeTiers[i].metadata!.minValue
          ) {
            celoTransactionsTier = i + 1;
            break;
          }
        }
        this.badges.push({
          ...badgeData.badge,
          points: badgeData.points,
          tier: badgeData.tier,
          claimableTier: celoTransactionsTier,
          claimable: celoTransactionsTier ? badgeData.tier < celoTransactionsTier : false,
        });
        break;
        
      case "Talent Protocol score":
        const talentScore = await this.helper.getTalentScore(eoas);
        let talentScoreTier = 0;
        for (let i = badgeData.badge.badgeTiers.length - 1; i >= 0; i--) {
          if (
            talentScore >= badgeData.badge.badgeTiers[i].metadata!.minValue
          ) {
            talentScoreTier = i + 1;
            break;
          }
        }
        this.badges.push({
          ...badgeData.badge,
          points: badgeData.points,
          tier: badgeData.tier,
          claimableTier: talentScoreTier,
          claimable: talentScoreTier ? badgeData.tier < talentScoreTier : false,
        });
        break;
    }

  }
}