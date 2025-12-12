import { BaseBadgeStrategy } from './badgeStrategy';
import { redisService } from '../../redis.service';
import * as fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

type CsvRow = Record<string, string>;

export class GlodollarStrategy extends BaseBadgeStrategy {
  private async loadCsvData(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: CsvRow) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err: Error) => reject(err));
    });
  }

  async getValue(eoas: string[]): Promise<number> {
    const cacheKey = `glodollar-${eoas.join(',')}`;
    const ttl = 3600;

    const fetchFunction = async () => {
      const csvCacheKey = 'usd_glodollar_parsed';

      const rows: CsvRow[] = await redisService.getCachedDataWithCallback(
        csvCacheKey,
        async () => await this.loadCsvData('src/data/usdGloo.csv'),
        86400
      );

      if (!rows || rows.length === 0) return 0;

      const addrMap: Record<string, CsvRow> = {};
      for (const r of rows) {
        if (!r.address) continue;
        addrMap[r.address.toLowerCase()] = r;
      }

      const toNum = (v?: string) => {
        const n = v ? Number(v) : 0;
        return isNaN(n) ? 0 : n;
      };

      const checkTierForRow = (row?: CsvRow): number => {
        if (!row) return 0;
        // New mapping: tier1 = DAYS_OVER_1 > 1, shift others +1
        if (toNum(row['DAYS_OVER_10000']) > 28) return 5; // > $5000 for >28 days
        if (toNum(row['DAYS_OVER_1000']) > 28) return 4; // > $1000 for >28 days
        if (toNum(row['DAYS_OVER_100']) > 28) return 3; // > $100 for >28 days
        if (toNum(row['DAYS_OVER_10']) > 7) return 2; // > $10 for >7 days
        if (toNum(row['DAYS_OVER_1']) > 1) return 1; // > $1 for >1 day (new)
        return 0;
      };

      let maxTier = 0;
      for (const eoa of eoas) {
        const row = addrMap[eoa.toLowerCase()];
        const t = checkTierForRow(row);
        if (t > maxTier) maxTier = t;
      }

      return maxTier;
    };

    return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, ttl);
  }
}
