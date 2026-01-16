import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";
import axios from "axios";
import { Network } from "alchemy-sdk";

export class SoneiumTransactionsStrategy extends BaseBadgeStrategy {


    async getValue(eoas: string[]): Promise<number> {
        const cacheKey = `soneiumTransactions-${eoas.join(",")}`;
        const ttl = 3600

        const fetchFunction = async () => {


            return await this.getAlchemyTransactionsCount("soneium", Network.SONEIUM_MAINNET, eoas, "0", 0, 99999999);
        };

        return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
    }
}