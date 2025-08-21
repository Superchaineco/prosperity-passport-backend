import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { JSON_RPC_PROVIDER } from '../../../../config/superChain/constants';
import {
  VaultStrategy,
  VaultBase,
  APRData,
  BalanceData,
  StrategyContext,
} from '../strategy.types';
import { UIPoolDataProviderABI } from './abis';
import { getAssetPrice } from '@/services/assetPricing.service';
import axios from 'axios';

const RAY_DECIMALS = 27;
function formatAPR(rayValue: bigint) {
  return (Number(formatUnits(rayValue, RAY_DECIMALS)) * 100).toString();
}

const symbolMapping = {
  'USD₮': 'USDT',
};

const meritProgramMapping = {
  '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e': 'celo-supply-usdt',
  '0xD221812de1BD094f35587EE8E174B07B6167D9Af': 'celo-supply-weth',
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
        UIPoolDataProviderABI,
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

      const response = await axios.get(
        'https://apps.aavechan.com/api/merit/aprs'
      );
      const meritProgramAprs = response.data.currentAPR.actionsAPR;

      console.debug(
        vault.metadata.apr,
        meritProgramAprs[meritProgramMapping[vault.asset]]
      );
      const calculatedApr =
        Number(vault.metadata?.apr ?? '0') +
        (meritProgramAprs[meritProgramMapping[vault.asset]] || 0);
      meritProgramAprs[meritProgramMapping[vault.asset]] || 0;

      return {
        apr: calculatedApr,
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
        UIPoolDataProviderABI,
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
          asset_price: 0,
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

      const assetPrice = await getAssetPrice(vault.asset);
      console.debug('Asset price for vault:', vault.asset, assetPrice);

      return {
        balance,
        raw_balance: rawBalance,
        supply_balance: balance,
        decimals: vault.decimals,
        name: vault.name,
        asset_price: assetPrice,
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
        asset_price: 0,
        supply_balance: '0',
        decimals: vault.decimals,
        name: vault.name,
        metadata: { liquidityIndex },
      };
    }
  }
}
