import { redisService } from "@/services/redis.service";
import { BaseBadgeStrategy } from "./badgeStrategy";

export class SelfVerificationStrategy extends BaseBadgeStrategy {


    async getValue(eoas: string[], extraData: any | undefined): Promise<boolean> {


        const account = extraData.account
        const cache_key = `self_id:${account}`
        let selfData = await redisService.getCachedData(cache_key)
        if (!selfData && !extraData.selfUserId)
            return false
        if (!selfData) {
            const cache_pre_key = `self_id_pre:${extraData.selfUserId}`
            const preSelfData = await redisService.getCachedData(cache_pre_key)
            if (preSelfData) {
                await redisService.setCachedData(cache_key, preSelfData, null);
                await redisService.deleteCachedData(cache_pre_key);
                selfData = await redisService.getCachedData(cache_key)
            } else {
                return false
            }
        }

        if (selfData?.nationality?.length > 0)
            return true
        return false

    }
}