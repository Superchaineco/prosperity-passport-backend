import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";
import axios from "axios";

export class CeloGenesisStrategy extends BaseBadgeStrategy {

  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `celoGenesis-${eoas.join(",")}`;

    const fetchFunction = async () => {


      let olderTxnTimestamp = Math.floor(Date.now() / 1000);
      for (const eoa of eoas) {
        try {
          const response = await axios.get(`https://explorer.celo.org/mainnet/api?module=account&action=txlist&address=${eoa}&sort=asc`);
          const transactions = response.data.result;
          
          if (transactions.length > 0) {
            const olderTransaction = transactions[0];
            const txnTimestamp = Number(olderTransaction.timeStamp);
            
            if (txnTimestamp < olderTxnTimestamp) {
              olderTxnTimestamp = txnTimestamp;
            }
          }
        } catch (error) {
          console.error(`Error fetching transactions for address ${eoa}:`, error);
        }
      }
      return olderTxnTimestamp;
    };
    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction);
  }
}