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
