import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";
import { Address, createPublicClient, http } from "viem";
import { celo } from "viem/chains";

export class CeloTransactionsStrategy extends BaseBadgeStrategy {

  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `celoTransactions-${eoas.join(",")}`;
    const ttl = 86400; // 1 día

    const fetchFunction = async () => {
      const publicClient = createPublicClient({
        chain: celo,
        transport: http(),
      })
      let transactionCount = 0
      for (const eoa of eoas) {
        const transactions = await publicClient.getTransactionCount({
          address: eoa as Address
        })
        transactionCount += transactions
      }
      return transactionCount;
    }
    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}