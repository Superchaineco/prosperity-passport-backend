import { BaseBadgeStrategy } from "./badgeStrategy";
import fs from 'fs';
import csv from 'csv-parser';
type CsvRow = {
    Address: string;
    Tier: string;
};



export class GovContributorStrategy extends BaseBadgeStrategy {

    private season: string;
    constructor(seasonCode: string) {
        super();
        this.season = seasonCode

    }
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
        const csvData = await this.loadCsvData(`src/data/govContributor-${this.season}.csv`);
        for (const eoa of eoas) {
            const celoCitizen = csvData.find(
                (row) => row.Address && row.Address.toLowerCase() === eoa.toLowerCase()
            );
            if (celoCitizen) {
                return parseInt(celoCitizen.Tier);
            }
        }
        return 0;
    }
}



