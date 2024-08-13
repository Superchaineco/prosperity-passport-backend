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
      "0x5b46F961E4d9282486Da3B77f3EF63553A5e0380",
    SUPER_CHAIN_ATTESTATION_SCHEMA:
      "0xcfc18d0408a246b5b1922b9eaf9ba838c75121ee18ab7dfd69061ad4c0b55dc7",
    EAS_CONTRACT_ADDRESS: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
    JSON_RPC_PROVIDER: process.env.JSON_RPC_PROVIDER_TESTNET,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY_TESTNET,
  },
  production: {
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS:
      "0xFe6a2C0847C0cC326eCF762A428D436e4bEc6B99",
    SUPER_CHAIN_ATTESTATION_SCHEMA:
      "0x7c865334263c0b45a1e5ca8f19ba09654ad43ac90a285757f1b3e1771cb07f18",
    EAS_CONTRACT_ADDRESS: "0x4200000000000000000000000000000000000021",
    JSON_RPC_PROVIDER: process.env.JSON_RPC_PROVIDER,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
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
