// --- 04-29

import Redis from 'ioredis'

// Docker Compose --> Service Name
// In docker-compose.yml Redis Section  "redis-cache"
// Use environment variables for flexibility

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis-cache',    // 'redis-service' is the name in docker-compose
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,

  retryStrategy: (times) => Math.min(times * 50, 2000),
})

export default redis
