import { redis, redisClient } from '../utils/cache';
import { createFarcaster, getFarcaster } from './farcasterService';

export class RedisService {

  private getDefaultValue<T>(): T {
    // NOTE: Runtime heuristic – TypeScript generics are erased
    const typeProbe: unknown = undefined as unknown as T;

    if (typeof typeProbe === 'number') {
      return 0 as T;
    }

    if (typeof typeProbe === 'string') {
      return '' as T;
    }

    return undefined as unknown as T;
  }

  public async getCachedDataWithCallback<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number,
    log: boolean = false
  ): Promise<T> {
    try {
      const cachedData = await redis.get(key);
      if (cachedData) {
        if (log) console.info(`Cache hit for key: ${key}`);
        return JSON.parse(cachedData);
      }

      const data = await fetchFunction();
      if (ttl > 0) {
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
      } else {
        await redis.set(key, JSON.stringify(data));
      }
      return data;
    } catch (error) {
      console.error('Error getting cached data', error);
      return this.getDefaultValue<T>();
    }
  }

  public async setCachedData(key: string, data: any, ttl: number) {
    if (ttl) await redis.set(key, JSON.stringify(data), 'EX', ttl);
    else {
      try {
        if (key.startsWith('farcasterLink')) {
          await createFarcaster({
            account: key.replace('farcasterLink-', ''),
            fid: data.fid,
            signature: data,
          });
        } else {
          await redis.set(key, JSON.stringify(data));
        }
      } catch (error) {
        await redis.set(key, JSON.stringify(data));
      }
    }
  }

  public async getCachedData(key: string) {
    try {
      if (key.startsWith('farcasterLink')) {
        return await getFarcaster(key.replace('farcasterLink-', ''));
      }
    } catch (error) {
      console.error('Error getting user', error);
    }

    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  }
  public async deleteCachedData(key: string) {
    await redis.del(key);
  }

  public async JSONGet(key: string, path: string) {
    const result = await redisClient.json.get(key, {
      path,
    });
    return result;
  }
}

export const redisService = new RedisService();
