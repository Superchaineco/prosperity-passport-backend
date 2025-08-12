import { RedisService } from '../redis.service';
import { AaveStrategy } from './strategies/aave.strategy';
import { StCeloStrategy } from './strategies/stcelo.strategy';
import { VaultStrategy } from './strategies/strategy.types';

type Vault = {
  reserve: string;
  asset: string;
  rewards_apr: number;
  symbol: string;
  decimals: number;
  image: string | null;
  depreciated: boolean;
  min_deposit: number;
  balance: string;
  raw_balance: string;
  interest_apr: string;
  // origin strategy
  _strategy?: string;
};

const tokenImages = {
  WETH: 'https://pass.celopg.eco/images/currencies/ethereum.svg',
  USDT: 'https://pass.celopg.eco/images/currencies/usdt.svg',
  CELO: 'https://pass.celopg.eco/images/currencies/celo.svg',
};

export class VaultsService {
  private redisService: RedisService;
  // Multiple strategies support
  private strategies: { name: string; instance: VaultStrategy }[];

  constructor(redisService: RedisService) {
    this.redisService = redisService;
    // Register available strategies
    this.strategies = [
      { name: 'stcelo', instance: new StCeloStrategy() },
      { name: 'aave', instance: new AaveStrategy() },
    ];
  }

  private async getVaultsData() {
    // Fetch and tag vaults from all strategies
    const all = await Promise.all(
      this.strategies.map(async (s) => {
        try {
          const data = await s.instance.getVaultsData();
          return data.map((v: any) => ({ ...v, _strategy: s.name }));
        } catch (e) {
          console.error(`Error loading vaults from strategy ${s.name}`, e);
          return [];
        }
      })
    );
    return all.flat();
  }

  private getStrategyForVault(vault: any): VaultStrategy | undefined {
    const stratName = vault._strategy;
    return this.strategies.find((s) => s.name === stratName)?.instance;
  }

  private async getVaultAPR(vault: any) {
    const strategy = this.getStrategyForVault(vault);
    if (!strategy) return { apr: '0', symbol: vault.symbol, metadata: {} };
    const cache_key = `vault_apr_${vault.reserve}`;
    const fetchFunction = async () => {
      return strategy.getVaultAPR(vault);
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
    context?: Record<string, any>
  ) {
    const strategy = this.getStrategyForVault(vault);
    if (!strategy) {
      throw new Error(`No strategy found for vault ${vault.reserve}`);
    }
    const cache_key = `vault_balance_${vault.reserve}_${account}`;
    const fetchFunction = async () => {
      return strategy.getVaultBalance(vault, account, context);
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
        const aprData = await this.getVaultAPR(vault);
        const balanceData = await this.getVaultBalance(
          vault,
          account,
          aprData.metadata
        );

        return {
          ...vault,
          apr: aprData.apr,
          reserve: vault.reserve,
          supply_balance: balanceData.supply_balance,
          asset: vault.asset || vault.reserve,
          balance: balanceData.balance,
          raw_balance: balanceData.raw_balance,
          decimals: balanceData.decimals,
          name: balanceData.name,
          interest_apr: aprData.apr,
          symbol: aprData.symbol,
          rewards_apr: 0,
          image: tokenImages[vault.symbol] || null,
          depreciated: false,
          min_deposit: vault.symbol === 'WETH' ? 0.05 : 100,
          _strategy: vault._strategy,
        } as Vault;
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
