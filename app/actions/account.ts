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
