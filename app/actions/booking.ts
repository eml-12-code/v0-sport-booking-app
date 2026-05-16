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

// Helper to generate consistent cache keys
const getCacheKey = (date: string, location: string) => `classes:${location}:${date}`

// Get classes for a specific date and location with Redis Cache-Aside
export async function getClasses(date: Date , location: string): Promise<ClassItem[]> {


  try {
    
    console.log("📥 [getClasses INPUT] Raw date passed to function:", date, "Type of date:", typeof date);
    const formattedDate = date.toISOString().split('T')[0]
    console.log("formatedDate:",formattedDate)

    console.log("📥 [getClasses INPUT] Processing SQL search for date:", formattedDate);
    const cacheKey = getCacheKey(formattedDate, location);
    console.log("📥 cacheKey :", cacheKey);
    
    // 1. Try to get data from Redis
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {

      console.log('Redis Cache Hit for:', cacheKey)
      console.table(JSON.parse(cachedData));
      return JSON.parse(cachedData)
    }

    // 2. If not in Redis, fetch from MySQL
    console.log('Redis Cache Miss. Fetching from MySQL...')
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT class_id AS classId, DATE_FORMAT(time, '%l:%i %p') as time, name, room, instructor, duration, spots, color 
       FROM classes 
       WHERE date = ? AND location = ?
       ORDER BY time`,
      [formattedDate, location]
    )
    console.log(`💾 Data saved to Redis cache: ${cacheKey}`)
    console.table(rows);

    const classes = rows as ClassItem[]

    // 3. Store in Redis for 1 hour (3600 seconds) if data exists
    if (classes.length > 0) {
      await redis.set(cacheKey, JSON.stringify(classes), 'EX', 3600)
      // console.log(`💾 Data saved to Redis cache: ${cacheKey}`)
    }

    return classes

  } catch (error) {
    console.error('Error fetching classes:', error)
    return []
  }
}


// Get user's booked classes
export async function getBookedClasses(
    memberId: number
): Promise<BookedClassItem[]> {

  if (!memberId || memberId === 0) {
    return []
  }
  
  try {
    console.log( "Search booking " , memberId )
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        b.booking_id AS bookingId, 
        b.class_id AS classId, 
        c.name AS className, 
        DATE_FORMAT(c.time, '%l:%i %p') AS time, 
        c.room, 
        c.instructor, 
        c.date, 
        c.location,
        c.spots
       FROM bookings b
       JOIN classes c ON b.class_id = c.class_id
       WHERE b.member_id = ? AND b.booking_status = 'confirmed'
       ORDER BY c.date ASC, c.time ASC`,
      [memberId]
    )

    console.log("Total Bookings Found:", rows.length , " for Member ID " , memberId);
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
    console.error('Error fetching booked classes:', error)
    return []
  }
}


// Toggle booking for a class and invalidate relevant cache


