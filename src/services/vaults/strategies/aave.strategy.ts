import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { JSON_RPC_PROVIDER } from '../../../config/superChain/constants';
import {
  VaultStrategy,
  VaultBase,
  APRData,
  BalanceData,
  StrategyContext,
} from './strategy.types';

const RAY_DECIMALS = 27;
function formatAPR(rayValue: bigint) {
  return (Number(formatUnits(rayValue, RAY_DECIMALS)) * 100).toString();
}

const symbolMapping = {
  'USD₮': 'USDT',
};

export class AaveStrategy implements VaultStrategy {
  async getVaultsData(): Promise<VaultBase[]> {
    const addresses = [
      '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
      '0xD221812de1BD094f35587EE8E174B07B6167D9Af',
    ];

    const tokenSymbols = {
      '0xD221812de1BD094f35587EE8E174B07B6167D9Af': 'WETH',
      '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e': 'USDT',
    } as Record<string, string>;

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
          asset: address,
          symbol,
          name: symbol,
          decimals: Number(reserveData[3]) || 18,
          image: null,
          metadata: {
            liquidityIndex: reserveData[12]?.toString() || '0',
            apr: formatAPR((reserveData[14] as bigint) ?? BigInt(0)),
          },
        } as VaultBase;
      });
    } catch (error) {
      console.error('Error getting vaults data:', error);
      return addresses.map(
        (address) =>
          ({
            reserve: address,
            symbol: tokenSymbols[address],
            name: '',
            decimals: 18,
            image: null,
            metadata: {
              liquidityIndex: '0',
              apr: '0',
            },
          } as VaultBase)
      );
    }
  }

  async getVaultAPR(vault: VaultBase): Promise<APRData> {
    try {
      if (!vault) {
        return {
          apr: '0',
          symbol: 'UNKNOWN',
          metadata: { liquidityIndex: '0' },
        };
      }

      return {
        apr: vault.metadata?.apr ?? '0',
        symbol: vault.symbol,
        metadata: { liquidityIndex: vault.metadata?.liquidityIndex ?? '0' },
      };
    } catch (error: any) {
      console.error(error.message);
      return {
        apr: '0',
        symbol: vault?.symbol ?? 'UNKNOWN',
        metadata: { liquidityIndex: '0' },
      };
    }
  }

  async getVaultBalance(
    vault: VaultBase,
    account: string,
    context?: StrategyContext
  ): Promise<BalanceData> {
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
                internalType: 'struct IUiPoolDataProviderV3.UserReserveData[]',
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

      const vaultData = userReservesData[0].find(
        (reserve: any) =>
          reserve.underlyingAsset.toLowerCase() === vault.reserve.toLowerCase()
      );

      const liquidityIndex =
        (context?.liquidityIndex as string) ??
        vault.metadata?.liquidityIndex ??
        '0';

      if (!vaultData) {
        return {
          balance: '0',
          raw_balance: '0',
          decimals: vault.decimals,
          name: vault.name,
          metadata: { liquidityIndex },
        };
      }

      const RAY = BigInt('1000000000000000000000000000');
      const rawBalance = (
        (BigInt(vaultData.scaledATokenBalance) * BigInt(liquidityIndex)) /
        RAY
      ).toString();
      const balance = formatUnits(
        (BigInt(vaultData.scaledATokenBalance) * BigInt(liquidityIndex)) / RAY,
        vault.decimals
      );

      return {
        balance,
        raw_balance: rawBalance,
        supply_balance: balance,
        decimals: vault.decimals,
        name: vault.name,
        metadata: { liquidityIndex },
      };
    } catch (error: any) {
      console.error(error);
      const liquidityIndex =
        (context?.liquidityIndex as string) ??
        vault.metadata?.liquidityIndex ??
        '0';
      return {
        balance: '0',
        raw_balance: '0',
        supply_balance: '0',
        decimals: vault.decimals,
        name: vault.name,
        metadata: { liquidityIndex },
      };
    }
  }
}
