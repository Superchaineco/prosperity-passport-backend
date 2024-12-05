import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";
import axios from "axios";

type TalentPassport = {
  passport: {
    score: number;
  }
}



export class TalentScoreStrategy extends BaseBadgeStrategy {


    async getValue(eoas: string[]): Promise<number> {
        const cacheKey = `talentScore-${eoas.join(",")}`;
        const ttl = 3600;



        const fetchFunction = async () => {
            let highestTalentScore = 0;
            for (const eoa of eoas) {
                try {

                    const talentPassport = await axios.get<TalentPassport>(`https://api.talentprotocol.com/api/v2/passports/${eoa}`, {
                        headers: {
                            "x-api-key": process.env.TALENT_API_KEY!
                        }
                    })
                    if (!talentPassport.data) continue;
                    if (talentPassport.data.passport.score > highestTalentScore) {
                        highestTalentScore = talentPassport.data.passport.score;
                    }
                } catch (error) {
                    console.error(`Error fetching talent score for address ${eoa}:`, error);
                }
            }
            return highestTalentScore;
        };

        return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
    }
}