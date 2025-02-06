import dotenv from "dotenv";
dotenv.config();

export enum ENVIRONMENTS {
  development = "development",
  production = "production",
}

export const ENV =
  (process.env.NODE_ENV as ENVIRONMENTS) || ENVIRONMENTS.development;

const config = {
  development: {
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS:
      "0x58f5805b5072C3Dd157805132714E1dF40E79c66",
    SUPER_CHAIN_ATTESTATION_SCHEMA:
      "0x1492ec328ed4c8e25f2be8247a70779b42e89dae11b5625827831c95cd99b052",
    EAS_CONTRACT_ADDRESS: "0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92",
    JSON_RPC_PROVIDER: process.env.JSON_RPC_PROVIDER,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    DOMAIN: "http://localhost:3000",
    REDIS: process.env.REDIS_PUBLIC_URL,
    SAFE_ADDRESS: process.env.SAFE_ADDRESS,
    GELATO_ADDRESS:process.env.GELATO_ADDRESS,
  },
  production: {
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS:
      "0x58f5805b5072C3Dd157805132714E1dF40E79c66",
    SUPER_CHAIN_ATTESTATION_SCHEMA:
      "0x1492ec328ed4c8e25f2be8247a70779b42e89dae11b5625827831c95cd99b052",
    EAS_CONTRACT_ADDRESS: "0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92",
    JSON_RPC_PROVIDER: process.env.JSON_RPC_PROVIDER,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    DOMAIN: "https://account.superchain.eco",
    REDIS: process.env.REDIS_URL,
    SAFE_ADDRESS: process.env.SAFE_ADDRESS,
    GELATO_ADDRESS:process.env.GELATO_ADDRESS,
  },
}[ENV];

import SuperChainModuleABI from "./abi/SuperChainModule.json";
export const SUPER_CHAIN_MODULE_ABI = SuperChainModuleABI;
export const SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS =
  config.SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS;
export const SUPER_CHAIN_ATTESTATION_SCHEMA =
  config.SUPER_CHAIN_ATTESTATION_SCHEMA;
export const EAS_CONTRACT_ADDRESS = config.EAS_CONTRACT_ADDRESS;
export const ATTESTATOR_SIGNER_PRIVATE_KEY =
  process.env.ATTESTATOR_SIGNER_PRIVATE_KEY!;
export const JSON_RPC_PROVIDER = config.JSON_RPC_PROVIDER!;
export const ETHERSCAN_API_KEY = config.ETHERSCAN_API_KEY!;
export const REDIS_URL = process.env.REDIS_URL!;
export const REDIS_PASSWORD = process.env.REDISPASSWORD!;
export const REDIS_HOST = process.env.REDISHOST!;
export const REDIS_PORT = Number(process.env.REDISPORT!);
export const REDIS_USER = process.env.REDISUSER!;
export const PRIVY_APP_ID = process.env.PRIVY_APP_ID!;
export const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET!;
export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY!;
export const GELATO_API_KEY = process.env.GELATO_API_KEY!;
export const SUBGRAPH_API_KEY = process.env.SUBGRAPH_API_KEY!;
export const WC_PROJECT_ID = process.env.WC_PROJECT_ID!;
export const DOMAIN = config.DOMAIN;
export const SESSION_SECRET = process.env.SESSION_SECRET!;
export const DUNE_API_KEY = process.env.DUNE_API_KEY!;
export const SAFE_ACCOUNT = 