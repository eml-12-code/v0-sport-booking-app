// --- 

'use server'

import pool from '@/lib/db'
import redis from '@/lib/redis'
import { ClassItem } from "@/types/sport-app"
import { safeBookClass } from '@/lib/redis'
import { RowDataPacket } from 'mysql2'


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

// Helper to generate consistent cache keys
const getCacheKey = (date: string, location: string) => `classes:${location}:${date}`

// ----------------------------------------------------------------------------------------------------
// Get classes for a specific date and location with Redis Cache-Aside
// ----------------------------------------------------------------------------------------------------


export async function getClasses(date: Date, location: string): Promise<ClassItem[]> {
  // 1. Format the Date object into a reliable 'YYYY-MM-DD' string for SQL and Cache keys
  const selectedDateString = date.toISOString().split('T')[0]
  
  // 💡 Include location inside the cacheKey so different areas don't overwrite each other
  const cacheKey = `classes:list:${location.toLowerCase().replace(/\s+/g, '-')}:${selectedDateString}`

  try {
    // 2. Try to read from the string list cache
    const cachedData = await redis.get(cacheKey)
    
    if (cachedData) {
      console.log(`🎯 [booking.ts -> getClasses] Cache Hit! Reading from list cache: ${cacheKey}`)
      const parsedClasses = JSON.parse(cachedData)

      // Overwrite static spots with live Redis atomic counters before returning
      const liveClassesSnapshot = await Promise.all(
        parsedClasses.map(async (cls: any) => {
          const classId = cls.classId || cls.class_id
          const liveSpots = await redis.get(`class:${classId}:spots`)
          return {
            ...cls,
            spots: liveSpots !== null ? Number(liveSpots) : cls.spots
          }
        })
      )
      return liveClassesSnapshot
    }

    console.warn(`⏳ [booking.ts -> getClasses] Cache Miss for date ${selectedDateString} at ${location}. Fetching from MySQL...`)

    // 3. MySQL Query matching your signature's date and location parameters
    const [rows] = await pool.execute<RowDataPacket[]>( // Using your global pool instance
      `SELECT 
        class_id, 
        name, 
        date, 
        time, 
        room, 
        instructor, 
        duration, 
        spots, 
        class_size, 
        color, 
        token_cost 
      FROM classes 
      WHERE DATE(date) = ? AND location = ?
      ORDER BY time ASC`,
      [selectedDateString, location]
    )

    // 4. Transform raw snake_case database records into camelCase ClassItem interfaces
    const formattedClasses: ClassItem[] = await Promise.all(
      rows.map(async (row: any) => {
        const classId = row.class_id
        const liveSpots = await redis.get(`class:${classId}:spots`)

        return {
          classId: classId,
          name: row.name,
          date: String(row.date),
          time: String(row.time),
          room: row.room,
          instructor: row.instructor,
          duration: row.duration,
          spots: liveSpots !== null ? Number(liveSpots) : row.spots,
          classSize: row.class_size,   // 💡 Properly mapped to your layout specifications
          color: row.color,
          tokenCost: row.token_cost,   // 💡 Properly mapped to your layout specifications
        }
      })
    )

    // 5. If entries exist, save them to cache and run your new utility debugger
    if (formattedClasses.length > 0) {
      await redis.set(cacheKey, JSON.stringify(formattedClasses), 'EX', 3600) // 1-hour expiration
      console.log(`💾 [booking.ts -> getClasses] Data saved to Redis cache: ${cacheKey}`)
      
      // Invoke your debugger function passing the exact formatted cache key
      await debugListCacheKey(cacheKey)
    }

    return formattedClasses

  } catch (error) {
    console.error(`❌ [booking.ts -> getClasses] Failed to load classes array list:`, error)
    return []
  }
}



// ----------------------------------------------------------------------------------------------------

