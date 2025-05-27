import { Request, Response } from 'express';
import {
    getUserIdentifier,
    SelfBackendVerifier,
    countryCodes,
} from '@selfxyz/core';
import { redisService } from '@/services/redis.service';


export default async function selfVerify(req: Request, res: Response) {
    if (req.method === 'POST') {
        try {
            const { proof, publicSignals } = req.body;

            if (!proof || !publicSignals) {
                return res
                    .status(400)
                    .json({ message: 'Proof and publicSignals are required' });
            }

            const userId = await getUserIdentifier(publicSignals);
            console.log('Extracted userId:', userId);

            const selfBackendVerifier = new SelfBackendVerifier(
                'prosperity',
                'https://prosperity-passport-backend-production.up.railway.app/api/self/verify',
                'hex',
                true
            );

            const result = await selfBackendVerifier.verify(proof, publicSignals);

            if (result.isValid) {
                console.log('Verification successful:', result, req.params);
                const cache_key = `self_id:${req.params.userId}`;
                redisService.setCachedData(
                    cache_key,
                    result.credentialSubject,
                    60 * 60 * 24 * 7
                );

                return res.status(200).json({
                    status: 'success',
                    result: true,
                    credentialSubject: result.credentialSubject,
                });
            } else {
                console.log('Verification failed:', result.credentialSubject);
                return res.status(500).json({
                    status: 'error',
                    result: false,
                    message: 'Verification failed',
                    details: result.isValidDetails,
                });
            }
        } catch (error) {
            console.error('Error verifying proof:', error);
            return res.status(500).json({
                status: 'error',
                result: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}

export async function selfCheck(req: Request, res: Response) {
    if (req.query.userId) {
        const cache_key = `self_id:${req.query.userId}`;
        const selfData = await redisService.getCachedData(cache_key);
        console.log('Checking self data for userId:', req.query.userId, selfData);
        console.log(selfData != null);
        if (selfData != null) {
            return res
                .status(200)
                .json({ message: 'Validation success!', check: true });
        }
        return res
            .status(500)
            .json({ message: 'Self data not found', check: false });
    }
}
