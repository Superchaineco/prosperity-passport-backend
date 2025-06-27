import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";


export class FarcasterConnectionStrategy extends BaseBadgeStrategy {


    async getValue(eoas: string[], extraData: any | undefined): Promise<boolean> {

        const account = extraData.account
        const cacheKey = `farcasterLink-${account}`;
        const data = await redisService.getCachedData(cacheKey)
        console.log('Farcaster data:', data, 'for account:', account);
        const isClaimable = data?.signature.state == 'completed' ? true : false
        console.log("IsClaimable:", isClaimable)
        return isClaimable;
    }


}