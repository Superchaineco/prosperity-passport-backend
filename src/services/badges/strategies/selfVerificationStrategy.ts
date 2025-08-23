import { redisService } from "@/services/redis.service";
import { BaseBadgeStrategy } from "./badgeStrategy";
import { getAccountByAddress, setAccountNationality } from "@/services/account.service";

export class SelfVerificationStrategy extends BaseBadgeStrategy {


    async getValue(eoas: string[], extraData: any | undefined): Promise<boolean> {


        const account = extraData.account

        const accountData = await getAccountByAddress(account)
        let nationality = accountData?.nationality == '' || !accountData?.nationality ? null : accountData.nationality!
        if (!nationality && !extraData.selfUserId)
            return false
        console.log('Self data:', nationality, 'for account:', account, ' with preid', extraData.selfUserId);

        if (!nationality) {
            const cache_pre_key = `self_id_pre:${extraData.selfUserId}`
            const preSelfData = await redisService.getCachedData(cache_pre_key)
            if (preSelfData) {
                setAccountNationality(account, preSelfData.nationality)
                nationality = preSelfData.nationality
                await redisService.deleteCachedData(cache_pre_key);

            } else {
                return false
            }
        }
        if (nationality)
            return true
        return false

    }
}