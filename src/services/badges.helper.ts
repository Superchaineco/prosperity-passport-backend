import { CovalentClient } from "@covalenthq/client-sdk";
import fs from "fs";
import csv from "csv-parser";
import { redisService } from "./redis.service";
import axios from "axios";
import { http, createPublicClient, Address } from 'viem'
import { celo } from 'viem/chains'
import { DuneClient } from "@duneanalytics/client-sdk";

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
  dune = new DuneClient(process.env.DUNE_API_KEY!);


  async getCeloGenesis(eoas: string[]) {
    const cacheKey = `celoGenesis-${eoas.join(",")}`;

    const fetchFunction = async () => {


      let olderTxnTimestamp = Math.floor(Date.now() / 1000);
      for (const eoa of eoas) {
        try {
          const response = await axios.get(`https://explorer.celo.org/mainnet/api?module=account&action=txlist&address=${eoa}&sort=asc`);
          const transactions = response.data.result;
          
          if (transactions.length > 0) {
            const olderTransaction = transactions[0];
            const txnTimestamp = Number(olderTransaction.timeStamp);
            
            if (txnTimestamp < olderTxnTimestamp) {
              olderTxnTimestamp = txnTimestamp;
            }
          }
        } catch (error) {
          console.error(`Error fetching transactions for address ${eoa}:`, error);
        }
      }
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

  async getCeloVotes(eoas: string[]) {
    const cacheKey = `celoVotes-${eoas.join(",")}`;
    const ttl = 86400;

    const fetchFunction = async () => {
      let totalVotes = 0;
      const dune_response  = await this.dune.getLatestResult({queryId: 3209131});
      for (const eoa of eoas) {
        const celo_votes = dune_response.result?.rows.find((row: any) => row.voter.toLowerCase() === eoa.toLowerCase())
        if (celo_votes) {
          totalVotes += celo_votes.proposals_voted as number
        }
      }
      return totalVotes;
    }

    return redisService.getCachedData(cacheKey, fetchFunction, ttl);

  }

  async getCeloStewards(eoas: string[]) {
    const csvData = await this.loadCsvData("src/data/celoStewards.csv");
    for (const eoa of eoas) {
      const stewards = csvData.find((row) => row.Address.toLowerCase() === eoa.toLowerCase());
      if (stewards) {
        return true;
      }
    }
    return false;
  }

  async getCeloRegionalLead(eoas: string[]) {
    const csvData = await this.loadCsvData("src/data/celoRegionalLead.csv");
    for (const eoa of eoas) {
      const stewards = csvData.find((row) => row.Address.toLowerCase() === eoa.toLowerCase());
      if (stewards) {
        return true;
      }
    }
    return false;
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


  async getGivethDonations(eoas: string[]) {
    const cacheKey = `givethDonations-${eoas.join(",")}`;
    const ttl = 86400; // 1 día

    const fetchFunction = async () => {
      const givethApiUrl = "https://mainnet.serve.giveth.io/graphql";

      const donationsQuery = `
        query AddressGivethDonations($fromWalletAddresses: [String!]!) {
        donationsFromWallets(fromWalletAddresses: $fromWalletAddresses) {
          valueUsd
          createdAt
transactionNetworkId
          }
        }
        `;
      const query = {
        query: donationsQuery,
        variables: {
          fromWalletAddresses: [...eoas],
        },
      };

      try {
        const response = await fetch(givethApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
        });

        const res = await response.json();
        if (!res?.data?.donationsFromWallets) return 0;


        return (
          res.data.donationsFromWallets as {
            valueUsd: number;
            createdAt: string;
            transactionNetworkId: number;
          }[]
        ).filter((d) => d.transactionNetworkId === 42220).reduce((total, d) => total + d.valueUsd, 0);
      } catch (error) {
        console.log(error);
        return 0;
      }
    };

    return redisService.getCachedData(cacheKey, fetchFunction, ttl);
  }

  async getGitcoinDonations(eoas: string[]) {
    const cacheKey = `gitcoinDonations-${eoas.join(",")}`;
    const ttl = 86400; // 1 día

    const fetchFunction = async () => {
      const gitcoinIndexerUrl =
        "https://grants-stack-indexer-v2.gitcoin.co/graphql";
      const gitcoinDonationsQuery = `query getGitcoinDonations($fromWalletAddresses: [String!]) {
    donations(filter: {  chainId: { equalTo: 42220 }, donorAddress: {in: $fromWalletAddresses}}) {
      amountInUsd
      chainId
    }
  }`;

      try {
        const res = await fetch(gitcoinIndexerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: gitcoinDonationsQuery,
            variables: { fromWalletAddresses: [...eoas.map(eoa => eoa.toLowerCase())] },
          }),
        }).then((r) => r.json());

        console.debug({res});
        const donations: { amountInUsd: number }[] = res.data?.donations || [];
        return donations.reduce((sum, d) => sum + d.amountInUsd, 0);
      } catch (error) {
        return 0;
      }
    };

    return redisService.getCachedData(cacheKey, fetchFunction, ttl);
  }



  async getTalentScore(eoas: string[]) {
    const cacheKey = `talentScore-${eoas.join(",")}`;
    const ttl = 86400; // 1 día

    const fetchFunction = async () => {
      let highestTalentScore = 0;
      for (const eoa of eoas) {
        try{

          const talentPassport = await axios.get<TalentPassport>(`https://api.talentprotocol.com/api/v2/passports/${eoa}`, {
            headers: {
              "x-api-key": process.env.TALENT_API_KEY!
            }
          })
          if(!talentPassport.data) continue;
          if (talentPassport.data.passport.score > highestTalentScore) {
            highestTalentScore = talentPassport.data.passport.score;
          }
        } catch (error) {
          console.error(`Error fetching talent score for address ${eoa}:`, error);
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
  getCeloStewards(eoas: string[]): Promise<boolean>;
  getCeloRegionalLead(eoas: string[]): Promise<boolean>;
  getCeloVotes(eoas: string[]): Promise<number>;
  getTalentScore(eoas: string[]): Promise<number>;
  getGivethDonations(eoas: string[]): Promise<number>;
  getGitcoinDonations(eoas: string[]): Promise<number>;
}