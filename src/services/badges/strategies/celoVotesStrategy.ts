import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";
import { DuneClient } from "@duneanalytics/client-sdk";

export class CeloVotesStrategy extends BaseBadgeStrategy {

  dune = new DuneClient(process.env.DUNE_API_KEY!);

  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `celoVotes-${eoas.join(",")}`;
    const ttl = 86400;

    const fetchFunction = async () => {
      let totalVotes = 0;
      const dune_response  = await this.dune.getLatestResult({queryId: 3209131});
      for (const eoa of eoas) {
        const celo_votes = dune_response.result?.rows.find((row: any) => row.voter.toLowerCase() === eoa.toLowerCase())
        if (celo_votes) {
          totalVotes += celo_votes.proposals_voted as number
        }
      }
      return totalVotes;
    }

    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}