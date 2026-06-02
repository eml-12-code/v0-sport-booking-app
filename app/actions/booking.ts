'use server'

import pool from '@/lib/db'
import redis from '@/lib/redis'
import { safeBookClass } from '@/lib/redis'
import { RowDataPacket } from 'mysql2'

export interface ClassItem {
  classId: string
  time: string
  name: string
  room: string
  instructor: string
  duration: string
  spots: number
  color: 'blue' | 'pink' | 'yellow' | 'green'
}

export interface BookingResult {
  success: boolean
  message: string
  isBooked?: boolean
}

export interface BookedClassItem {
  bookingId: string
  classId: string
  className: string
  time: string
  room: string
  instructor: string
  date: string
  location: string
  spots: number
}

// ========================
// Ensures the required Lua script keys exist in Redis memory.
// If Redis crashed or restarted, this function re-hydrates it from MySQL.
// ========================

async function hydrateClassCache(classId: string, connection: any): Promise<number> {

  const spotsKey = `class:${classId}:spots`;
  const costKey = `class:${classId}:cost`;

  // 1. Check if the keys already exist in Redis memory
  const exists = await redis.exists(spotsKey);

  if (exists === 0) {
    
    console.warn(`⚠️ Cache Miss/Redis Flush detected for class ${classId}. Hydrating from MySQL...`);

    // 2. Fetch the true source of truth from your SQL database
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT spots, token_cost FROM classes WHERE class_id = ?`,
      [classId]
    );

    if (rows.length === 0) throw new Error('Class not found in system database.');

    console.log("📥 [booking.ts -> hydrateClassCache ]")
    console.table(rows)

    const spots = rows[0].spots;
    const tokenCost = rows[0].token_cost || 1;

    // 3. Save to Redis so the Lua script can read it instantly (48-hour expiration)
    await redis.set(spotsKey, spots, 'EX', 172800);
    await redis.set(costKey, tokenCost, 'EX', 172800);

    return tokenCost;
  }

  // If already in Redis, fetch the cost directly to return it
  const cachedCost = await redis.get(costKey);
  console.log("📥 [booking.ts -> hydrateClassCache ] - cachedCost ", cachedCost)
  return Number(cachedCost) || 1;
}

// Helper to generate consistent cache keys
const getCacheKey = (date: string, location: string) => `classes:${location}:${date}`

// Get classes for a specific date and location with Redis Cache-Aside
export async function getClasses(date: Date, location: string): Promise<ClassItem[]> {
  try {
    console.log("📥 [booking.ts -> getClasses ] Raw date passed to function:", date, "Type of date:", typeof date);
    const formattedDate = date.toISOString().split('T')[0]
    
    console.log("📥 [booking.ts -> getClasses ] Processing SQL search for date:", formattedDate);
    const cacheKey = getCacheKey(formattedDate, location);
    console.log("📥 [booking.ts -> getClasses ] cacheKey :", cacheKey);
    
    // 1. Try to get data from Redis
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      console.log('📥 [booking.ts -> getClasses ] Redis Cache Hit for:', cacheKey)
      console.table(JSON.parse(cachedData));
      return JSON.parse(cachedData)
    }

    // 2. If not in Redis, fetch from MySQL
    console.log('📥 [booking.ts -> getClasses ] Redis Cache Miss. Fetching from MySQL...')
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT class_id AS classId, name, date, DATE_FORMAT(time, '%l:%i %p') as time, location, room, instructor, duration, spots, color 
       FROM classes 
       WHERE date = ? AND location = ?
       ORDER BY classes.time ASC`,
      [formattedDate, location]
    )
    console.log(`💾 [booking.ts -> getClasses ] Data saved to Redis cache: ${cacheKey}`)
    console.table(rows);

    const classes = rows as ClassItem[]

    // 3. Store in Redis for 1 hour (3600 seconds) if data exists
    if (classes.length > 0) {
      await redis.set(cacheKey, JSON.stringify(classes), 'EX', 3600)
      console.log(`💾 [booking.ts -> getClasses ] Data saved to Redis cache: ${cacheKey}`)
    }

    return classes
  } catch (error) {
    console.error('❌ [booking.ts -> getClasses ] Error fetching classes:', error)
    return []
  }
}

