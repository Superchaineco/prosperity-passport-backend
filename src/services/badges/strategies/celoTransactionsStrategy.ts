import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";
import { Network } from "alchemy-sdk";


export class CeloTransactionsStrategy extends BaseBadgeStrategy {


    async getValue(eoas: string[]): Promise<number> {
        const cacheKey = `celoTransactions-${eoas.join(",")}`;
        const ttl = 3600

        const fetchFunction = async () => {
            return await this.getAlchemyTransactionsCount("celo1", Network.CELO_MAINNET, eoas, "0", 0, 31056500);
        };

        return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
    }
}