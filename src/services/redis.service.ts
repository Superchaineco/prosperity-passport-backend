import { redis, redisClient } from '../utils/cache';
import { createFarcaster, getFarcaster } from './farcasterService';
import { createUser, getUser } from './usersService';

export class RedisService {
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
        // return JSON.parse(cachedData);
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
      throw error;
    }
  }

  public async setCachedData(key: string, data: any, ttl: number) {
    if (ttl) await redis.set(key, JSON.stringify(data), 'EX', ttl);
    else {
      try {
        if (key.startsWith('self_id:')) {
          await createUser({
            account: key.replace('self_id:', ''),
            nationality: data.nationality,
          });
        } else if (key.startsWith('farcasterLink')) {
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
      if (key.startsWith('self_id:')) {
        return await getUser(key.replace('self_id:', ''));
      } else if (key.startsWith('farcasterLink')) {
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
