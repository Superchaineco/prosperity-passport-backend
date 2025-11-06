import axios from 'axios';
import { redisService } from './redis.service';
import { COINGECKO_API_KEY } from '@/config/superChain/constants';

export async function getAssetPrice(assetAddress: string): Promise<number> {
  const fetchFunction = async () => {
    try {
      // Primero intentamos con Coingecko
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/token_price/celo?contract_addresses=${assetAddress.toLowerCase()}&vs_currencies=usd`,
        {
          headers: {
            accept: 'application/json',
            'x-cg-demo-api-key': COINGECKO_API_KEY,
          },
        }
      );


      const priceData = response.data[assetAddress.toLowerCase()];


      console.debug('Price Data from Coingecko:', priceData);
      console.debug('Asset Address:', assetAddress);

      if (!priceData.usd) {
        const response = await axios.get(
          `https://api.geckoterminal.com/api/v2/simple/networks/celo/token_price/${assetAddress}`,
          {
            headers: {
              accept: 'application/json',
            },
          }
        );

        console.debug({ response });

        const geckoData =
          response.data.data.attributes.token_prices[
            assetAddress.toLowerCase()
          ];

        console.debug('Price Data from GeckoTerminal:', geckoData);

        return parseFloat(geckoData);
      }
      return priceData.usd;
    } catch (error) {
      console.error('Error fetching price:', error);
      throw new Error(
        'Failed to fetch asset price from both Coingecko and GeckoTerminal'
      );
    }
  };

  const cacheKey = `asset_price_${assetAddress}`;
  return redisService.getCachedDataWithCallback(cacheKey, fetchFunction, 3600);
}
