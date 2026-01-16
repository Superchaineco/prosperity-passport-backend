import { redisService } from "@/services/redis.service";
import { BaseBadgeStrategy, DEFAULT_TTL } from "./badgeStrategy";
import {  Network } from "alchemy-sdk";



export class Celo2TransactionsStrategy extends BaseBadgeStrategy {


    async getValue(eoas: string[]): Promise<number> {
        const cacheKey = `celo2Transactions-${eoas.join(",")}`;

        const fetchFunction = async () => {         
            return await this.getAlchemyTransactionsCount("celo2", Network.CELO_MAINNET, eoas, "0", 31056500, 99999999);
        };

        return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, DEFAULT_TTL);
    }

}