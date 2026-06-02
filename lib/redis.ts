// --- 04-29

import Redis from 'ioredis'
import fs from 'fs'
import path from 'path'


// Docker Compose --> Service Name
// In docker-compose.yml Redis Section  "redis-cache"
// Use environment variables for flexibility

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis-cache',    // 'redis-service' is the name in docker-compose
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
})


// Memory reference to store the generated 40-character SHA1 hash
let bookingScriptSha = ''

// =====

async function loadLuaScript(): Promise<string> {
  try {

    // Look in standard workspace root first
    let scriptPath = path.join(process.cwd(), 'lib', 'lua', 'bookingEngine.lua')
    console.log(`🔍 Script loader searching for file at absolute path: ${scriptPath}`)
    
    // Fallback: If running inside Next.js standalone runner, check relative pathing

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Physical Lua script asset was not found at expected path: ${scriptPath}`)
    }

    const scriptContent = fs.readFileSync(scriptPath, 'utf8')
    console.log(`🚀 Lua script: ${scriptContent}`)

    
    bookingScriptSha = await redis.script('LOAD', scriptContent)
       console.log(`🚀 Lua script registered into Redis memory. SHA1: ${bookingScriptSha}`)
    
    return bookingScriptSha;

  } catch (error) {
    console.error('❌ Critical: Failed to load Lua script file:', error)
    throw error
  }
}


// 🔥 INLINED SCRIPT CONTENT: Safe, zero file-system dependencies, completely crash-proof

const bookingLuaScriptText = ''



// ---------------

/**
 * Main booking transaction method with automated fallback logic
 */

export async function safeBookClass(
    userId: string, 
    classId: string, 
    action: 'BOOK' | 'CANCEL' = 'BOOK' 
    ): Promise<any> {
  const keys = [
    `user:${userId}:tokens`,
    `class:${classId}:spots`,
    `class:${classId}:cost`,
    `class:${classId}:booked_users`,
    `class:${classId}:waiting_queue`
  ]

  // If the app just booted or restarted and hasn't cached the hash string yet, fetch it
  if (!bookingScriptSha) {
    await loadLuaScript()
  }

  try {

    // Run the fast hash-based script check over the network
    // We cast the output because evaluation returns arrays or strings from Redis

    const result = await redis.evalsha(bookingScriptSha, keys.length, ...keys, userId, action)
    return result

  } catch (error) {

    // Catches the error if the Redis container restarted and wiped out its RAM
    
    if (error instanceof Error && error.message.includes('NOSCRIPT')) {
      await loadLuaScript()
      console.warn('⚠️ Redis cache was flushed or restarted. Reloading script and retrying...')
      
      // Re-upload the code directly into the container's RAM pool
      await loadLuaScript()
      
      // Instantly re-run the transaction with the fresh hash
      return await redis.evalsha(bookingScriptSha, keys.length, ...keys, userId, action)
    }

    console.error('❌ Booking transaction aborted due to an unexpected network error:', error)
    throw error
  }
}


// =-----------


/**
 * Global Cache Eviction: Call this whenever a user's tokens are altered 
 * in MySQL from an external event (e.g., top-up, refund, admin edit).
 */
export async function evictUserTokenCache(userId: string | number): Promise<void> {
  const tokenKey = `user:${userId}:tokens`;
  await redis.del(tokenKey);
  console.log(`🧹 [Cache Eviction] Cleared stale token cache for user: ${userId}`);
}

// -----


export default redis
