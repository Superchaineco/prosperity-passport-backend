import { Perk } from "./perks.service";
import config from "../config/perks.json";
import { ethers, JsonRpcProvider } from "ethers";
import { JSON_RPC_PROVIDER } from "../config/superChain/constants";
import sponsorshipValues from "../data/sponsorship.values.json";
import { redisService } from "./redis.service"; // Importar RedisService

export class PerksHelper {
    private readonly config: typeof config;

    constructor() {
        this.config = config;
    }


    public getSponsorPerks(accountLevel: number): Perk {

        const maxSponsorshipValue = sponsorshipValues.levels[accountLevel].relayTransactions;

        return {
            name: "SponsoredTxns",
            value: maxSponsorshipValue,
        };
    }
}
