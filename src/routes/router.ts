import { Router } from 'express';
import { verifyReverseProxy, verifyOwner } from '../middleware/auth';
import { getUser } from '../controllers/user';
import { claimBadges, getBadges } from '../controllers/badges';
import { perksByAccount, perksByLevel } from '../controllers/perks';
import {
  getBalance,
  relay,
  reverseProxy,
  validateSponsorship,
} from '../controllers/sponsor';
import selfVerify, {
  getNationalitiesBatch,
  selfCheck,
} from '@/controllers/self';
import { getVaults, refreshVaults } from '@/controllers/vaults';
import { verifyFarcaster } from '@/controllers/farcaster';
import { getAirdrop, postAirdrop } from '@/controllers/airdrop';
import { rpcReverseProxy, verifyInternalRequest } from '@/controllers/rpcProxy';
import { getAccount, getAccountByUsername, postAccountsByEOAs } from '@/controllers/account';


export const routes = Router();

routes.get('/user/:account', getUser);

routes.get('/user/:account/badges', getBadges);

routes.get('/user/:account/perks', perksByAccount);

routes.get('/perks/:level', perksByLevel);

routes.get('/user/:account/sponsorship-balance', getBalance);

routes.get('/airdrop/:account', getAirdrop);

routes.post('/airdrop/:account', postAirdrop);

routes.post('/user/:account/badges/claim', verifyOwner, claimBadges);

routes.post('/validate-sponsorship', validateSponsorship);

routes.get('/vaults/:account', getVaults);

routes.post('/vaults/:account/refresh', refreshVaults);

routes.post('/relay', relay);

routes.post('/self/verify', selfVerify);

routes.get('/self/check', selfCheck);

routes.post('/leaderboard/nationalities', getNationalitiesBatch);

routes.post('/user-op-reverse-proxy', verifyReverseProxy, reverseProxy);

routes.post('/farcaster/verify/:account', verifyOwner, verifyFarcaster);

routes.use('/rpc', verifyInternalRequest, rpcReverseProxy);

routes.use('/account/by-address/:address', getAccount);

routes.use('/account/by-username/:username', getAccountByUsername);

routes.post("/accounts/by-eoas", postAccountsByEOAs);

export default routes;
