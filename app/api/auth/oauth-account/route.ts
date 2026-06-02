import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, provider } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if account already exists
    const [existingUsers] = await pool.execute(
      'SELECT member_id FROM accounts WHERE email = ?',
      [email]
    )

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      // Account already exists, just return success
      return NextResponse.json(
        { message: 'Account already exists', accountId: (existingUsers[0] as { id: number }).id },
        { status: 200 }
      )
    }

    // Create username from email or name
    const username = name || email.split('@')[0]
    const startDate = new Date().toISOString().split('T')[0]
    const currentActive = true
    const memberLevel = 1 // Default member level for OAuth users

   // --- ELM ---- 

    const [result] = await pool.execute(
      `INSERT INTO accounts (username, password, email, start_date, current_active, member_level, oauth_provider,token_remain) 
       VALUES (?, ?, ?, ?, ?, ?, ?,200)`,
      [username, null, email, startDate, currentActive, memberLevel, provider]
    )

    return NextResponse.json(
      { 
        message: 'Account created successfully',
        accountId: (result as { insertId: number }).insertId 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('OAuth account creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
