import { Contract, ethers, JsonRpcProvider } from "ethers";
import {
  JSON_RPC_PROVIDER,
  SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
  SUPER_CHAIN_MODULE_ABI,
} from "../config/superChain/constants";
import Safe from "@safe-global/protocol-kit";
import { ExecutionResult } from "graphql";
import {
  GetUserBadgesDocument,
  GetUserBadgesQuery,
  GetUserBadgesQueryVariables,
  execute,
} from "../../.graphclient";
import { BadgesServices } from "./badges.service";

export class SuperChainAccountService {
  superChainAccount: Contract;

  constructor() {
    this.superChainAccount = new Contract(
      SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
      SUPER_CHAIN_MODULE_ABI,
      new JsonRpcProvider(JSON_RPC_PROVIDER),
    );
  }

  async getEOAS(address: string): Promise<string[]> {
    try {
      const protocolKit = await Safe.init({
        provider: JSON_RPC_PROVIDER,
        safeAddress: address,
      });
      return await protocolKit.getOwners();
    } catch (error) {
      console.error(error);
      throw new Error("Error getting EOAS");
    }
  }
  async getIsLevelUp(recipent: string, points: number): Promise<boolean> {
    return await this.superChainAccount.simulateIncrementSuperChainPoints(
      points,
      recipent,
    );
  }
  async getSuperChainSmartAccount(address: string): Promise<string> {
    const response = await this.superChainAccount.getSuperChainAccount(address);
    return response;
  }
  async getSuperChainSmartAccountBadges(address: string) {
    const { data, errors }: ExecutionResult<GetUserBadgesQuery> = await execute(
      GetUserBadgesDocument,
      {
        user: address,
      } as GetUserBadgesQueryVariables,
    );

    if (errors) return;

    const badgeServices = new BadgesServices();

    const tierPromises = data!.accountBadges.flatMap((badge) =>
      badge.badge.badgeTiers.map((tier) =>
        badgeServices.getBadgeLevelMetadata(tier),
      ),
    );
    const tierResults = await Promise.all(tierPromises);
    for (const badge of data!.accountBadges) {
      badge.badge.metadata = await badgeServices.getBadgeMetadata(badge);
      badge.badge.badgeTiers.forEach((tier) => {
        const result = tierResults.find((res) => res.tier === tier);
        if (result) {
          tier["metadata"] = result.metadata;
        }
      });
    }
    return data!.accountBadges;
  }

  public async isOwnerOfSmartAccount(wallet: string, account: string): Promise<boolean> {
    const owners = await this.getEOAS(account);
    return owners.includes(wallet);
  }
  
  async getAccountLevel(account: string): Promise<number> {
    const superChainSmartAccount = await this.getSuperChainSmartAccount(account);
    const accountLevel = Number(superChainSmartAccount[3]);
    return accountLevel;
  }


}
const superChainAccountService = new SuperChainAccountService();
export { superChainAccountService };