// Get user's booked classes
export async function getBookedClasses(memberId: number): Promise<BookedClassItem[]> {
  console.log(`📥 [booking.ts -> getBookedClasses ] - memberId `, memberId)

  if (!memberId || memberId === 0) {
    return []
  }
  
  try {
    console.log("📥 [booking.ts -> getBookedClasses ] Search booking for memberId", memberId)
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        b.booking_id AS bookingId, 
        b.class_id AS classId, 
        c.name AS className, 
        c.date, 
        DATE_FORMAT(c.time, '%l:%i %p') AS time, 
        c.location,
        c.room, 
        c.instructor, 
        c.spots
       FROM bookings b
       JOIN classes c ON b.class_id = c.class_id
       WHERE b.member_id = ? AND b.booking_status = 'confirmed'
       ORDER BY c.date ASC, c.time ASC`,
      [memberId]
    )

    console.log("📥 [booking.ts -> getBookedClasses ] Total Bookings Found:", rows.length, " for Member ID ", memberId);
    console.table(rows); 

    return rows.map((row) => ({
      bookingId: String(row.bookingId),
      classId: String(row.classId),
      className: String(row.className),
      time: String(row.time),
      room: String(row.room),
      instructor: String(row.instructor),
      date: new Date(row.date).toISOString().split('T')[0],
      location: String(row.location),
      spots: Number(row.spots ?? 0),
    }))
  } catch (error) {
    console.error('❌ [booking.ts -> getBookedClasses ] Error fetching booked classes:', error)
    return []
  }
}

// Toggle booking for a class and invalidate relevant cache
export async function toggleBooking(classId: string, memberId: number): Promise<BookingResult> {
  console.log("📥 [booking.ts -> toggleBooking ] memberId --- classId >", memberId, "---", classId);

  if (!memberId || memberId === 0) {
    return { success: false, message: 'Please log in to complete your booking.' };
  }

  const connection = await pool.getConnection();

  try {
    // 1. Hydrate Class configuration data in Redis if missing
    const tokenCost = await hydrateClassCache(classId, connection);

    // 2. Hydrate Applicant's tokens into Redis if missing (Ensures script has accurate balance data)
    await ensureUserTokensCached(String(memberId), connection);

    // 3. Pre-fetch and warm up the next user in the queue to bypass cache-drift blocks
    const nextQueuedUser = await redis.lindex(`class:${classId}:waiting_queue`, 0);
    if (nextQueuedUser) {
      await ensureUserTokensCached(nextQueuedUser, connection); 
    }

    // 4. Check MySQL to find out if user has a confirmed or pending booking record
    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT booking_id FROM bookings WHERE class_id = ? AND member_id = ? AND booking_status IN ('confirmed', 'waiting')`,
      [classId, memberId]
    );

    // Evaluate intent: If an entry exists we route to CANCEL, otherwise BOOK
    const actionType: 'BOOK' | 'CANCEL' = existing.length > 0 ? 'CANCEL' : 'BOOK';
    console.log(`📥 [booking.ts -> toggleBooking] Action evaluated as: ${actionType}`);

    // 5. Fire the atomic multi-action Lua booking engine transaction
    const luaResult = await safeBookClass(String(memberId), classId, actionType);
    console.log("📥 [booking.ts -> toggleBooking ] Engine return payload:", luaResult);

    // 6. Sync decisions back to MySQL and verify Redis token counts remain matching
    const result = await syncLuaResultToMySQL(connection, luaResult, classId, memberId, tokenCost);
    return result;
    
  } catch (error: any) {
    console.error('Booking engine crash recovered:', error);
    return { success: false, message: error.message || 'Transaction failure.' };
  } finally {
    connection.release();
  }
}

/**
 * Standard Cache Lazy-Loader for Token Balances
 */
async function ensureUserTokensCached(userId: string, connection: any): Promise<number> {
  const tokenKey = `user:${userId}:tokens`;
  
  const exists = await redis.exists(tokenKey);
  if (exists === 1) {
    const cachedTokens = await redis.get(tokenKey);
    return Number(cachedTokens) || 0;
  }

  const [accountRows] = await connection.execute<RowDataPacket[]>(
    `SELECT token_remain FROM accounts WHERE member_id = ?`,
    [userId]
  );
  if (accountRows.length === 0) throw new Error('Account balance profile not found.');
  
  const tokens = Number(accountRows[0].token_remain) || 0;
  
  await redis.set(tokenKey, tokens, 'EX', 7200);
  return tokens;
}

/**
 * Converts a flat Redis array ['key1', 'val1'] into a standard JS Object
 */
function parseRedisResponse(arr: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < arr.length; i += 2) {
    if (arr[i]) {
      result[arr[i]] = arr[i + 1];
    }
  }
  return result;
}

/**
 * Syncs the decisions made by the atomic Redis Lua engine down into MySQL.
 */
