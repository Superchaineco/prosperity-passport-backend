import { RedisService } from '../redis.service';
import { AaveStrategy, VaultStrategy } from './strategies/aave.strategy';

type Vault = {
  reserve: string;
  rewards_apr: number;
  asset: string;
  symbol: string;
  decimals: number;
  image: string | null;
  depreciated: boolean;
  min_deposit: number;
  balance: string;
  raw_balance: string;
  interest_apr: string;
};

const tokenImages = {
  WETH: 'https://pass.celopg.eco/images/currencies/ethereum.svg',
  USDT: 'https://pass.celopg.eco/images/currencies/usdt.svg',
};

export class VaultsService {
  private redisService: RedisService;
  private strategy: VaultStrategy;

  constructor(redisService: RedisService) {
    this.redisService = redisService;
    this.strategy = new AaveStrategy(); // Default strategy
  }

  private async getVaultsData() {
    return this.strategy.getVaultsData();
  }

  private async getVaultAPR(vault: any) {
    const cache_key = `vault_apr_${vault.reserve}`;
    const fetchFunction = async () => {
      return this.strategy.getVaultAPR(vault);
    };

    return this.redisService.getCachedDataWithCallback(
      cache_key,
      fetchFunction,
      3600
    );
  }

  private async getVaultBalance(
    vault: any,
    account: string,
    liquidityIndex: string
  ) {
    const cache_key = `vault_balance_${vault.reserve}_${account}`;
    const fetchFunction = async () => {
      return this.strategy.getVaultBalance(vault, account, liquidityIndex);
    };

    return this.redisService.getCachedDataWithCallback(
      cache_key,
      fetchFunction,
      3600
    );
  }

  public async getVaultsForAccount(account: string): Promise<Vault[]> {
    const vaults = await this.getVaultsData();

    const vaultsWithData: Vault[] = await Promise.all(
      vaults.map(async (vault) => {
        const vaultData = await this.getVaultAPR(vault);
        const balanceData = await this.getVaultBalance(
          vault,
          account,
          vaultData.liquidityIndex
        );

        return {
          ...vault,
          apr: vaultData.apr,
          reserve: vault.reserve,
          balance: balanceData.balance,
          raw_balance: balanceData.raw_balance,
          liquidityIndex: balanceData.liquidityIndex,
          decimals: balanceData.decimals,
          name: balanceData.name,
          interest_apr: vaultData.apr,
          symbol: vaultData.symbol,
          rewards_apr: 0,
          asset: vault.reserve,
          image: tokenImages[vault.symbol] || null,
          depreciated: false,
          min_deposit: vault.symbol === 'WETH' ? 0.05 : 10,
        };
      })
    );

    return vaultsWithData;
  }

  public async refreshVaultsCache(account: string) {
    const vaults = await this.getVaultsData();
    for (const vault of vaults) {
      await this.redisService.deleteCachedData(
        `vault_balance_${vault.reserve}_${account}`
      );
    }
  }
}
