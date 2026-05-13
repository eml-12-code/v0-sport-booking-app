'use server'

import pool from '@/lib/db'
import redis from '@/lib/redis'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// ---------

import Redlock from 'redlock';

// Initialize Redlock with your existing Redis instance

const redlock = new Redlock(
  [redis], 
  {
    driftFactor: 0.01, 
    retryCount: 10,    // Retry 10 times if the lock is held by someone else
    retryDelay: 200,   // Wait 200ms between retries
    retryJitter: 200, 
  }
);

// ---------

export interface ClassItem {
  id: string
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
  id: string
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


// Get classes for a specific date and location with Redis Cache-Aside
export async function getClasses(date: Date, location: string): Promise<ClassItem[]> {

  try {
    const formattedDate = date.toISOString().split('T')[0]
    const cacheKey = getCacheKey(formattedDate, location)

    // 1. Try to get data from Redis
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      console.log('Redis Cache Hit for:', cacheKey)
      return JSON.parse(cachedData)
    }

    // 2. If not in Redis, fetch from MySQL
    console.log('Redis Cache Miss. Fetching from MySQL...')
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, DATE_FORMAT(time, '%l:%i %p') as time, name, room, instructor, duration, spots, color 
       FROM classes 
       WHERE date = ? AND location = ?
       ORDER BY time`,
      [formattedDate, location]
    )

    const classes = rows as ClassItem[]

    // 3. Store in Redis for 1 hour (3600 seconds) if data exists
    if (classes.length > 0) {
      await redis.set(cacheKey, JSON.stringify(classes), 'EX', 3600)
      console.log(`💾 Data saved to Redis cache: ${cacheKey}`)
    }

    return classes

  } catch (error) {
    console.error('Error fetching classes:', error)
    return []
  }
}

// Get user's booked classes
export async function getBookedClasses(
  userId: string = 'anonymous',
): Promise<BookedClassItem[]> {
  
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        b.id, 
        b.class_id as classId, 
        c.name as className, 
        DATE_FORMAT(c.time, '%l:%i %p') as time, 
        c.room, 
        c.instructor, 
        c.date, 
        c.location,
        c.spots
       FROM bookings b
       JOIN classes c ON b.class_id = c.id
       WHERE b.user_id = ? AND b.status = 'confirmed'
       ORDER BY c.date ASC, c.time ASC`,
      [userId]    )
    