async function syncLuaResultToMySQL(
  connection: any,
  luaResult: string[],
  classId: string,
  memberId: number,
  tokenCost: number
): Promise<BookingResult> {

  // 1. Parse flat Redis response arrays into a clean object
  const response = parseRedisResponse(luaResult);
  const status = response.status;
  const message = response.message;

  // 2. Short-circuit immediately for early exits (Saves database transaction overhead)
  if (status === "ERROR_EXIT") {
    return { success: false, message };
  }
  if (status === "REJECTED_DUPLICATE") {
    return { success: false, message: message || "You are already booked for this session." };
  }

  // 3. Fetch metadata required for audit trails and transactions log tracking
  const [metaRows] = await connection.execute<RowDataPacket[]>(
    `SELECT name, date, time, location, room FROM classes WHERE class_id = ?`,
    [classId]
  );


  if (metaRows.length === 0) throw new Error('Class metadata missing');
  const classMeta = metaRows[0];
  const formattedDate = new Date(classMeta.date).toISOString().split('T')[0];

  // 4. Open atomic MySQL transaction wrapper
  await connection.beginTransaction();

  try {
    // ========================================================
    // CANCELLATION SCENARIOS
    // ========================================================
      
      if (status === "CANCEL_SUCCESSFUL") {
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' WHERE class_id = ? AND member_id = ? AND booking_status = 'confirmed'`,
        [classId, memberId]
      );
      await connection.execute(`UPDATE classes SET spots = spots + 1 WHERE class_id = ?`, [classId]);
      
      // 1. Fetch current tokens from accounts table to compute balance history
      const [accountRows] = await connection.execute(
        `SELECT token_remain FROM accounts WHERE member_id = ?`,
        [memberId]
      );
      const currentTokens = Number(accountRows[0].token_remain) || 0;
      const balanceAfterCancel = currentTokens + tokenCost;

      await connection.execute(
        `UPDATE accounts SET token_remain = ? WHERE member_id = ?`, 
        [balanceAfterCancel, memberId]
      );
      
      // 🔥 UPDATED: Pass token_balance_after column (second to last parameter)
      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, name, date, time, location, room, action, token_amount, token_balance_after, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'cancel', ?, ?, NOW())`,
        [memberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, -tokenCost, balanceAfterCancel]
      );

      await connection.commit();
      await redis.del(`classes:${classMeta.location}:${formattedDate}`);
      return { success: true, message: "Booking cancelled successfully. Tokens refunded.", isBooked: false };
    }

    // -------------------

    if (status === "CANCEL_WAITLIST_SUCCESSFUL") {
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' WHERE class_id = ? AND member_id = ? AND booking_status = 'waiting'`,
        [classId, memberId]
      );
      await connection.commit();
      return { success: true, message: "Removed from waiting list successfully.", isBooked: false };
    }

    if (status === "CANCEL_WITH_WAITLIST_UPGRADE") {
      const upgradedUser = Number(response.upgradedUser);

      // Cancel original user booking row
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' WHERE class_id = ? AND member_id = ? AND booking_status = 'confirmed'`,
        [classId, memberId]
      );
      await connection.execute(
        `UPDATE accounts SET token_remain = token_remain + ? WHERE member_id = ?`, 
        [tokenCost, memberId]
      );

      // Promote waitlisted user row to confirmed status
      await connection.execute(
        `INSERT INTO bookings (class_id, name, date, time, location, room, member_id, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed') ON DUPLICATE KEY UPDATE booking_status = 'confirmed', booked_at = CURRENT_TIMESTAMP`,
        [classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, upgradedUser]
      );
      await connection.execute(
        `UPDATE accounts SET token_remain = token_remain - ? WHERE member_id = ?`, 
        [tokenCost, upgradedUser]
      );

      await connection.commit();
      await redis.del(`classes:${classMeta.location}:${formattedDate}`);
      return { success: true, message: "Cancelled. Spot passed to next user on waitlist.", isBooked: false };
    }

    // ========================================================
    // STANDARD BOOKING SCENARIOS
    // ========================================================
    
    if (status === "CONFIRMED") {
      await connection.execute(
        `INSERT INTO bookings (class_id, name, date, time, location, room, member_id, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed') ON DUPLICATE KEY UPDATE booking_status = 'confirmed', booked_at = CURRENT_TIMESTAMP`,
        [classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, memberId]
      );
      await connection.execute(`UPDATE classes SET spots = spots - 1 WHERE class_id = ?`, [classId]);

      // 1. Fetch current tokens from accounts table to compute balance history
      const [accountRows] = await connection.execute(
        `SELECT token_remain FROM accounts WHERE member_id = ?`,
        [memberId]
      );
      const currentTokens = Number(accountRows[0].token_remain) || 0;
      const balanceAfterBook = currentTokens - tokenCost;

      await connection.execute(
        `UPDATE accounts SET token_remain = ? WHERE member_id = ?`, 
        [balanceAfterBook, memberId]
      );

      // 🔥 UPDATED: Pass token_balance_after column (second to last parameter)
      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, name, date, time, location, room, action, token_amount, token_balance_after, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'book', ?, ?, NOW())`,
        [memberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, tokenCost, balanceAfterBook]
      );

      const userTokensKey = `user:${memberId}:tokens`;
      await redis.decrby(userTokensKey, tokenCost);

      await connection.commit();
      await redis.del(`classes:${classMeta.location}:${formattedDate}`);
      return { success: true, message: "Class booked successfully!", isBooked: true };
    }


    // -------

    if (status === "CONFIRMED_QUEUE_UPGRADE") {
      const upgradedUser = Number(response.upgradedUser);

      await connection.execute(
        `INSERT INTO bookings (class_id, name, date, time, location, room, member_id, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed') ON DUPLICATE KEY UPDATE booking_status = 'confirmed', booked_at = CURRENT_TIMESTAMP`,
        [classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, upgradedUser]
      );
      await connection.execute(
        `UPDATE accounts SET token_remain = token_remain - ? WHERE member_id = ?`, 
        [tokenCost, upgradedUser]
      );
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' WHERE class_id = ? AND member_id = ? AND booking_status = 'confirmed'`,
        [classId, memberId]
      );

      // Sync both user tokens atomically in Redis using a Pipeline block
      const upgradedUserTokensKey = `user:${upgradedUser}:tokens`;
      const originalUserTokensKey = `user:${memberId}:tokens`;

      const pipeline = redis.pipeline();
      pipeline.decrby(upgradedUserTokensKey, tokenCost);
      pipeline.incrby(originalUserTokensKey, tokenCost);
      await pipeline.exec();

      await connection.commit();
      await redis.del(`classes:${classMeta.location}:${formattedDate}`);
      return { success: true, message: "Spot transferred to waitlisted user.", isBooked: false };
    }

    throw new Error(`Unhandled Lua script return flag: ${status}`);

  } catch (txError) {
    await connection.rollback();
    throw txError;
  }
}

