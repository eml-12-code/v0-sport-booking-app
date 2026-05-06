import { NextResponse } from 'next/server'
import crypto from 'crypto'
import pool from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Hash the password with MD5 to compare against stored hash
    const md5Password = crypto.createHash('md5').update(password).digest('hex')

    // Look up user by email and password
    const [rows] = await pool.execute(
      'SELECT user_id, username, email, active FROM accounts WHERE email = ? AND password = ?',
      [email, md5Password]
    )

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = rows[0] as {
      user_id: number
      username: string
      email: string
      active: string
    }

    // Check if account is active
    if (user.active === 'cancel') {
      return NextResponse.json(
        { error: 'This account has been deactivated' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: String(user.user_id),
      name: user.username,
      email: user.email,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    )
  }
}
