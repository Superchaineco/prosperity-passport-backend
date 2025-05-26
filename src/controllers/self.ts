
import { Request, Response } from "express";
import { getUserIdentifier, SelfBackendVerifier, countryCodes } from '@selfxyz/core';
import { redisService } from "@/services/redis.service";
import { superChainAccountService } from "@/services/superChainAccount.service";

export default async function selfVerify(req: Request, res: Response) {
    if (req.method === 'POST') {
        try {
            const { proof, publicSignals } = req.body;

            if (!proof || !publicSignals) {
                return res.status(400).json({ message: 'Proof and publicSignals are required' });
            }


            const userId = await getUserIdentifier(publicSignals);
            console.log("Extracted userId:", userId);


            const selfBackendVerifier = new SelfBackendVerifier(
                "prosperity",
                "https://prosperity-passport-backend-production.up.railway.app/api/self/verify",
                "uuid",
                true
            );


            const result = await selfBackendVerifier.verify(proof, publicSignals);

            if (result.isValid) {

                console.log("Verification successful:", result.credentialSubject);
                const cache_key = `self_id_pre:${req.params.userId}`
                redisService.setCachedData(cache_key, result.credentialSubject, 60 * 60 * 2)

                return res.status(200).json({
                    status: 'success',
                    result: true,
                    credentialSubject: result.credentialSubject
                });
            } else {

                console.log("Verification failed:", result.credentialSubject);
                return res.status(500).json({
                    status: 'error',
                    result: false,
                    message: 'Verification failed',
                    details: result.isValidDetails
                });
            }
        } catch (error) {
            console.error('Error verifying proof:', error);
            return res.status(500).json({
                status: 'error',
                result: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}

export async function selfCheck(req: Request, res: Response) {

    if (req.params.userId) {
        const cache_key = `self_id_pre:${req.params.userId}`
        const selfData = redisService.getCachedData(cache_key)

        if (!selfData)
            return res.status(404).json({ message: 'Self data not found' });

        const eoas = await superChainAccountService.getEOAS(req.params.account);
        const cache_key_data = `self_id:${eoas.join(",")}`

        const verifiedData = redisService.getCachedData(cache_key)
        if (!verifiedData)
            redisService.setCachedData(cache_key_data, selfData, 0)


        return res.status(200).json({ message: 'Validation success!' });
    }
}