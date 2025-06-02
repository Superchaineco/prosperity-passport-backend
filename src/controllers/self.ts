import { Request, Response } from 'express';
import { getUserIdentifier } from '@selfxyz/core';
import { redisService } from '@/services/redis.service';
import { SelfService } from '@/services/badges/self.service';
import { Console } from 'console';



export default async function selfVerify(req: Request, res: Response) {
    if (req.method === 'POST') {
        const { proof, publicSignals } = req.body;

        if (!proof || !publicSignals) {
            return res
                .status(400)
                .json({ message: 'Proof and publicSignals are required' });
        }
        const userId = await getUserIdentifier(publicSignals);
        console.log('Extracted userId:', userId);

        const selfService = new SelfService()
        try {
            const result = await selfService.selfVerify(userId, proof, publicSignals);
            console.log('Verification result:', result);

            if (result.isValid) {

                return res.status(200).json({
                    status: 'success',
                    result: true,
                    credentialSubject: result.credentialSubject,
                });
            } else {

                return res.status(500).json({
                    status: 'error',
                    result: false,
                    message: 'Verification failed',
                    details: result.details,
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

    const selfService = new SelfService()
    const response = await selfService.selfCheck(req.query.userId as string, req.query.account as string)

    if (response.check) {
        return res
            .status(200)
            .json(response);
    }
    return res
        .status(200)
        .json(response);
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

        console.log('Processed addresses:', processedAddresses);
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
        return res.status(500).json({
            error: 'Internal error'
        });
    }
}
