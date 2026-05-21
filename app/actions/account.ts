'use server'

import pool from '@/lib/db'
import { auth } from '@/auth'
import { RowDataPacket } from 'mysql2'

export interface AccountProfile {
  memberId: number
  username: string
  email: string
  tokenRemain: number
  expiryDate: string | null
  memberLevel: number
  startDate: string
}


// ======

export interface TransactionLogItem {
  logId: string
  action: 'book' | 'cancel' | 'topup' | 'expire' | 'refund' | 'login' | 'logout'
  className: string | null
  tokenAmount: number | null
  tokenBalanceAfter: number | null
  createdAt: string
}


export async function getMemberLogs(): Promise<TransactionLogItem[]> {

  const session = await auth()
  if (!session?.user?.email) return []

  try {

    // 1. Fetch member_id from email securely
    const [memberRows]: any = await pool.execute(
      'SELECT member_id FROM accounts WHERE email = ? LIMIT 1',
      [session.user.email]
    )
    if (!memberRows.length) return []
    const memberId = memberRows[0].member_id



    // 2. Fetch transaction logs combined with class names if applicable
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        tl.action,
        tl.token_amount as tokenAmount,
        tl.token_balance_after as tokenBalanceAfter,
        CONVERT_TZ(tl.created_at, @@session.time_zone, '+08:00') as createdAt,
        c.name as className
       FROM transactions_log tl
       LEFT JOIN classes c ON tl.class_id = c.class_id
       WHERE tl.member_id = ?
       ORDER BY tl.created_at DESC 
       LIMIT 50`,
      [memberId]
    )

    // 3. Map rows safely, providing a fallback index string as a React loop key

    return rows.map((row, index) => ({

        logId: `log-${index}-${row.createdAt}`, 
        action: String(row.action),
        className: row.className,
        tokenAmount: row.tokenAmount !== null ? Number(row.tokenAmount) : null,
        tokenBalanceAfter: row.tokenBalanceAfter !== null ? Number(row.tokenBalanceAfter) : null,
        createdAt: new Date(row.createdAt).toISOString(),

    }))
  } catch (error) {
    console.error('Failed to fetch user transaction logs:', error)
    return []
  }
}


// -------

export async function getAccountProfile(): Promise<AccountProfile | null> {
  const session = await auth()

  if (!session?.user?.email) return null

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT member_id, username, email, token_remain, expiry_date, member_level, start_date
     FROM accounts WHERE email = ? LIMIT 1`,
    [session.user.email]
  )

  if (!rows.length) return null

  const row = rows[0]
  
  return {
    memberId: row.member_id,
    username: row.username,
    email: row.email,
    tokenRemain: Number(row.token_remain),
    expiryDate: row.expiry_date
      ? new Date(row.expiry_date).toISOString().split('T')[0]
      : null,
    memberLevel: row.member_level,
    startDate: new Date(row.start_date).toISOString().split('T')[0],
  }
}


export async function logTransaction(
  memberId: number,
  action: 'book' | 'cancel' | 'topup' | 'expire' | 'refund',
  tokenAmount: number,
  tokenBalanceAfter: number,
  classId: string | null = null
): Promise<boolean> {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO transactions_log 
        (member_id, class_id, action, token_amount, token_balance_after, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [memberId, classId, action, tokenAmount, tokenBalanceAfter]
    );

    // Returns true if a row was successfully added
    return result.affectedRows > 0;
  } catch (error) {
    console.error('❌ Failed to write record to transactions_log:', error);
    return false;
  }
}
