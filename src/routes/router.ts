import { Router } from 'express';
import { BadgesServices } from '../services/badges.service';
import { superChainAccountService } from '../services/superChainAccount.service';
import { ZeroAddress } from 'ethers';
import { AttestationsService } from '../services/attestations.service';
const routes = Router();

routes.get('/', async (req, res) => {
  return res.json({
    some: process.env.SUPABASE_URL,
    other: process.env.SUPABASE_ANON_KEY,
  });
});

routes.get('/get-badges', async (req, res) => {
  const headers = req.headers;
  const account = headers.account as string;
  if (!account || account === ZeroAddress) {
    return res.status(500).json({ error: 'Invalid request' });
  }

  try {
    const badgesService = new BadgesServices();
    const eoas = await superChainAccountService.getEOAS(account);
    const currentBadges = await badgesService.getBadges(eoas, account);
    const totalPoints = badgesService.getTotalPoints(currentBadges);
    console.debug('currentBadges', currentBadges);
    res.json({ currentBadges, totalPoints });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
});

routes.put('/badge', async (req, res) => {
  let query = req.query;
  if (!query.badgeid || !query.account) {
    return res.status(500).json({ error: 'Invalid request' });
  }
  const badgeId = query.badgeid as string;
  const account = query.account as string;
  delete query.badgeid;
  delete query.account;
  try {
    const badgesService = new BadgesServices();
    const badge = await badgesService.updateBadge(account, badgeId, query);
    return res.json(badge);
  } catch (error) {
    return res.json({ error });
  }
});

routes.post('/attest-badges', async (req, res) => {
  const headers = req.headers;
  const account = headers.account as string;
  if (!account) {
    return res.status(500).json({ error: 'Invalid request' });
  }
  const badgesService = new BadgesServices();
  const eoas = await superChainAccountService.getEOAS(account);
  const badges = await badgesService.getBadges(eoas, account);
  const claimablePoints = badgesService.getClaimablePoints(badges);
  const attestationsService = new AttestationsService();
  try {
    const response = await attestationsService.attest(
      account,
      claimablePoints.totalPoints,
      badges,
      claimablePoints.maxClaimedTiersImages
    );
    return res.status(201).json(response);
  } catch (error) {
    console.error('Error attesting', error);
    return res.status(500).json({ error });
  }
});
export default routes;
