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

            const userId = '0X' + (await getUserIdentifier(publicSignals)).replace(/-/g, '').toUpperCase();
            console.log('Extracted userId:', userId);

            const adminValidators: string[] = ['0x155B63314444c7edC995A74DBc740BBC0A71742D'].map(a => a.toUpperCase());
            const isAdmin = adminValidators.includes(userId);

            const selfBackendVerifier = new SelfBackendVerifier(
                'prosperity',
                'https://prosperity-passport-backend-production.up.railway.app/api/self/verify',
                'hex',
                isAdmin
            );

            const result = await selfBackendVerifier.verify(proof, publicSignals);

            if (result.isValid) {
                console.log('Verification successful:', result);
                const cache_key = `self_id:${userId}`;
                redisService.setCachedData(
                    cache_key,
                    result.credentialSubject, 0
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
        const cache_key = `self_id:${(req.query.userId as string).toUpperCase()}`;
        const selfData = await redisService.getCachedData(cache_key);
        console.log('Checking self data for userId:', req.query.userId, selfData);
        console.log(selfData != null);
        if (selfData != null && Object.keys(selfData).length > 0) {
            return res
                .status(200)
                .json({ message: 'Validation success!', check: true, data: selfData });
        }
        return res
            .status(200)
            .json({ message: 'Self data not found', check: false });
    }
}

interface NationalityResponse {
    [address: string]: string;
}

export async function getNationalitiesBatch(req: Request, res: Response) {
    try {

        const { addresses } = req.body;

        if (!Array.isArray(addresses)) {
            return res.status(400).json({
                error: 'Bad request'
            });
        }


        const processedAddresses = Array.from(
            new Set(
                addresses
                    .filter(address => typeof address === 'string')
                    .map(address => address.trim().toUpperCase())
            )
        );

        if (processedAddresses.length === 0) {
            return res.status(400).json({
                error: 'Bad request'
            });
        }


        const redisKeys = processedAddresses.map(address => `self_id:${address}`);


        const redisResults = await Promise.all(
            redisKeys.map(key => redisService.getCachedData(key))
        );

        const responseData: NationalityResponse = {};

        processedAddresses.forEach((address, index) => {
            const redisData = redisResults[index];
            if (redisData && redisData.nationality) {
                responseData[address] = redisData.nationality;
            }

        });

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error on getNationalitiesBatch:', error);
        return res.status(500).json({
            error: 'Internal error'
        });
    }
}