/**
 * 🔥 DEV-ONLY TEST ACTION: Triggers your atomic Lua booking engine over the Docker network
 */
export async function testLuaBookingEngine(
  userId: string, 
  classId: string, 
  testType: 'normal' | 'insufficient_tokens' | 'waitlist'
): Promise<any> {
  console.log(`\n🧪 [LUA TEST] Starting script validation sequence for User: ${userId}, Class: ${classId}`);
  
  const userTokensKey = `user:${userId}:tokens`;
  const spotsKey = `class:${classId}:spots`;
  const classCostKey = `class:${classId}:cost`;
  const bookedSetKey = `class:${classId}:booked_users`;
  const queueListKey = `class:${classId}:waiting_queue`;

  try {
    await redis.del(userTokensKey, spotsKey, classCostKey, bookedSetKey, queueListKey);

    if (testType === 'normal') {
      console.log('  -> Scenario: Valid booking (User has tokens, class has spaces)');
      await redis.set(classCostKey, '3');
      await redis.set(userTokensKey, '10');
      await redis.set(spotsKey, '5');
    } else if (testType === 'insufficient_tokens') {
      console.log('  -> Scenario: Insufficient Tokens block');
      await redis.set(classCostKey, '5');
      await redis.set(userTokensKey, '2');
      await redis.set(spotsKey, '5');
    } else if (testType === 'waitlist') {
      console.log('  -> Scenario: Class full (Send to waiting queue list)');
      await redis.set(classCostKey, '1');
      await redis.set(userTokensKey, '5');
      await redis.set(spotsKey, '0');
    }

    const result = await safeBookClass(userId, classId, 'BOOK');
    console.log('🎉 [LUA TEST EXECUTION RESULT]:', result);

    const endingTokens = await redis.get(userTokensKey);
    const endingSpots = await redis.get(spotsKey);
    const bookedUsers = await redis.smembers(bookedSetKey);
    const waitlistedUsers = await redis.lrange(queueListKey, 0, -1);

    return {
      success: true,
      endingTokens,
      endingSpots,
      bookedUsers,
      waitlistedUsers
    };
  } catch (err: any) {
    console.error("❌ Test runner error:", err);
    return { success: false, error: err.message };
  }
}




