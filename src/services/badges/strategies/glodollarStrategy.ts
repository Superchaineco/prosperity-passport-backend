import { BaseBadgeStrategy } from './badgeStrategy';
import { redisService } from '../../redis.service';
import { DuneClient } from '@duneanalytics/client-sdk';

export class GlodollarStrategy extends BaseBadgeStrategy {
  dune = new DuneClient(process.env.DUNE_API_KEY!);
  
  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `glodollar-${eoas.join(',')}`;
    const ttl = 3600;

    const fetchFunction = async () => {
      const dune_response = await redisService.getCachedDataWithCallback(
        'dune_glodollar',
        async () => await this.dune.getLatestResult({ queryId: 4312613, columns: ['address', 'tier'] }),
        86400
      );
      return dune_response.result?.rows.find((row: any) => eoas.map((eoa) => eoa.toLowerCase()).includes(row.address.toLowerCase()))?.tier as number || 0;
    };

    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}
