
import { Request, Response } from "express";
import { getUserIdentifier, SelfBackendVerifier, countryCodes } from '@selfxyz/core';

export default async function selfVerify(req: Request, res: Response) {
    if (req.method === 'POST') {
        try {
            const { proof, publicSignals } = req.body;

            if (!proof || !publicSignals) {
                return res.status(400).json({ message: 'Proof and publicSignals are required' });
            }

            // Extract user ID from the proof
            const userId = await getUserIdentifier(publicSignals);
            console.log("Extracted userId:", userId);
                

            // Initialize and configure the verifier
            const selfBackendVerifier = new SelfBackendVerifier(
                "prosperity",
                "https://prosperity-passport-backend-production.up.railway.app/api/self/verify",
                "uuid",
                true
            );

            // Verify the proof
            const result = await selfBackendVerifier.verify(proof, publicSignals);

            if (result.isValid) {
                // Return successful verification response
                console.log("Verification successful:", result.credentialSubject);
                return res.status(200).json({
                    status: 'success',
                    result: true,
                    credentialSubject: result.credentialSubject
                });
            } else {
                // Return failed verification response
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