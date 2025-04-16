import { BaseBadgeStrategy } from './badgeStrategy';
import fs from 'fs';
import csv from 'csv-parser';

type CsvRow = {
  Address: string;
  Tier: string;
};

export class GreenPillMemberStrategy extends BaseBadgeStrategy {
  private async loadCsvData(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: CsvRow) => results.push(data))
        .on('end', () => resolve(results));
    });
  }

  async getValue(eoas: string[]): Promise<number> {
    const csvData = await this.loadCsvData('src/data/greenPillMember.csv');
    for (const eoa of eoas) {
      const greenPillMember = csvData.find(
        (row) => row.Address.toLowerCase() === eoa.toLowerCase()
      );
      if (greenPillMember) {
        return parseInt(greenPillMember.Tier);
      }
    }
    return 0;
  }
}