// Get user's booked classes
export async function getBookedClasses(memberId: number): Promise<BookedClassItem[]> {
  
  console.log("📥 -- START getBookedClasses ----------------------------- 📥 ")
  console.log(`📥 [booking.ts -> getBookedClasses ] Search booking for memberId `, memberId)

  if (!memberId || memberId === 0) {
    return []
  }
  
  try {
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
        c.spots AS spotRemain
       FROM bookings b
       JOIN classes c ON b.class_id = c.class_id
       WHERE b.member_id = ? AND b.booking_status = 'confirmed'
       ORDER BY c.date ASC, c.time ASC`,
      [memberId]
    )

    console.log("📥 [booking.ts -> getBookedClasses ] Total Bookings Found:", rows.length, " for Member ID ", memberId);
    console.table(rows); 
 
    console.log("📥 -- END  getBookedClasses ----------------------------- 📥 ")

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

// --- Toggle booking for a class and invalidate relevant cache

export async function toggleBooking(classId: string, memberId: number): Promise<BookingResult> {

  console.log("📥 -- START   toggleBooking -------------------------------------------------------------------------")
  console.log("📥 [booking.ts -> toggleBooking ] memberId --- classId >", memberId, "---", classId);

  if (!memberId || memberId === 0) {
    return { success: false, message: 'Please log in to complete your booking.' };
  }

  const userTokensKey = `user:${memberId}:tokens`
  const spotsKey = `class:${classId}:spots`
  const classCostKey = `class:${classId}:cost`
  const bookedSetKey = `class:${classId}:booked`
  const queueListKey = `class:${classId}:queue`

  const connection = await pool.getConnection();

  try {
    // 1. Hydrate Class configuration data in Redis if missing
    const tokenCost = await hydrateClassCache(classId, connection);

    // 2. Hydrate Applicant's tokens into Redis if missing (Ensures script has accurate balance data)
    await ensureUserTokensCached(String(memberId), connection);

    // 3. Pre-fetch key updated from 'waiting_queue' to 'queue' to match your unified naming scheme
    const nextQueuedUser = await redis.lindex(`class:${classId}:queue`, 0);
    if (nextQueuedUser) {
      await ensureUserTokensCached(nextQueuedUser, connection); 
    }

    // 4. Check MySQL to find out if user has a confirmed or pending booking record
    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT booking_id FROM bookings WHERE class_id = ? AND member_id = ? AND booking_status IN ('confirmed', 'waiting')`,
      [classId, memberId]
    );

    // 5. Fetch target class metadata parameters needed to compile your precise list cache eviction key
    const [classMetaRows]: any = await connection.execute(
      `SELECT date, location FROM classes WHERE class_id = ? LIMIT 1`,
      [classId]
    );
    
    if (!classMetaRows || classMetaRows.length === 0) {
      throw new Error("Target class layout context parameters could not be found.");
    }

    // Safely structure formatting parameters (Outputs: 'YYYY-MM-DD' and 'Hong Kong')
    const classLocation = classMetaRows[0].location;
    const rawDate = new Date(classMetaRows[0].date);
    const classDateString = rawDate.toISOString().split('T')[0];

    // Evaluate intent: If an entry exists we route to CANCEL, otherwise BOOK
    const actionType: 'BOOK' | 'CANCEL' = existing.length > 0 ? 'CANCEL' : 'BOOK';

    console.log(`📥 [booking.ts -> toggleBooking] Action evaluated as: ${actionType}`);

    // 5. Fire the atomic multi-action Lua booking engine transaction
    const luaResult = await safeBookClass(String(memberId), classId, actionType);
    console.log("📥 [booking.ts -> toggleBooking ] Raw Engine return payload:", luaResult);

    // ------ ELM 
    const luaResultRaw = luaResult;
    let _luaResult = { status: "", message: "" };

    // ---- Add Debug & Eviction -----
    // 💡 This executes right after the Lua script alters Redis data, removing outdated list caches
    if (luaResult && (
      luaResult.status === "CONFIRMED" || 
      luaResult.status === "CANCEL_SUCCESSFUL" || 
      luaResult.status === "CANCEL_WITH_WAITLIST_UPGRADE"
    )) {
      // Compiles exact cache string format: classes:list:hong-kong:YYYY-MM-DD
      const staleCacheKey = `classes:list:${classLocation.toLowerCase().replace(/\s+/g, '-')}:${classDateString}`;
      
      await redis.del(staleCacheKey);
      console.log(`🧹 [booking.ts -> toggleBooking] Evicted stale list cache: ${staleCacheKey}`);
    }

    console.log("🔍 [booking.ts -> toggleBooking ] -- Step 6")

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


// --------------------------------------------
// Standard Cache Lazy-Loader for Token Balances
// --------------------------------------------

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

// --------------------------------------------
// Converts a flat Redis array ['key1', 'val1'] into a standard JS Object
// --------------------------------------------

function parseRedisResponse(arr: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < arr.length; i += 2) {
    if (arr[i]) {
      result[arr[i]] = arr[i + 1];
    }
  }
  return result;
}

