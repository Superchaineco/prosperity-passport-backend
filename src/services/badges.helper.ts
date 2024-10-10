import { Alchemy, AssetTransfersCategory, Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { CovalentClient } from "@covalenthq/client-sdk";
import fs from "fs";
import csv from "csv-parser";
import { redisService } from "./redis.service"; // Importar RedisService
import axios from "axios";
import { get } from "http";
import { join } from "path";
import { env } from "process";
import { http, createPublicClient, Address } from 'viem'
import { celo } from 'viem/chains'

type CsvRow = {
  Address: string;
  ENS: string;
};

type TalentPassport = {
  passport: {
    score: number;
  }
}

type PassportCredential = {
  passport_credentials: {
    name: string;
    value: string;
  }[]
}

const CitizenFilePath = "src/data/citizen.csv";

export class BadgesHelper {
  covalent = new CovalentClient(process.env.COVALENT_API_KEY!);


  async getCeloGenesis(eoas: string[]) {
    const cacheKey = `celoGenesis-${eoas.join(",")}`;

    const fetchFunction = async () => {
      let olderTxnTimestamp = Date.now();
      eoas.forEach(async eoa => {
        const transactions = await axios.get(`https://explorer.celo.org/mainnet/api?module=account&action=txlist&address=${eoa}&sort=asc`)
        if (transactions.data.result.length > 0) {
          const olderTransaction = transactions.data.result[0]
          if (olderTransaction.timeStamp < olderTxnTimestamp) {
            olderTxnTimestamp = olderTransaction.timeStamp;
          }
        }
      }
    )
    return olderTxnTimestamp;
    };
    return redisService.getCachedData(cacheKey, fetchFunction);
  }

  async getCeloTransactions(eoas: string[]) {
    const cacheKey = `celoTransactions-${eoas.join(",")}`;
    const ttl = 86400; // 1 día

    const fetchFunction = async () => {
      const publicClient = createPublicClient({
        chain: celo,
        transport: http(),
      })
      let transactionCount = 0
      for (const eoa of eoas) {
        const transactions = await publicClient.getTransactionCount({
          address: eoa as Address
        })
        transactionCount += transactions
      }
      return transactionCount;
    }
    return redisService.getCachedData(cacheKey, fetchFunction, ttl);
  }

  // async isCitizen(eoas: string[]) {
  //   const csvData = await this.loadCsvData(CitizenFilePath);

  //   for (const eoa of eoas) {
  //     const citizen = csvData.find((row) =>
  //       row.Address
  //         ? row.Address.toLocaleLowerCase() === eoa.toLowerCase()
  //         : false,
  //     );
  //     if (citizen) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }


  // async getGivethDonations(eoas: string[]) {
  //   const cacheKey = `givethDonations-${eoas.join(",")}`;
  //   const ttl = 86400; // 1 día

  //   const fetchFunction = async () => {
  //     const givethApiUrl = "https://mainnet.serve.giveth.io/graphql";

  //     const donationsQuery = `
  //       query AddressGivethDonations($fromWalletAddresses: [String!]!) {
  //       donationsFromWallets(fromWalletAddresses: $fromWalletAddresses) {
  //         valueUsd
  //         createdAt
  //         }
  //       }
  //       `;
  //     const query = {
  //       query: donationsQuery,
  //       variables: {
  //         fromWalletAddresses: [...eoas],
  //       },
  //     };

  //     try {
  //       const response = await fetch(givethApiUrl, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(query),
  //       });

  //       const res = await response.json();
  //       if (!res?.data?.donationsFromWallets) return 0;

  //       return (
  //         res.data.donationsFromWallets as {
  //           valueUsd: number;
  //           createdAt: string;
  //         }[]
  //       ).reduce((total, d) => total + d.valueUsd, 0);
  //     } catch (error) {
  //       console.log(error);
  //       return 0;
  //     }
  //   };

  //   return redisService.getCachedData(cacheKey, fetchFunction, ttl);
  // }

  // async getGitcoinDonations(eoas: string[]) {
  //   const cacheKey = `gitcoinDonations-${eoas.join(",")}`;
  //   const ttl = 86400; // 1 día

  //   const fetchFunction = async () => {
  //     const gitcoinIndexerUrl =
  //       "https://grants-stack-indexer-v2.gitcoin.co/graphql";
  //     const gitcoinDonationsQuery = `query getGitcoinDonations($fromWalletAddresses: [String!]) {
  //   donations(filter: { donorAddress: {in: $fromWalletAddresses}}) {
  //     amountInUsd
  //   }
  // }`;

  //     try {
  //       const res = await fetch(gitcoinIndexerUrl, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           query: gitcoinDonationsQuery,
  //           variables: { fromWalletAddresses: eoas },
  //         }),
  //       }).then((r) => r.json());

  //       console.log(res);
  //       const donations: { amountInUsd: number }[] = res.data?.donations || [];
  //       return donations.reduce((sum, d) => sum + d.amountInUsd, 0);
  //     } catch {
  //       return 0;
  //     }
  //   };

  //   return redisService.getCachedData(cacheKey, fetchFunction, ttl);
  // }



  async getTalentScore(eoas: string[]) {
    const cacheKey = `talentScore-${eoas.join(",")}`;
    const ttl = 86400; // 1 día

    const fetchFunction = async () => {
      let highestTalentScore = 0;
      for (const eoa of eoas) {
        const talentPassport = await axios.get<TalentPassport>(`https://api.talentprotocol.com/api/v2/passports/${eoa}`, {
          headers: {
            "x-api-key": process.env.TALENT_API_KEY!
          }
        })
        if (talentPassport.data.passport.score > highestTalentScore) {
          highestTalentScore = talentPassport.data.passport.score;
        }
      }
      return highestTalentScore;
    };

    return redisService.getCachedData(cacheKey, fetchFunction, ttl);
  }

  private async loadCsvData(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data: CsvRow) => results.push(data))
        .on("end", () => resolve(results));
    });
  }
}
export interface IBadgesHelper {
  getCeloGenesis(eoas: string[]): Promise<number>;
  getCeloTransactions(eoas: string[]): Promise<number>;
  getTalentScore(eoas: string[]): Promise<number>;
}