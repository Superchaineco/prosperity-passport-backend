import Redis from 'ioredis';
import { REDIS_URL } from '../config/superChain/constants';
import { createClient } from 'redis';

const redisWorker = new Redis(REDIS_URL + '?family=0', {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
});

const redis = new Redis(REDIS_URL + '?family=0');

// This is technical debt, we should use a redis client that supports the JSON.GET command
const redisClient = createClient({ url: REDIS_URL + '?family=0' });

// Manejar errores del cliente Redis
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Conectar el cliente Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected successfully');
  } catch (error) {
    console.error('Failed to connect Redis client:', error);
  }
};

// Conectar inmediatamente
connectRedis();

// Verificar la conexión del cliente ioredis
redis
  .ping()
  .then((result) => {
    console.log('Redis connection successful:', result);
  })
  .catch((err) => {
    console.error('Redis connection failed:', err);
  });

export { redis, redisClient, redisWorker };
