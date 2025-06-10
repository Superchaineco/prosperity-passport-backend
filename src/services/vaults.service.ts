import { JSON_RPC_PROVIDER } from '@/config/superChain/constants';
import axios from 'axios';
import { Contract, formatUnits, JsonRpcProvider } from 'ethers';
import { RedisService } from './redis.service';

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
  // cUSD: 'https://pass.celopg.eco/images/currencies/cUSD.svg',
  // cEUR: 'https://pass.celopg.eco/images/currencies/cEUR.svg',
};

const symbolMapping = {
  'USD₮': 'USDT',
};

const RAY_DECIMALS = 27;
function formatAPR(rayValue: bigint) {
  return (Number(formatUnits(rayValue, RAY_DECIMALS)) * 100).toString();
}

export class VaultsService {
  private redisService: RedisService;

  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }

  private async getVaultsData() {
    const addresses = [
      '0xD221812de1BD094f35587EE8E174B07B6167D9Af',
      '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
      // '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      // '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    ];

    const tokenSymbols = {
      '0xD221812de1BD094f35587EE8E174B07B6167D9Af': 'WETH',
      '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e': 'USDT',
      // '0x765DE816845861e75A25fCA122bb6898B8B1282a': 'cUSD',
      // '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73': 'cEUR',
    };

    try {
      const provider = new JsonRpcProvider(JSON_RPC_PROVIDER);
      const UIPoolDataProvider = new Contract(
        '0xf07fFd12b119b921C4a2ce8d4A13C5d1E3000d6e',
        [
          {
            inputs: [
              {
                internalType: 'contract IPoolAddressesProvider',
                name: 'provider',
                type: 'address',
              },
            ],
            name: 'getReservesData',
            outputs: [
              {
                components: [
                  {
                    internalType: 'address',
                    name: 'underlyingAsset',
                    type: 'address',
                  },
                  { internalType: 'string', name: 'name', type: 'string' },
                  { internalType: 'string', name: 'symbol', type: 'string' },
                  {
                    internalType: 'uint256',
                    name: 'decimals',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'baseLTVasCollateral',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'reserveLiquidationThreshold',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'reserveLiquidationBonus',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'reserveFactor',
                    type: 'uint256',
                  },
                  {
                    internalType: 'bool',
                    name: 'usageAsCollateralEnabled',
                    type: 'bool',
                  },
                  {
                    internalType: 'bool',
                    name: 'borrowingEnabled',
                    type: 'bool',
                  },
                  { internalType: 'bool', name: 'isActive', type: 'bool' },
                  { internalType: 'bool', name: 'isFrozen', type: 'bool' },
                  {
                    internalType: 'uint128',
                    name: 'liquidityIndex',
                    type: 'uint128',
                  },
                  {
                    internalType: 'uint128',
                    name: 'variableBorrowIndex',
                    type: 'uint128',
                  },
                  {
                    internalType: 'uint128',
                    name: 'liquidityRate',
                    type: 'uint128',
                  },
                  {
                    internalType: 'uint128',
                    name: 'variableBorrowRate',
                    type: 'uint128',
                  },
                  {
                    internalType: 'uint40',
                    name: 'lastUpdateTimestamp',
                    type: 'uint40',
                  },
                  {
                    internalType: 'address',
                    name: 'aTokenAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: 'variableDebtTokenAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: 'interestRateStrategyAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'availableLiquidity',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'totalScaledVariableDebt',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'priceInMarketReferenceCurrency',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'priceOracle',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'variableRateSlope1',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'variableRateSlope2',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'baseVariableBorrowRate',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'optimalUsageRatio',
                    type: 'uint256',
                  },
                  { internalType: 'bool', name: 'isPaused', type: 'bool' },
                  {
                    internalType: 'bool',
                    name: 'isSiloedBorrowing',
                    type: 'bool',
                  },
                  {
                    internalType: 'uint128',
                    name: 'accruedToTreasury',
                    type: 'uint128',
                  },
                  {
                    internalType: 'uint128',
                    name: 'unbacked',
                    type: 'uint128',
                  },
                  {
                    internalType: 'uint128',
                    name: 'isolationModeTotalDebt',
                    type: 'uint128',
                  },
                  {
                    internalType: 'bool',
                    name: 'flashLoanEnabled',
                    type: 'bool',
                  },
                  {
                    internalType: 'uint256',
                    name: 'debtCeiling',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'debtCeilingDecimals',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'borrowCap',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'supplyCap',
                    type: 'uint256',
                  },
                  {
                    internalType: 'bool',
                    name: 'borrowableInIsolation',
                    type: 'bool',
                  },
                  {
                    internalType: 'bool',
                    name: 'virtualAccActive',
                    type: 'bool',
                  },
                  {
                    internalType: 'uint128',
                    name: 'virtualUnderlyingBalance',
                    type: 'uint128',
                  },
                  { internalType: 'uint128', name: 'deficit', type: 'uint128' },
                ],
                internalType:
                  'struct IUiPoolDataProviderV3.AggregatedReserveData[]',
                name: '',
                type: 'tuple[]',
              },
              {
                components: [
                  {
                    internalType: 'uint256',
                    name: 'marketReferenceCurrencyUnit',
                    type: 'uint256',
                  },
                  {
                    internalType: 'int256',
                    name: 'marketReferenceCurrencyPriceInUsd',
                    type: 'int256',
                  },
                  {
                    internalType: 'int256',
                    name: 'networkBaseTokenPriceInUsd',
                    type: 'int256',
                  },
                  {
                    internalType: 'uint8',
                    name: 'networkBaseTokenPriceDecimals',
                    type: 'uint8',
                  },
                ],
                internalType: 'struct IUiPoolDataProviderV3.BaseCurrencyInfo',
                name: '',
                type: 'tuple',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        provider
      );

      const reserveDetails = await UIPoolDataProvider.getReservesData(
        '0x9F7Cf9417D5251C59fE94fB9147feEe1aAd9Cea5'
      );

      if (!reserveDetails || !reserveDetails[0]) {
        throw new Error('No reserve details found');
      }

      return addresses.map((address) => {
        const reserveData = reserveDetails[0].find(
          (reserve: any) =>
            reserve &&
            reserve[0] &&
            reserve[0].toLowerCase() === address.toLowerCase()
        );

        const symbol = symbolMapping[reserveData[2]] || reserveData[2];

        return {
          reserve: address,
          symbol,
          name: reserveData[1] || '',
          decimals: Number(reserveData[3]) || 18,
          liquidityIndex: reserveData[12].toString() || '0',
          apr: formatAPR(reserveData[14]),
          image: tokenImages[symbol] || null,
        };
      });
    } catch (error) {
      console.error('Error getting vaults data:', error);
      return addresses.map((address) => ({
        reserve: address,
        symbol: tokenSymbols[address],
        name: '',
        decimals: 18,
        liquidityIndex: '0',
        apr: '0',
        image: null,
      }));
    }
  }

  private async getVaultAPR(vault: any) {
    const cache_key = `vault_apr_${vault.reserve}`;
    const fetchFunction = async () => {
      try {
        if (!vault) {
          return {
            apr: '0',
            symbol: vault.symbol,
            liquidityIndex: '0',
          };
        }

        return {
          apr: vault.apr,
          symbol: vault.symbol,
          liquidityIndex: vault.liquidityIndex,
        };
      } catch (error: any) {
        console.error(error.message);
        return {
          apr: '0',
          symbol: vault.symbol,
          liquidityIndex: '0',
        };
      }
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
      try {
        const provider = new JsonRpcProvider(JSON_RPC_PROVIDER);

        const UIPoolDataProvider = new Contract(
          '0xf07fFd12b119b921C4a2ce8d4A13C5d1E3000d6e',
          [
            {
              inputs: [
                {
                  internalType: 'contract IPoolAddressesProvider',
                  name: 'provider',
                  type: 'address',
                },
                { internalType: 'address', name: 'user', type: 'address' },
              ],
              name: 'getUserReservesData',
              outputs: [
                {
                  components: [
                    {
                      internalType: 'address',
                      name: 'underlyingAsset',
                      type: 'address',
                    },
                    {
                      internalType: 'uint256',
                      name: 'scaledATokenBalance',
                      type: 'uint256',
                    },
                    {
                      internalType: 'bool',
                      name: 'usageAsCollateralEnabledOnUser',
                      type: 'bool',
                    },
                    {
                      internalType: 'uint256',
                      name: 'scaledVariableDebt',
                      type: 'uint256',
                    },
                  ],
                  internalType:
                    'struct IUiPoolDataProviderV3.UserReserveData[]',
                  name: '',
                  type: 'tuple[]',
                },
                { internalType: 'uint8', name: '', type: 'uint8' },
              ],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          provider
        );

        const userReservesData = await UIPoolDataProvider.getUserReservesData(
          '0x9F7Cf9417D5251C59fE94fB9147feEe1aAd9Cea5',
          account
        );

        // Encontrar los datos del vault específico
        const vaultData = userReservesData[0].find(
          (reserve) =>
            reserve.underlyingAsset.toLowerCase() ===
            vault.reserve.toLowerCase()
        );

        console.log(vaultData);

        if (!vaultData) {
          return {
            balance: '0',
            raw_balance: '0',
            liquidityIndex,
            decimals: vault.decimals,
            name: vault.name,
          };
        }

        const RAY = BigInt('1000000000000000000000000000');
        const rawBalance = (
          (BigInt(vaultData.scaledATokenBalance) * BigInt(liquidityIndex)) /
          RAY
        ).toString();
        const balance = formatUnits(
          (BigInt(vaultData.scaledATokenBalance) * BigInt(liquidityIndex)) /
            RAY,
          vault.decimals
        );

        console.log(vaultData.scaledATokenBalance, liquidityIndex, balance);
        return {
          balance,
          raw_balance: rawBalance,
          liquidityIndex,
          decimals: vault.decimals,
          name: vault.name,
        };
      } catch (error: any) {
        console.error(error);
        return {
          balance: '0',
          raw_balance: '0',
          liquidityIndex,
          decimals: vault.decimals,
          name: vault.name,
        };
      }
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
