export type StrategyContext = Record<string, any> | undefined;

export interface VaultBase {
  reserve: string;
  // Underlying asset address (may differ from reserve)
  asset?: string;
  symbol: string;
  name?: string;
  decimals: number;
  image?: string | null;
  // Strategy identifier used by the service layer
  _strategy?: string;
  // Arbitrary per-strategy data (e.g., Aave liquidityIndex)
  metadata?: Record<string, any>;
}

export interface APRData {
  apr: string; // percentage value as string, e.g., "8.5"
  symbol: string;
  // Additional per-strategy info (e.g., Aave liquidityIndex)
  metadata?: Record<string, any>;
}

export interface BalanceData {
  balance: string; // human-readable units
  raw_balance: string; // base units
  supply_balance?: string; // equivalent balance in underlying asset (e.g., CELO for stCELO)
  decimals: number;
  name?: string;
  // Additional per-strategy info
  metadata?: Record<string, any>;
}

export interface VaultStrategy {
  getVaultsData(): Promise<VaultBase[]>;
  getVaultAPR(vault: VaultBase): Promise<APRData>;
  // Optional context allows passing strategy-specific data such as liquidityIndex for Aave
  getVaultBalance(
    vault: VaultBase,
    account: string,
    context?: StrategyContext
  ): Promise<BalanceData>;
}
