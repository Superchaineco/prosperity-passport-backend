import { BaseBadgeStrategy } from './badgeStrategy';
import fs from 'fs';
import csv from 'csv-parser';

type CsvRow = {
  'Wallet Address': string;
  amount: string;
  Tier: string;
};

type ParsedRow = {
  address: string;
  amount: number;
  tier: number;
};

export class ProofOfShipStrategy extends BaseBadgeStrategy {
  private async loadCsvData(filePath: string): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
      const results: ParsedRow[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: CsvRow) => {
          // Parsear amount removiendo comas y convirtiendo a número
          const rawAmount = data.amount || '0';
          const cleanAmount = rawAmount.replace(/,/g, '');
          const amount = Number(cleanAmount) || 0;
          
          results.push({
            address: (data['Wallet Address'] || '').toLowerCase(),
            amount,
            tier: Number(data.Tier) || 0,
          });
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
        (row) => row.address === eoa.toLowerCase()
      );
      if (proofOfShip) {
        totalAmount += proofOfShip.amount;
      }
    }

    return totalAmount;
  }
}