// --------------------------------------------
// Syncs the decisions made by the atomic Redis Lua engine down into MySQL.
// --------------------------------------------

import { RowDataPacket } from "mysql2";

interface ClassMetadata {
  name: string;
  date: string;
  time: string;
  location: string;
  room: string;
}

export async function syncLuaResultToMySQL(
  connection: any,
  luaResult: string[],
  classId: string,
  memberId: number,
  tokenCost: number
): Promise<BookingResult> {

  console.log("--- syncLuaResultToMySQL -----------------------------------");
  console.log(`📥 [booking.ts] classId: ${classId} | memberId: ${memberId} | tokenCost: ${tokenCost}`);
  
  // 1. Parse flat Redis response arrays into a clean object
  const response = parseRedisResponse(luaResult);
  const { status, message, upgradedUser } = response;

  console.log(`📥 [booking.ts] parsed status: ${status} | message: ${message}`);
  
  // 2. Short-circuit immediately for early exits
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

  if (metaRows.length === 0) throw new Error("Class metadata missing");
  const classMeta = metaRows[0] as ClassMetadata;
  const formattedDate = new Date(classMeta.date).toISOString().split("T")[0];

  // 4. Open atomic MySQL transaction wrapper
  await connection.beginTransaction();

  try {
    // Fetch user token metrics up-front so ALL conditional blocks can access it cleanly
    const [accountRows] = await connection.execute(
      `SELECT token_remain FROM accounts WHERE member_id = ?`,
      [memberId]
    );
    const currentTokens = Number(accountRows[0]?.token_remain) || 0;
    const balanceAfterCancel = currentTokens + tokenCost;

    // ========================================================
    // CANCELLATION SCENARIOS -- FROM confirmed ---> cancelled
    // ========================================================
    if (status === "CANCEL_SUCCESSFUL") {
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' 
         WHERE class_id = ? AND member_id = ? AND booking_status = 'confirmed'`,
        [classId, memberId]
      );
      await connection.execute(`UPDATE classes SET spots = spots + 1 WHERE class_id = ?`, [classId]);
      await connection.execute(`UPDATE accounts SET token_remain = ? WHERE member_id = ?`, [balanceAfterCancel, memberId]);
      
      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, name, date, time, location, room, 
                 action, token_amount, token_balance_after, created_at, status_before, status_after) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'cancel', ?, ?, NOW(), 'confirmed', 'cancelled')`,
        [memberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, -tokenCost, balanceAfterCancel]
      );

      await connection.commit();
      await redis.del(`classes:${classMeta.location}:${formattedDate}`);
      return { success: true, message: "Booking cancelled successfully. Tokens refunded.", isBooked: false };
    }

    // ========================================================
    // CANCEL_WAITLIST_SUCCESSFUL -- FROM waiting ---> cancelled
    // ========================================================
    if (status === "CANCEL_WAITLIST_SUCCESSFUL") {
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' 
         WHERE class_id = ? AND member_id = ? AND booking_status = 'waiting'`,
        [classId, memberId]
      );

      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, name, date, time, location, room, 
                 action, token_amount, token_balance_after, created_at, status_before, status_after) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'cancel', ?, ?, NOW(), 'waiting', 'cancelled')`,
        [memberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, -tokenCost, balanceAfterCancel]
      );

      await connection.commit();
      return { success: true, message: "Removed from waiting list successfully.", isBooked: false };
    }

    // ========================================================
    // CANCEL_WITH_WAITLIST_UPGRADE -- FROM cancelled ---> confirmed
    // ========================================================

        // ========================================================
    // CANCEL_WITH_WAITLIST_UPGRADE -- Clean queue conversion fix
    // ========================================================
    if (status === "CANCEL_WITH_WAITLIST_UPGRADE") {

      // 🟢 FIX A: Keep member ID as a string representation to match VARCHAR(100) data types
      const upgradedUserMemberId = String(response.upgradedUser);
      console.log(`⏳ [booking.ts] Converting waiting row to confirmed for member: ${upgradedUserMemberId}`);

      // 1. Cancel original user booking row
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' 
         WHERE class_id = ? AND member_id = ? AND booking_status = 'confirmed'`,
        [classId, String(memberId)]
      );
      await connection.execute(`UPDATE accounts SET token_remain = ? WHERE member_id = ?`, [balanceAfterCancel, memberId]);

      // 2. 🟢 FIX B: Update User 2's EXISTING waiting row to confirmed status instead of inserting a new row!
      const [updateResult] = await connection.execute(
        `UPDATE bookings 
         SET booking_status = 'confirmed', booked_at = CURRENT_TIMESTAMP 
         WHERE class_id = ? AND member_id = ? AND booking_status = 'waiting'`,
        [classId, upgradedUserMemberId]
      );

      // Fallback: If no waiting record row existed to update, run a safe insertion command

      if ((updateResult as any).affectedRows === 0) {
        await connection.execute(
          `INSERT INTO bookings (class_id, name, date, time, location, room, member_id, booking_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
          [classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, upgradedUserMemberId]
        );
      }

      // 3. Fetch running metrics and deduct tokens
      const [upgradedAccountRows] = await connection.execute(
        `SELECT token_remain FROM accounts WHERE member_id = ?`,
        [upgradedUserMemberId]
      );
      const upgradedUserCurrentTokens = Number(upgradedAccountRows?.token_remain) || 0;
      const upgradedUserBalanceAfter = upgradedUserCurrentTokens - tokenCost;

      await connection.execute(`UPDATE accounts SET token_remain = ? WHERE member_id = ?`, [upgradedUserBalanceAfter, upgradedUserMemberId]);

      // 4. Log transactions ledger history
      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, name, date, time, location, room, 
                 action, token_amount, token_balance_after, created_at, status_before, status_after) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'cancel', ?, ?, NOW(), 'confirmed', 'cancelled')`,
        [memberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, -tokenCost, balanceAfterCancel]
      );

      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, name, date, time, location, room, 
                 action, token_amount, token_balance_after, created_at, status_before, status_after) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'waitlist_promote', ?, ?, NOW(), 'waiting', 'confirmed')`,
        [upgradedUserMemberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, tokenCost, upgradedUserBalanceAfter]
      );

      await connection.commit();
      await redis.del(`classes:${classMeta.location}:${formattedDate}`);
      return { success: true, message: "Cancelled. Spot passed to next user on waitlist.", isBooked: false };
    }



    // ========================================================
    // STANDARD BOOKING -- FROM book ---> confirmed
    // ========================================================
    if (status === "CONFIRMED") {
      await connection.execute(
        `INSERT INTO bookings (class_id, name, date, time, location, room, member_id, booking_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed') 
          ON DUPLICATE KEY UPDATE booking_status = 'confirmed', booked_at = CURRENT_TIMESTAMP`,
        [classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, memberId]
      );
      await connection.execute(`UPDATE classes SET spots = spots - 1 WHERE class_id = ?`, [classId]);

      const balanceAfterBook = currentTokens - tokenCost;
      await connection.execute(`UPDATE accounts SET token_remain = ? WHERE member_id = ?`, [balanceAfterBook, memberId]);

      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, name, date, time, location, room, 
                 action, token_amount, token_balance_after, created_at, status_before, status_after)  
         VALUES (?, ?, ?, ?, ?, ?, ?, 'book', ?, ?, NOW(), 'NONE', 'confirmed')`,
        [memberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, tokenCost, balanceAfterBook]
      );

      await redis.decrby(`user:${memberId}:tokens`, tokenCost);
      await connection.commit();
      await redis.del(`classes:${classMeta.location}:${formattedDate}`);
      return { success: true, message: "Class booked successfully!", isBooked: true };
    }

    // ========================================================
    // WAITING_QUEUE -- FROM book ---> waiting
    // ========================================================
    if (status === "WAITING_QUEUE") {
      try {
        await connection.execute(
          `INSERT INTO bookings (class_id, name, date, time, location, room, member_id, booking_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting') 
           ON DUPLICATE KEY UPDATE booking_status = 'waiting', booked_at = CURRENT_TIMESTAMP`,
          [classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, memberId]
        );
    
        await connection.execute(
          `INSERT INTO transactions_log 
            (member_id, action, class_id, name, date, time, location, room, 
             token_amount, token_balance_after, created_at, status_before, status_after) 
           VALUES (?, 'waitlist_join', ?, ?, ?, ?, ?, ?, NULL, ?, NOW(), 'NONE', 'waiting')`,
          [memberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, currentTokens]
        );

        await connection.commit();
      } catch (dbError) {
        console.error("⚠️ Failed to sync waitlist state entry to MySQL:", dbError);
      }
      return { success: false, message: "WAITING_QUEUE", isBooked: false };
    }

    // ========================================================
    // CONFIRMED_QUEUE_UPGRADE -- Clean queue conversion fix
    // ========================================================
    if (status === "CONFIRMED_QUEUE_UPGRADE") {
      console.log(`⏳ [booking.ts] CONFIRMED_QUEUE_UPGRADE`);
      // 🟢 FIX A: Force member ID parameter to match string representation
      const upgradedUserMemberId = String(response.upgradedUser);

      // 1. Clear out original user session booking record slot entirely
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' 
         WHERE class_id = ? AND member_id = ? AND booking_status = 'confirmed'`,
        [classId, String(memberId)]
      );

      // 2. 🟢 FIX B: Directly transform user 2's waiting row into their confirmed slot
      const [updateResult] = await connection.execute(
        `UPDATE bookings 
         SET booking_status = 'confirmed', booked_at = CURRENT_TIMESTAMP 
         WHERE class_id = ? AND member_id = ? AND booking_status = 'waiting'`,
        [classId, upgradedUserMemberId]
      );

      // Fallback insurance loop
      if ((updateResult as any).affectedRows === 0) {
        await connection.execute(
          `INSERT INTO bookings (class_id, name, date, time, location, room, member_id, booking_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
          [classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, upgradedUserMemberId]
        );
      }

      // 3. Process account token balance deduction
      const [upgradedAccountRows] = await connection.execute(
        `SELECT token_remain FROM accounts WHERE member_id = ?`,
        [upgradedUserMemberId]
      );
      const upgradedUserCurrentTokens = Number(upgradedAccountRows?.token_remain) || 0;
      const upgradedUserBalanceAfter = upgradedUserCurrentTokens - tokenCost;

      await connection.execute(`UPDATE accounts SET token_remain = ? WHERE member_id = ?`, [upgradedUserBalanceAfter, upgradedUserMemberId]);

      // 4. Redis pipeline caching balances execution
      const pipeline = redis.pipeline();
      pipeline.decrby(`user:${upgradedUserMemberId}:tokens`, tokenCost);
      pipeline.incrby(`user:${memberId}:tokens`, tokenCost);
      await pipeline.exec();

      // 5. Append clean transaction ledger lines
      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, name, date, time, location, room, 
                 action, token_amount, token_balance_after, created_at, status_before, status_after)  
         VALUES (?, ?, ?, ?, ?, ?, ?, 'waitlist_promote', ?, ?, NOW(), 'waiting', 'confirmed')`,
        [upgradedUserMemberId, classId, classMeta.name, classMeta.date, classMeta.time, classMeta.location, classMeta.room, tokenCost, upgradedUserBalanceAfter]
      );

      await connection.commit();
      await redis.del(`classes:${classMeta.location}:${formattedDate}`);
      return { success: true, message: "Spot transferred to waitlisted user.", isBooked: false };
    }





