import { BaseBadgeStrategy } from './badgeStrategy';
import fs from 'fs';
import csv from 'csv-parser';

type CsvRow = {
  Address: string;
  Amount: number;
};

export class ProofOfShipStrategy extends BaseBadgeStrategy {
  private async loadCsvData(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: CsvRow) => {
          // Asegurar que Amount sea número
          if (data.Amount) {
            data.Amount = Number(data.Amount);
          }
          results.push(data);
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  async getValue(eoas: string[]): Promise<number> {
    const csvData = await this.loadCsvData('src/data/proofOfShip.csv');
    let totalAmount = 0;

    for (const eoa of eoas) {
      const proofOfShip = csvData.find(
        (row) => row.Address && row.Address.toLowerCase() === eoa.toLowerCase()
      );
      if (proofOfShip) {
        totalAmount += proofOfShip.Amount;
      }
    }

    return totalAmount;
  }
}
