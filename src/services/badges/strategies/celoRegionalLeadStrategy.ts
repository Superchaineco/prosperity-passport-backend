import { BaseBadgeStrategy } from './badgeStrategy';
import fs from 'fs';
import csv from 'csv-parser';

type CsvRow = {
  Address: string;
  ENS: string;
};

export class CeloRegionalLeadStrategy extends BaseBadgeStrategy {
  private async loadCsvData(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: CsvRow) => results.push(data))
        .on('end', () => resolve(results));
    });
  }

  async getValue(eoas: string[]): Promise<boolean> {
    const csvData = await this.loadCsvData('src/data/celoRegionalLead.csv');
    for (const eoa of eoas) {
      const stewards = csvData.find(
        (row) => row.Address && row.Address.toLowerCase() === eoa.toLowerCase()
      );
      if (stewards) {
        return true;
      }
    }
    return false;
  }
}