// ========================================================
// Any other status - unhandled 
// ========================================================

    throw new Error(`Unhandled Lua script return flag: ${status}`);

  } catch (txError) {
    await connection.rollback();
    console.error("❌ Transaction runtime crashed. Rolling back database changes:", txError);
    throw txError;
  }
}


// ----------------------------
// -- hydrateClassCache
// ----------------------------


async function hydrateClassCache(classId: string, connection: any): Promise<number> {

  console.log("📥 -- START hydrateClassCache ------------------------------ 📥 ")

  const spotsKey = `class:${classId}:spots`;
  const costKey = `class:${classId}:cost`;
  const bookedSetKey = `class:${classId}:booked`;
  const queueListKey = `class:${classId}:queue`; 

  // 1. Check if the keys already exist in Redis memory
  const exists = await redis.exists(spotsKey);

  if (exists === 0) {
    
    console.warn(`⚠️ -- Cache Miss/Redis Flush detected for class ${classId}. Hydrating from MySQL...`);

    // 2. Fetch the true source of truth from your SQL database

    const [classRows] = await connection.execute<RowDataPacket[]>(
      `SELECT spots, token_cost FROM classes WHERE class_id = ?`,
      [classId]
    );

    if (classRows.length === 0) throw new Error('Class not found in system database.');

    console.log("📥 [booking.ts -> hydrateClassCache ]")
    console.table(classRows)


    const initialSpots = classRows[0].spots;
    const tokenCost = classRows[0].token_cost || 1;


    console.log("📥 [booking.ts -> hydrateClassCache ] initialSpots ", initialSpots)
    console.log("📥 [booking.ts -> hydrateClassCache ] tokenCost ", tokenCost)

    // 3. Fetch existing confirmed bookings to rebuild the Redis Set snapshot
    const [bookingRows] = await connection.execute<RowDataPacket[]>(
      `SELECT member_id FROM bookings WHERE class_id = ? AND booking_status = 'confirmed'`,
      [classId]
    );

    console.log ( "📥 10 [booking.ts -> hydrateClassCache ] bookingRows ")
    console.table (bookingRows)

    // 4. Fetch existing waitlisted users to rebuild the Redis Queue List snapshot
    const [waitlistRows] = await connection.execute<RowDataPacket[]>(
      `SELECT member_id FROM bookings WHERE class_id = ? AND booking_status = 'waiting' ORDER BY booked_at ASC`,
      [classId]
    );

    console.log ( "📥 [booking.ts -> hydrateClassCache ] waitlistRows ")
    console.table (waitlistRows)

    // 5. Save to Redis so the Lua script can read it instantly (48-hour expiration)
    await redis.set(spotsKey, initialSpots, 'EX', 172800);
    await redis.set(costKey, tokenCost, 'EX', 172800);

    // Hydrate Confirmed Booking Set
    if (bookingRows.length > 0) {
      const memberIds = bookingRows.map(row => String(row.member_id));
      await redis.sadd(bookedSetKey, ...memberIds);
      await redis.expire(bookedSetKey, 172800);
    }

    // Hydrate Waiting List Queue
    if (waitlistRows.length > 0) {
      const queuedIds = waitlistRows.map(row => String(row.member_id));
      await redis.rpush(queueListKey, ...queuedIds);
      await redis.expire(queueListKey, 172800);
    }

    console.log(`✅ [hydrateClassCache] Cache built successfully for class ${classId}. Spots: ${initialSpots}, Booked: ${bookingRows.length}, Waitlist: ${waitlistRows.length}`);

    console.log("📥 -- END   hydrateClassCache ------------------------------ 📥 ")
    return tokenCost;
  }

  // If already in Redis, fetch the cost directly to return it
  const cachedCost = await redis.get(costKey);
  console.log("📥 [booking.ts -> hydrateClassCache ] - cachedCost ", cachedCost)
  return Number(cachedCost) || 1;
}


