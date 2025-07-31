import { redisService } from "@/services/redis.service";
import axios from "axios";
import { BaseBadgeStrategy } from "./badgeStrategy";
import { BLOCKSCOUT_API_KEY } from "@/config/superChain/constants";

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
            const total = await eoas.reduce(async (accPromise, eoa) => {
                const response = await axios.get(
                    `https://celo.blockscout.com/api?module=account&action=txlist&address=${eoa}&sort=asc&startblock=${this.season.startBlock}&endblock=${this.season.endBlock}&apikey=${BLOCKSCOUT_API_KEY}`
                );
                const count = response.data.result.filter(
                    (tx: any) => tx.from.toLowerCase() === eoa.toLowerCase()
                ).length;
                return (await accPromise) + count;
            }, Promise.resolve(0));

            return total;
        };

        return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
    }
}