import { BaseBadgeStrategy } from "./badgeStrategy";
import fs from 'fs';
import csv from 'csv-parser';
type CsvRow = {
    Address: string;
    Tier: string;
};



export class TDFContributorStrategy extends BaseBadgeStrategy {

 
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
        const csvData = await this.loadCsvData(`src/data/tdfContributor.csv`);
        for (const eoa of eoas) {
            const data = csvData.find(
                (row) => row.Address && row.Address.toLowerCase() === eoa.toLowerCase()
            );
            if (data) {
                return parseInt(data.Tier);
            }
        }
        return 0;
    }
}