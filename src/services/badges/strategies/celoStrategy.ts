import { redisService } from '@/services/redis.service';
import axios from 'axios';
import { BaseBadgeStrategy } from './badgeStrategy';
import { formatUnits } from 'ethers';

const MERKL_API_URL = 'https://api.merkl.xyz/v4/users';
const CELO_TOKEN_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const CELO_CHAIN_ID = 42220;

interface MerklReward {
  distributionChainId: number;
  amount: string;
  claimed: string;
  pending: string;
  token: {
    address: string;
    chainId: number;
    symbol: string;
    decimals: number;
    price: number;
  };
}

interface MerklResponse {
  rewards?: MerklReward[];
}

export class CeloMerklStrategy extends BaseBadgeStrategy {
  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `celoMerkl-${eoas.join(',')}`;
    const ttl = 3600; // 1 hour

    const fetchFunction = async () => {
      let totalRewards = BigInt(0);

      // Fetch Merkl rewards for each EOA
      for (const eoa of eoas) {
        try {
          const url = `${MERKL_API_URL}/${eoa}/rewards?chainId=${CELO_CHAIN_ID}&reloadChainId=${CELO_CHAIN_ID}&test=false&claimableOnly=false&breakdownPage=0&type=TOKEN`;

          const response = await axios.get(url, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = Array.isArray(response.data) ? response.data : [];

          for (const chainData of data) {
            if (!chainData.rewards || !Array.isArray(chainData.rewards)) {
              continue;
            }

            const cUsdRewards = chainData.rewards.filter(
              (reward: MerklReward) =>
                reward.token.address.toLowerCase() ===
                CELO_TOKEN_ADDRESS.toLowerCase()
            );

            for (const reward of cUsdRewards) {
              const amount = BigInt(reward.claimed);
              console.debug(`Celo Reward for ${eoa}:`, formatUnits(amount, 18));
              totalRewards += amount;
            }
          }
        } catch (error) {
          console.error(
            `Error fetching Merkl rewards for ${eoa}:`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }

      return Number(formatUnits(totalRewards, 18));
    };

    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}