// --
// -- Utility to read, parse, and visually print the contents of a list cache key
// --

async function debugListCacheKey(cacheKey: string): Promise<void> {
  try {
    const rawCachedData = await redis.get(cacheKey)
    
    if (rawCachedData) {
      const parsedCacheArray = JSON.parse(rawCachedData)
      
      console.log(`\n🔍 ===== [REDIS CACHE KEY READBACK: ${cacheKey}] =====`)
      console.log(`📦 Total classes cached: ${parsedCacheArray.length}`)
      
      // Beautiful console-friendly breakdown layout grid
      if (Array.isArray(parsedCacheArray)) {
        console.table(parsedCacheArray.map((c: any) => ({
          id: c.classId || c.class_id,
          name: c.name,
          time: c.time,
          spots: c.spots,
          size: c.classSize || c.class_size,
          cost: c.tokenCost || c.token_cost
        })))
      } else {
        console.log("📄 Raw Object Contents:", parsedCacheArray)
      }
      console.log("========================================================\n")
    } else {
      console.log(`⚠️ [debugListCacheKey] Cache key "${cacheKey}" returned empty or null.`)
    }
  } catch (error) {
    console.error(`❌ Failed to read back the saved Redis cache key (${cacheKey}):`, error)
  }
}



// ------------
// Utility to print the live snapshot state of Redis keys after a mutation event
// ------------

