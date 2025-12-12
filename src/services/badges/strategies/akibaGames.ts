import { redisService } from '@/services/redis.service';

import { BaseBadgeStrategy } from './badgeStrategy';
import { ethers } from 'ethers';
import { JSON_RPC_PROVIDER } from '@/config/superChain/constants';



export class AkibaGames extends BaseBadgeStrategy {
  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `akibaGames-${eoas.join(',')}`;
    const ttl = 3600; 

    const fetchFunction = async () => {
      const abi: readonly unknown[] = [
        "function playerStats(address) view returns (uint64,uint64,uint128,uint128)"
      ];
      const provider: ethers.JsonRpcProvider = new ethers.JsonRpcProvider(JSON_RPC_PROVIDER);

      const contractAddress: string =
        "0xf77e7395Aa5c89BcC8d6e23F67a9c7914AB9702a";

      const contract: ethers.Contract = new ethers.Contract(
        contractAddress,
        abi,
        provider
      );

      async function getTotalWon(player: string): Promise<string> {
        const result: readonly [
          bigint,
          bigint,
          bigint,
          bigint
        ] = await contract.playerStats(player);

        const totalWonWei: bigint = result[3];
        const totalWon: string = ethers.formatUnits(totalWonWei, 18);
        return totalWon;
      }
      let totalPoints = 0
      for (const eoa of eoas) {
        totalPoints += parseFloat(await getTotalWon(eoa));
      }

      return totalPoints

    };

    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}
