import { BaseBadgeStrategy } from "./badgeStrategy";
import fs from "fs";
import csv from "csv-parser";

type CsvRow = {
    Address: string;
    ENS: string;
};

export class CeloGovernanceGuardianStrategy extends BaseBadgeStrategy {

    private async loadCsvData(filePath: string): Promise<CsvRow[]> {
        return new Promise((resolve, reject) => {
            const results: CsvRow[] = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("data", (data: CsvRow) => results.push(data))
                .on("end", () => resolve(results));
        });
    }

    async getValue(eoas: string[]): Promise<boolean> {
        const csvData = await this.loadCsvData("src/data/celoGovernanceGuardian.csv");
        for (const eoa of eoas) {
          const governanceGuardian = csvData.find((row) => row.Address.toLowerCase() === eoa.toLowerCase());
          if (governanceGuardian) {
            return true;
          }
        }
        return false;
    }
}