import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";
import { Address, createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import axios from "axios";
import { BLOCKSCOUT_API_KEY } from "@/config/superChain/constants";

// export class CeloTransactionsStrategy extends BaseBadgeStrategy {

//   async getValue(eoas: string[]): Promise<number> {
//     const cacheKey = `celoTransactions-${eoas.join(",")}`;
//     const ttl = 3600; // 1 día

//     const fetchFunction = async () => {
//       const publicClient = createPublicClient({
//         chain: celo,
//         transport: http(),
//       })
//       let transactionCount = 0
//       for (const eoa of eoas) {
//         const transactions = await publicClient.getTransactionCount({
//           address: eoa as Address
//         })
//         transactionCount += transactions
//       }
//       return transactionCount;
//     }
//     return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
//   }
// }

export class CeloTransactionsStrategy extends BaseBadgeStrategy {


  async getValue(eoas: string[]): Promise<number> {
      const cacheKey = `celoTransactions-${eoas.join(",")}`;
      const ttl = 3600

      const fetchFunction = async () => {
          const transactions = eoas.reduce(async (accPromise, eoa) => {
              const response = await axios.get(`https://celo.blockscout.com/api?module=account&action=txlist&address=${eoa}&sort=asc&startblock=0&endblock=31056500&apikey=${BLOCKSCOUT_API_KEY}`)
              console.log({response: response.data});
              const transactions = response.data.result.filter((tx: any) => tx.from.toLowerCase() === eoa.toLowerCase()).length;
              return (await accPromise) + transactions;
          }, Promise.resolve(0));

          return transactions;
      };

      return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}