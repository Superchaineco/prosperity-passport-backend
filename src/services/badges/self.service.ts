import { SelfBackendVerifier } from "@selfxyz/core";
import { redisService } from "../redis.service";


export class SelfService {


    public async selfVerify(userId: string, proof: string, publicSignals: string[]): Promise<SelfVerifyResponse> {

        const selfBackendVerifier = new SelfBackendVerifier(
            'prosperity',
            'https://prosperity-passport-backend-production.up.railway.app/api/self/verify',
            'hex',
            false
        );

        const result = await selfBackendVerifier.verify(proof, publicSignals);

        if (result.isValid) {
            console.log('Verification successful:', result);
            const cache_key = `self_id_pre:${userId}`;
            redisService.setCachedData(
                cache_key,
                result.credentialSubject, 0
            );

            return {
                isValid: true,
                credentialSubject: result.credentialSubject,
            }
        } else {
            console.log('Verification failed:', result.credentialSubject);
            return {
                isValid: true,
                details: result.isValidDetails,
            }
        }


    }


    public async selfCheck(userId: string): Promise<SelfCheckResponse> {

        const cache_key = `self_id_pre:${(userId).toUpperCase()}`;
        const selfData = await redisService.getCachedData(cache_key);
        console.log('Checking self data for userId:', userId, selfData);
        console.log(selfData != null);
        if (selfData != null && Object.keys(selfData).length > 0) {
            return { message: 'Validation success!', check: true, data: selfData }
        }
        return { message: 'Self data not found', check: false }
    }

}

export type SelfCheckResponse = {
    check: boolean;
    message?: string;
    data?: any;
}

export type SelfVerifyResponse = {
    isValid: boolean;
    credentialSubject?: any;
    details?: any;
}
