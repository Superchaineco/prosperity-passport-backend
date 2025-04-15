import { BaseBadgeStrategy } from "./badgeStrategy";
import fs from "fs";
import csv from "csv-parser";

type CsvRow = {
    Address: string;
    Amount: number;
};

export class EcoCreditsStrategy extends BaseBadgeStrategy {

    private async loadCsvData(filePath: string): Promise<CsvRow[]> {
        return new Promise((resolve, reject) => {
            const results: CsvRow[] = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("data", (data: CsvRow) => results.push(data))
                .on("end", () => resolve(results));
        });
    }

    async getValue(eoas: string[]): Promise<number> {
        const csvData = await this.loadCsvData("src/data/ecoCredits.csv");
        let totalAmount = 0;
        
        for (const eoa of eoas) {
            const ecoCredits = csvData.find((row) => row.Address.toLowerCase() === eoa.toLowerCase());
            if (ecoCredits) {
                totalAmount += ecoCredits.Amount;
            }
        }
        
        return totalAmount;
    }
}