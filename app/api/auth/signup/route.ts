import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, email, memberLevel } = body

    // Validate required fields
    if (!username || !password || !email) {
      return NextResponse.json(
        { error: 'Username, password, and email are required' },
        { status: 400 }
      )
    }

    // Validate member level
    const level = parseInt(memberLevel) || 1
    if (level < 1 || level > 5) {
      return NextResponse.json(
        { error: 'Member level must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM accounts WHERE username = ? OR email = ?',
      [username, email]
    )

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new account
    const startDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const currentActive = true

    const [result] = await pool.execute(
      `INSERT INTO accounts (username, password, email, start_date, status, member_level) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, email, startDate, currentActive, level]
    )

    return NextResponse.json(
      { 
        message: 'Account created successfully',
        accountId: (result as { insertId: number }).insertId 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
