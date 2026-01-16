import { redisService } from "@/services/redis.service";
import { BaseBadgeStrategy } from "./badgeStrategy";
import { Network } from "alchemy-sdk";

type Season = {
    code: string;
    fromDate: Date;
    toDate: Date;
    startBlock: number;
    endBlock: number;
};

const Seasons: Season[] = [

    {
        code: "S1",
        fromDate: new Date(Date.UTC(2025, 6, 31, 0, 0, 0, 0)),
        toDate: new Date(Date.UTC(2025, 11, 24, 23, 59, 59, 999)),
        startBlock: 42019242,
        endBlock: 54720042,
    }
];
export class CeloSeasonedTransactionsStrategy extends BaseBadgeStrategy {
    private season: Season;


    constructor(seasonCode: string) {
        super();
        this.season = Seasons.find((s) => s.code === seasonCode);
        if (!this.season) {
            throw new Error(`Season code "${seasonCode}" not found`);
        }

    }

    async getValue(eoas: string[]): Promise<number> {
        const cacheKey = `celoTxs-${this.season.code}-${eoas.join(",")}`;
        const ttl = 3600;

        const fetchFunction = async () => {
            return await this.getAlchemyTransactionsCount("celo", Network.CELO_MAINNET, eoas, this.season.code, this.season.startBlock, this.season.endBlock);
        };

        return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
    }
}