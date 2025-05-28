import { redisService } from "@/services/redis.service";
import { BaseBadgeStrategy } from "./badgeStrategy";

export class SelfVerificationStrategy extends BaseBadgeStrategy {

    private account: string;
    constructor(account: string) {
        super();
        this.account = account;
    }
    async getValue(eoas: string[]): Promise<boolean> {


        const cache_key = `self_id:${this.account.toUpperCase()}`
        //const cache_key = `self_id:${eoas.join(",")}`

        const selfData = redisService.getCachedData(cache_key)

        if (!selfData || Object.keys(selfData).length === 0) {
            return false
        }

        return true;

    }
}