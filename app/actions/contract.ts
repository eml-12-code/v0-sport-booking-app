'use server'

import pool from '@/lib/db'
import { auth } from '@/auth'
import { RowDataPacket } from 'mysql2'

export interface Contract {
  id: number
  memberId: number
  contractStatus: 'active' | 'expired' | 'canceled'
  reminderToken: number
  startDate: string
  expiryDate: string
}

export async function getMemberContracts(): Promise<Contract[]> {
  const session = await auth()
  if (!session?.user?.email) return []

  console.log("getMemberContracts") 
  console.log( session.user.email ) 

  // Get member_id from accounts by email
  const [accountRows] = await pool.execute<RowDataPacket[]>(
    'SELECT member_id FROM accounts WHERE email = ? LIMIT 1',
    [session.user.email]
  )
  if (!accountRows.length) return []

  const memberId = accountRows[0].member_id

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT contract_id, member_id, contract_status, reminder_token, start_date, expiry_date
     FROM contracts WHERE member_id = ? ORDER BY start_date DESC`,
    [memberId]
  )
  console.log("Exit->getMemberContracts") 

  return rows.map((row) => ({
    id: row.id,
    memberId: row.member_id,
    contractStatus: row.contract_status,
    reminderToken: Number(row.reminder_token),
    startDate: new Date(row.start_date).toISOString().split('T')[0],
    expiryDate: new Date(row.expiry_date).toISOString().split('T')[0],
  }))
}