async function debugRedisBookingKeys(keys: {
  userTokensKey: string
  spotsKey: string
  classCostKey: string
  bookedSetKey: string
  queueListKey: string
}) {
  try {
    // Fetch values from Redis concurrently
    const [tokens, spots, cost, bookedMembers, waitlistLength] = await Promise.all([
      redis.get(keys.userTokensKey),
      redis.get(keys.spotsKey),
      redis.get(keys.classCostKey),
      redis.smembers(keys.bookedSetKey), // Fetch entire Set array list
      redis.llen(keys.queueListKey)       // Fetch list array size
    ])

    console.log("\n====== 🔴 [REDIS CACHE SNAPSHOT LOG] ======")
    console.log(`🔑 Key [User Tokens] (${keys.userTokensKey}):`, tokens ?? "NULL")
    console.log(`🔑 Key [Class Spots] (${keys.spotsKey}):`, spots ?? "NULL")
    console.log(`🔑 Key [Class Cost]   (${keys.classCostKey}):`, cost ?? "1 (Default)")
    console.log(`🔑 Key [Booked Set]   (${keys.bookedSetKey}):`, bookedMembers)
    console.log(`🔑 Key [Waitlist Len] (${keys.queueListKey}):`, waitlistLength)
    console.log("============================================\n")
  } catch (error) {
    console.error("❌ Failed to output Redis debug logs:", error)
  }
}


