import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { JSON_RPC_PROVIDER } from '../../../../config/superChain/constants';
import {
  VaultStrategy,
  VaultBase,
  APRData,
  BalanceData,
  StrategyContext,
} from '../strategy.types';
import { stCeloContractABI, stCeloManagerContractABI } from './abis';
import { getAssetPrice } from '@/services/assetPricing.service';

export class StCeloStrategy implements VaultStrategy {
  async getVaultsData(): Promise<VaultBase[]> {
    // Mock data for stCELO (generic, no Aave-specific fields)
    const celoVaults: VaultBase[] = [
      {
        reserve: '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24', // stCELO token address
        asset: '0x471EcE3750Da237f93B8E339c536989b8978a438', // underlying CELO address
        symbol: 'CELO',
        name: 'Staked CELO',
        decimals: 18,
        image: null,
      },
    ];

    try {
      return celoVaults;
    } catch (error) {
      console.error('Error getting stCELO vaults data:', error);
      return celoVaults;
    }
  }

  async getVaultAPR(vault: VaultBase): Promise<APRData> {
    try {
      if (!vault) {
        return {
          apr: '0',
          symbol: 'CELO',
        };
      }

      const apr = '1.85';

      return {
        apr,
        symbol: vault.symbol || 'CELO',
      };
    } catch (error: any) {
      console.error('Error getting CELO APR:', error.message);
      return {
        apr: '0',
        symbol: 'CELO',
      };
    }
  }

  async getVaultBalance(
    vault: VaultBase,
    account: string,
    _context?: StrategyContext
  ): Promise<BalanceData> {
    try {
      const provider = new JsonRpcProvider(JSON_RPC_PROVIDER);

      // Minimal ERC-20 ABI for stCELO
      const stCeloContract = new Contract(
        '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
        stCeloContractABI,
        provider
      );

      // Contract to convert stCELO to CELO
      const stCeloManagerContract = new Contract(
        '0x0239b96D10a434a56CC9E09383077A0490cF9398',
        stCeloManagerContractABI,
        provider
      );

      // Fetch stCELO balance
      const rawBalance = await stCeloContract.balanceOf(account);
      const decimals = await stCeloContract.decimals();

      // Convert stCELO to CELO
      const rawSupplyBalance = await stCeloManagerContract.toCelo(rawBalance);

      // Format balances
      const balance = formatUnits(rawBalance, decimals);
      const supplyBalance = formatUnits(rawSupplyBalance, decimals);

      console.log(
        `Getting stCELO balance for account ${account}: ${balance} stCELO, equivalent to ${supplyBalance} CELO`
      );
      const assetPrice = await getAssetPrice(vault.asset);

      return {
        balance,
        raw_balance: rawBalance.toString(),
        supply_balance: supplyBalance,
        decimals: Number(decimals),
        asset_price: assetPrice,
        name: vault?.name || 'Staked CELO',
        metadata: {},
      };
    } catch (error: any) {
      console.error('Error getting stCELO balance:', error);
      return {
        balance: '0',
        raw_balance: '0',
        supply_balance: '0',
        asset_price: 0,
        decimals: vault?.decimals || 18,
        name: vault?.name || 'Staked CELO',
        metadata: {},
      };
    }
  }
}
