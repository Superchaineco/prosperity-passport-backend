import { BaseBadgeStrategy } from "./badgeStrategy";
import { redisService } from "../../redis.service";

export class GitcoinDonationsStrategy extends BaseBadgeStrategy {


    async getValue(eoas: string[]): Promise<number> {
        const cacheKey = `gitcoinDonations-${eoas.join(",")}`;
        const ttl = 86400;


        const fetchFunction = async () => {
            const gitcoinIndexerUrl =
                "https://grants-stack-indexer-v2.gitcoin.co/graphql";
            const gitcoinDonationsQuery = `query getGitcoinDonations($fromWalletAddresses: [String!]) {
    donations(filter: {  chainId: { equalTo: 42220 }, donorAddress: {in: $fromWalletAddresses}}) {
      amountInUsd
      chainId
    }
  }`;

            try {
                const res = await fetch(gitcoinIndexerUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: gitcoinDonationsQuery,
                        variables: { fromWalletAddresses: [...eoas.map(eoa => eoa.toLowerCase())] },
                    }),
                }).then((r) => r.json());

                console.debug({ res });
                const donations: { amountInUsd: number }[] = res.data?.donations || [];
                return donations.reduce((sum, d) => sum + d.amountInUsd, 0);
            } catch (error) {
                return 0;
            }
        };

        return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
    }
}