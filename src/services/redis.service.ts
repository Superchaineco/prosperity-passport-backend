import { redis } from "../utils/cache";

export class RedisService {
    public async getCachedData<T>(key: string, fetchFunction: () => Promise<T>, ttl?: number): Promise<T> {
        const cachedData = await redis.get(key);
        if (cachedData) {
            console.info(`Cache hit for key: ${key}`);
            return JSON.parse(cachedData);
        }

        const data = await fetchFunction();
        if (ttl) {
            await redis.set(key, JSON.stringify(data), "EX", ttl);
        } else {
            await redis.set(key, JSON.stringify(data));
        }
        return data;
    }

    public async setCachedData(key: string, data: any, ttl: number) {
        await redis.set(key, JSON.stringify(data), "EX", ttl);
    }

    public async getCachedData(key: string) {
        const cachedData = await redis.get(key);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        return null;
    }
    public async deleteCachedData(key: string) {
        await redis.del(key);
    }
}

export const redisService = new RedisService();
