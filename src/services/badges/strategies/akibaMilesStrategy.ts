import { redisService } from '@/services/redis.service';
import axios from 'axios';
import { BaseBadgeStrategy } from './badgeStrategy';

const AKIBA_SUBGRAPH_URL =
  'https://api.studio.thegraph.com/query/115307/akiba-v-2/version/latest';

const MINTS_QUERY = `
  query GetAkibaMints($user: String!) {
    transfers(
      where: { to: $user, from: "0x0000000000000000000000000000000000000000" }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      value
      blockTimestamp
    }
  }
`;

export class AkibaMilesStrategy extends BaseBadgeStrategy {
  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `akibaLifeMiles-${eoas.join(',')}`;
    const ttl = 3600; // 1 hour

    const fetchFunction = async () => {
      let totalEarned = 0;

      // Fetch AkibaMiles for each EOA
      for (const eoa of eoas) {
        try {
          const response = await axios.post(
            AKIBA_SUBGRAPH_URL,
            {
              query: MINTS_QUERY,
              variables: {
                user: eoa.toLowerCase(),
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const data = response.data?.data;

          if (!data || !Array.isArray(data.transfers)) {
            continue;
          }

          // Sum all minted AkibaMiles (convert from 18 decimals)
          const mints = data.transfers;
          for (const mint of mints) {
            const amount = Number(mint.value) / 1e18;
            totalEarned += amount;
          }
        } catch (error) {
          console.error(
            `Error fetching AkibaMiles for ${eoa}:`,
            error instanceof Error ? error.message : 'Unknown error'
          );
          // Continue with other EOAs if one fails
        }
      }

      return Math.floor(totalEarned); // Return as integer
    };

    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}
