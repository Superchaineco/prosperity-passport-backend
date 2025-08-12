import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { JSON_RPC_PROVIDER } from '../../../config/superChain/constants';
import {
  VaultStrategy,
  VaultBase,
  APRData,
  BalanceData,
  StrategyContext,
} from './strategy.types';

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

      // Minimal ERC-20 ABI
      const stCeloContract = new Contract(
        '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24', // stCELO token contract
        [
          {
            inputs: [
              { internalType: 'address', name: 'account', type: 'address' },
            ],
            name: 'balanceOf',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'decimals',
            outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'symbol',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'name',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        provider
      );

      const stCeloManagerContract = new Contract(
        '0x0239b96D10a434a56CC9E09383077A0490cF9398',
        [
          {
            inputs: [
              {
                internalType: 'uint256',
                name: 'stCeloAmount',
                type: 'uint256',
              },
            ],
            name: 'toCelo',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        provider
      );

      const rawBalance = await stCeloContract.balanceOf(account);
      const decimals = await stCeloContract.decimals();

      const celoBalance = await stCeloManagerContract.toCelo(rawBalance);
      console.debug({
        celoBalance,
        rawBalance,
      });

      // Format balance
      const balance = formatUnits(celoBalance, decimals);

      console.log(
        `Getting stCELO balance for account ${account}: ${balance} stCELO`
      );

      return {
        balance,
        raw_balance: rawBalance.toString(),
        decimals: Number(decimals),
        name: vault?.name || 'Staked CELO',
        metadata: {},
      };
    } catch (error: any) {
      console.error('Error getting stCELO balance:', error);
      return {
        balance: '0',
        raw_balance: '0',
        decimals: vault?.decimals || 18,
        name: vault?.name || 'Staked CELO',
        metadata: {},
      };
    }
  }
}
