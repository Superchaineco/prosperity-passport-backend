import { getAssetPrice } from '@/services/assetPricing.service';
import { Request, Response } from 'express';

export async function getAsset(req: Request, res: Response) {
  const asset = req.params.asset as string;
  if (!asset) {
    return res.status(500).json({ error: 'Invalid request' });
  }
  try {
    const fiatValue = await getAssetPrice(asset);
    console.debug('Fiat Value:', fiatValue);
    res.json(fiatValue);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
}

export async function getAssets(req: Request, res: Response) {
  const assetsParam = req.params.assets as string;
  if (!assetsParam) {
    return res.status(500).json({ error: 'Invalid request' });
  }

  const assets = assetsParam.split(',');

  try {
    const prices: Record<string, number> = {};
    for (const asset of assets) {
      try {
        const fiatValue = await getAssetPrice(asset);
        prices[asset] = fiatValue;
      } catch (error) {
        console.error(`Error fetching price for asset ${asset}:`, error);
        prices[asset] = null; // or handle the error as needed
      }
    }
    res.json(prices);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
}