    return rows.map((row) => ({
      id: String(row.id),
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
    console.error('Error fetching booked classes:', error)
    return []
  }
}

// Toggle booking for a class and invalidate relevant cache


export async function toggleBooking(classId: string, userId: string = 'anonymous'): Promise<BookingResult> {
  const lockKey = `locks:class:${classId}`;
  
  // 1. Acquire Distributed Lock (valid for 5000ms to prevent deadlocks)
  let lock;
  try {
    lock = await redlock.acquire([lockKey], 5000);
  } catch (err) {
    return { success: false, message: 'System busy, please try again.' };
  }

  const connection = await pool.getConnection();
  
  try {
    // 2. Start SQL Transaction
    await connection.beginTransaction();

    // 3. Select with FOR UPDATE (Database-level lock)
    const [classRows] = await connection.execute<RowDataPacket[]>(
      `SELECT date, location, spots, token_cost FROM classes WHERE id = ? FOR UPDATE`,
      [classId]
    );

    if (classRows.length === 0) throw new Error('Class not found');

    const classInfo = classRows[0];
    const tokenCost = Number(classInfo.token_cost) || 1;

    // Check if the user already has a confirmed booking
    
    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM bookings WHERE class_id = ? AND user_id = ? AND status = 'confirmed' FOR UPDATE`,
      [classId, userId]
    );

    let result: BookingResult;

    if (existing.length > 0) {
    
      // --- LOGIC: CANCEL BOOKING ---
      await connection.execute(
        `UPDATE bookings SET status = 'cancelled' WHERE class_id = ? AND user_id = ? AND status = 'confirmed'`,
        [classId, userId]
      );
      await connection.execute(`UPDATE classes SET spots = spots + 1 WHERE id = ?`, [classId]);

      // Refund tokens to user account
      await connection.execute(
        `UPDATE accounts SET token_remain = token_remain + ? WHERE email = ?`,
        [tokenCost, userId]
      );

      // Get updated balance for the transaction log
      const [balanceRows] = await connection.execute<RowDataPacket[]>(
        `SELECT token_remain FROM accounts WHERE email = ?`,
        [userId]
      );
      const balanceAfterCancel = balanceRows.length > 0 ? Number(balanceRows[0].token_remain) : 0;

      // Log the cancellation
      await connection.execute(
        `INSERT INTO transactions_log (user_id, class_id, action, token_amount, token_balance_after)
         VALUES (?, ?, 'cancel', ?, ?)`,
        [userId, classId, -tokenCost, balanceAfterCancel]
      );

      result = { success: true, message: `Booking cancelled (+${tokenCost} token${tokenCost !== 1 ? 's' : ''} refunded)`, isBooked: false };
    } else {
    
      // --- LOGIC: NEW BOOKING ---
      if (classInfo.spots <= 0) {
        throw new Error('No spots available');
      }

      // Check user token balance (lock row for atomic update)
      const [accountRows] = await connection.execute<RowDataPacket[]>(
        `SELECT token_remain FROM accounts WHERE email = ? FOR UPDATE`,
        [userId]
      );

      if (accountRows.length === 0) {
        throw new Error('Account not found. Please contact support.');
      }

      const currentTokens = Number(accountRows[0].token_remain) || 0;

      if (currentTokens < tokenCost) {
        throw new Error(`Insufficient tokens. This class costs ${tokenCost} token${tokenCost !== 1 ? 's' : ''}, but you only have ${currentTokens}.`);
      }

      // Create booking
      await connection.execute(
        `INSERT INTO bookings (class_id, user_id, status) VALUES (?, ?, 'confirmed')
         ON DUPLICATE KEY UPDATE status = 'confirmed', booked_at = CURRENT_TIMESTAMP`,
        [classId, userId]
      );
      await connection.execute(`UPDATE classes SET spots = spots - 1 WHERE id = ?`, [classId]);

      // Deduct tokens from user account
      await connection.execute(
        `UPDATE accounts SET token_remain = token_remain - ? WHERE email = ?`,
        [tokenCost, userId]
      );

      const newBalance = currentTokens - tokenCost;

      // Log the booking transaction
      await connection.execute(
        `INSERT INTO transactions_log (user_id, class_id, action, token_amount, token_balance_after)
         VALUES (?, ?, 'book', ?, ?)`,
        [userId, classId, tokenCost, newBalance]
      );

      result = { success: true, message: `Class booked successfully (-${tokenCost} token${tokenCost !== 1 ? 's' : ''})`, isBooked: true };
    }


    // 4. Commit SQL changes
    await connection.commit();

    // 5. Invalidate Cache
    // Ensure date formatting matches your getCacheKey helper
    const dateObj = new Date(classInfo.date);
    const formattedDate = dateObj.toLocaleDateString('sv-SE'); // Result: YYYY-MM-DD
    const cacheKey = getCacheKey(formattedDate, classInfo.location);
    
    await redis.del(cacheKey);

    return result;


  } catch (error: any) {
    await connection.rollback();
    return { success: false, message: error.message || 'Operation failed' };
  } finally {
    // 6. Release SQL Connection back to pool
    connection.release();
    
    // 7. Release Redis Lock so others can proceed
    try {
      await lock.release();
    } catch (e) {
      // Lock might have expired already, safe to ignore
    }
  }
}





// Debug
export async function debugRedisCache(date: Date, location: string) {
  try {
    const formattedDate = date.toISOString().split('T')[0];
    const cacheKey = `classes:${location}:${formattedDate}`;
    
    // 讀取快取內容
    const data = await redis.get(cacheKey);
    
    if (data) {
      console.log(`--- Redis Content for ${cacheKey} ---`);
      console.log(JSON.parse(data)); // 印出解析後的 JSON
      console.log(`--- End of Content ---`);
    } else {
      console.log(`No cache found for key: ${cacheKey}`);
    }
  } catch (error) {
    console.error("Error reading Redis:", error);
  }
}




