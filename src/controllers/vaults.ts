import { Request, Response } from 'express';
import { VaultsService } from '../services/vaults/vaults.service';
import { redisService } from '../services/redis.service';

export async function getVaults(req: Request, res: Response) {
  const account = req.params.account as string;
  const vaultsService = new VaultsService(redisService);
  const vaults = await vaultsService.getVaultsForAccount(account);
  return res.status(200).json(vaults);
}

export async function refreshVaults(req: Request, res: Response) {
  const account = req.params.account as string;
  const vaultsService = new VaultsService(redisService);
  await vaultsService.refreshVaultsCache(account);
  return res.status(200).json({ message: 'Vaults refreshed' });
}
