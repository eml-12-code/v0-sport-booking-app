'use server'

import { signOut, auth } from "@/auth"
import pool from "@/lib/db"

/**
 * Logs a cookie-resumed session if the user hasn't logged in within the last 1 hour
 */
export async function logCookieSessionIfValid() {
  const session = await auth()
  if (!session?.user?.email) return { success: false }

  try {
    // 1. Fetch user member_id matching session email
    const [memberRows]: any = await pool.execute(
      "SELECT member_id FROM accounts WHERE email = ? LIMIT 1",
      [session.user.email]
    )
    if (!memberRows.length) return { success: false }
    const memberId = memberRows[0].member_id

    // 2. Cooldown check: Has a login been tracked in the last 1 hour?
    const [recentLogs]: any = await pool.execute(
      `SELECT created_at FROM transactions_log 
       WHERE member_id = ? AND action = 'login' 
         AND created_at >= NOW() - INTERVAL 1 MINUTE 
       LIMIT 1`,
      [memberId]
    )

    // 3. Log cookie resume entry if the cooldown window is clear
    if (recentLogs.length === 0) {
      await pool.execute(
        `INSERT INTO transactions_log 
          (member_id, action, class_id, name, token_amount, token_balance_after, created_at)
         VALUES (?, 'login', NULL, NULL, NULL, NULL, NOW())`,
        [memberId]
      )
      console.log(`🍪 Cookie session tracking logged successfully for member: ${memberId}`)
      return { success: true }
    }

    return { success: true, message: "Within cooldown window" }
  } catch (error) {
    console.error("❌ Cookie logger action error:", error)
    return { success: false }
  }
}

/**
 * Logs a logout event in the database and terminates the active user session
 */
export async function handleUserLogout() {
  const session = await auth()

  if (session?.user?.email) {
    try {
      // 1. Find member_id
      const [rows]: any = await pool.execute(
        "SELECT member_id FROM accounts WHERE email = ? LIMIT 1",
        [session.user.email]
      )

      if (rows.length > 0) {
        const memberId = rows[0].member_id

        // 2. Insert logout log record matching your explicit schema setup
        await pool.execute(
          `INSERT INTO transactions_log 
            (member_id, action, class_id, name, token_amount, token_balance_after, created_at)
           VALUES (?, 'logout', NULL, NULL, NULL, NULL, NOW())`,
          [memberId]
        )
        console.log(`🔓 Logout logged in DB for member: ${memberId}`)
      }
    } catch (error) {
      console.error("❌ Failed to log sign-out event:", error)
    }
  }

  // 3. Complete actual NextAuth authentication teardown session erasure
  await signOut({ redirectTo: "/" })
}



