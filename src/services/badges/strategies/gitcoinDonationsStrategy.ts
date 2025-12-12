import { BaseBadgeStrategy } from './badgeStrategy';
import { redisService } from '../../redis.service';
import axios from 'axios';

export class GitcoinDonationsStrategy extends BaseBadgeStrategy {
  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `gitcoinDonationss-${eoas.join(',')}`;
    const ttl = 60;

    const fetchFunction = async () => {
      const gitcoinIndexerUrl =
        'https://indexer.grantsstack.giveth.io/v1/graphql';
      const gitcoinDonationsQuery = `query getGitcoinDonations($fromWalletAddresses: [String!]) {
     donations(where: {  chainId: { _eq: 42220 }, donorAddress: {_in: $fromWalletAddresses}}) {
      amountInUsd
      chainId
    }
  }`;

      try {
        const res = await axios.post(
          gitcoinIndexerUrl,
          {
            query: gitcoinDonationsQuery,
            variables: {
              fromWalletAddresses: [...eoas.map((eoa) => eoa.toLowerCase())],
            },
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        // GraphQL responses put data under res.data.data
        const donations: { amountInUsd: number }[] = res.data?.data?.donations || [];
        return donations.reduce((sum, d) => sum + (d.amountInUsd || 0), 0);
      } catch (error) {
        console.debug('Gitcoin donations query error', error);
        return 0;
      }
    };

    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}