export async function toggleBooking(classId: string,  memberId: number ): Promise<BookingResult> {

  console.log("Inside toggleBooking >" , memberId , "---" , classId )

  // Guard block against empty records
  if (!memberId || memberId === 0) {
    return { success: false, message: 'Please log in to complete your booking.' }
  }

  const lockKey = `locks:class:${classId}`;

  console.log ( "toggleBooking -> ", lockKey )
  
  // 1. Acquire Distributed Lock (valid for 5000ms to prevent deadlocks)
  let lock;
  try {
    lock = await redlock.acquire([lockKey], 5000);

    console.log ("Row Lock ", classId )   

  } catch (err) {
    return { success: false, message: 'System busy, please try again.' };
  }

  const connection = await pool.getConnection();
  
  try {

    console.log (" Start SQL Transaction ");
    console.log (" Class ID " , classId );
    
    // Start SQL Transaction
    await connection.beginTransaction();

    console.log (" After Transaction ");

    // 1. Fetch target class information

    const [classRows] = await connection.execute<RowDataPacket[]>(
      `SELECT date, location, spots, token_cost FROM classes WHERE class_id = ? FOR UPDATE`,
      [classId]
    );

    console.log (" Select FROM classes ");
    console.table(classRows);

    if (classRows.length === 0) throw new Error('Class not found');

    const classInfo = classRows[0];
    const tokenCost = Number(classInfo.token_cost) || 1;
    const formattedDate = new Date(classInfo.date).toISOString().split('T')[0];

    // 2. Check if user already booked this class
    
    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT booking_id FROM bookings WHERE class_id = ? AND member_id = ? AND booking_status = 'confirmed' FOR UPDATE`,
      [classId, memberId]
    );

    console.log (" Select FROM bookings ");
    console.table(existing);

    let result: BookingResult;

    if (existing.length > 0) {
    
      // --- LOGIC: CANCEL BOOKING ---
      await connection.execute(
        `UPDATE bookings SET booking_status = 'cancelled' WHERE class_id = ? AND member_id = ? AND booking_status = 'confirmed'`,
        [classId, memberId]
      );
      await connection.execute(`UPDATE classes SET spots = spots + 1 WHERE class_id = ?`, [classId]);

      console.log ( "Before Refund ")

      // Refund tokens to user account
      await connection.execute(
        `UPDATE accounts SET token_remain = token_remain + ? WHERE member_id = ?`,
        [tokenCost, memberId]
      );

      // Get updated balance for the transaction log
      const [balanceRows] = await connection.execute<RowDataPacket[]>(
        `SELECT token_remain FROM accounts WHERE member_id = ?`,
        [memberId]
      );

      const balanceAfterCancel = balanceRows.length > 0 ? Number(balanceRows[0].token_remain) : 0;

      // Log the cancellation
      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, action, token_amount, token_balance_after)
         VALUES (?, ?, 'cancel', ?, ?)`,
        [memberId, classId, -tokenCost, balanceAfterCancel]
      );

      result = { success: true, message: `Booking cancelled (+${tokenCost} token${tokenCost !== 1 ? 's' : ''} refunded)`, isBooked: false };
    } else {

      console.log ( "classInfo : ", classInfo.spots)
    
      // --- LOGIC: NEW BOOKING ---
      if (classInfo.spots <= 0) {
        throw new Error('No spots available');
      }

      // Check user token balance (lock row for atomic update)
      const [accountRows] = await connection.execute<RowDataPacket[]>(
        `SELECT token_remain FROM accounts WHERE member_id = ? FOR UPDATE`,
        [memberId]
      );

      console.log ( "ACCOUNTS Info >" , memberId , "<")
      console.table(accountRows)

      if (accountRows.length === 0) {
        throw new Error('Account not found. Please contact support.');
      }

      const currentTokens = Number(accountRows[0].token_remain) || 0;

      if (currentTokens < tokenCost) {
        throw new Error(`Insufficient tokens. This class costs ${tokenCost} token${tokenCost !== 1 ? 's' : ''}, but you only have ${currentTokens}.`);
      }

      //  Write active booking record

      await connection.execute(
        `INSERT INTO bookings (class_id, member_id, booking_status) VALUES (?, ?, 'confirmed')
         ON DUPLICATE KEY UPDATE booking_status = 'confirmed', booked_at = CURRENT_TIMESTAMP`,
        [classId, memberId]
      );
      
      await connection.execute(`UPDATE classes SET spots = spots - 1 WHERE class_id = ?`, [classId]);

      // Deduct tokens from user account
      await connection.execute(
        `UPDATE accounts SET token_remain = token_remain - ? WHERE member_id = ?`,
        [tokenCost, memberId]
      );

      const balanceAfterBook = currentTokens - tokenCost;

      // Log the booking transaction
      await connection.execute(
        `INSERT INTO transactions_log (member_id, class_id, action, token_amount, token_balance_after)
         VALUES (?, ?, 'book', ?, ?)`,
        [memberId, classId, -tokenCost, balanceAfterBook]
      );

      result = { success: true, message: `Class booked successfully (-${tokenCost} token${tokenCost !== 1 ? 's' : ''})`, isBooked: true };
    }

    await connection.commit();

    // 3. Clear Redis Cache for that specific day and location

    const cacheKey = getCacheKey(formattedDate, classInfo.location);
    
    await redis.del(cacheKey);
    
    console.log(`🧹 Cache invalidated for key: ${cacheKey}`);

    return result;


  } catch (error: any) {
    await connection.rollback();
    console.error('Booking Transaction Failed:', error);
    return { success: false, message: error.message || 'Operation failed' };
  } finally {

    // Release SQL Connection back to pool
    connection.release();
  
    if (lock) {
      await lock.release().catch((err) => console.error("Lock release error:", err));
    }
    
  }
}





// Debug
export async function debugRedisCache(date: Date, location: string) {
  try {
    const formattedDate = date.toISOString().split('T')[0];
    const cacheKey = `classes:${location}:${formattedDate}`;
    
    // 
    const data = await redis.get(cacheKey);
    
    if (data) {
      console.log(`--- Redis Content for ${cacheKey} ---`);
      console.log(JSON.parse(data)); // print JSON
      console.log(`--- End of Content ---`);
    } else {
      console.log(`No cache found for key: ${cacheKey}`);
    }
  } catch (error) {
    console.error("Error reading Redis:", error);
  }
}




