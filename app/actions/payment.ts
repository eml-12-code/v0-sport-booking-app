'use server'

import pool from '@/lib/db'
import { evictUserTokenCache } from '@/lib/redis' // 🔥 Import the helper here

export async function buyTokenPackage(memberId: number, amountToBuy: number) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Update the absolute source of truth in MySQL
    await connection.execute(
      `UPDATE accounts SET token_remain = token_remain + ? WHERE member_id = ?`,
      [amountToBuy, memberId]
    );

    await connection.commit();

    // 🔥 2. IMMEDIATELY EVICT THE REDIS CACHE HERE
    // This safely clears the old balance out of Redis memory
    await evictUserTokenCache(memberId);

    return { success: true, message: 'Tokens added successfully!' };

  } catch (error) {
    await connection.rollback();
    console.error('Payment processing failed:', error);
    return { success: false, message: 'Payment failed' };
  } finally {
    connection.release();
  }
}
