// 
//                   ┌──────────────────────┐
//                   │   auth.config.js     │ Base configurations, middleware rules
//                   └──────────┬───────────┘
//   
//                            │ (Extended by)
//                              ▼
// ┌────────────────┐ 🧩 ┌──────────────┐ 💾 ┌──────────────┐
// │ CLIENT SCREENS │ ◄─►│   auth.js    │ ◄─►│  src/lib/db  │ MySQL Connection Pool
// └───────┬────────┘    └──────────────┘    └──────────────┘
//         │                    ▲
//         │ (useSession)       │ (Server Action invokes auth())
//         ▼                    ▼
// ┌────────────────┐    ┌──────────────┐
// │ profile-screen │    │  account.ts  │ Server Action queries profile info
// └────────────────┘    └──────────────┘
// 

import NextAuth from 'next-auth'
import crypto from "crypto" 
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { authConfig } from './auth.config'


export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers, // Include the OAuth providers from config
    Credentials({
      name: 'credentials',
      authorize: async (credentials) => {
        const username = (credentials?.username as string | undefined)?.trim()
        const password = credentials?.password as string | undefined
        if (!username || !password) return null

        // 1. [DEMO CHECK]
        const expectedUser = process.env.AUTH_DEMO_USERNAME ?? (process.env.NODE_ENV !== 'production' ? 'demo' : '')
        const expectedPass = process.env.AUTH_DEMO_PASSWORD ?? (process.env.NODE_ENV !== 'production' ? 'demo' : '')

        if (expectedUser && expectedPass && username === expectedUser && password === expectedPass) {
          return { id: 'local-user', name: username, email: `${username}@users.local` }
        }
        
        // 2. [DB CHECK]
        try {
          const [rows]: any = await pool.execute(
            'SELECT member_id, username, email, password FROM accounts WHERE email = ? LIMIT 1',
            [username]
          )
          console.log('🔐 Username' , username )
          console.log('🔐 Password' ,)
          console.log('🔐 --- Database Query Result ---')
          console.log('🔐 Raw rows from DB:', JSON.stringify(rows, null, 2)) 
          
          const user = rows[0] 

          if (user && user.password) {
            const isPasswordCorrect = await bcrypt.compare(password, user.password)
            if (isPasswordCorrect) {
              return { id: user.member_id.toString(), name: user.username, email: user.email }
            }
          }
        } catch (error) {
          console.error('❌ Login Database Error:', error)
          return null
        }
        return null
      },
    }),  
  ],


  //----
// 🔥 ADDED EVENTS LAYER: Captures all verified logins automatically
// If the user does not exist in your MySQL accounts database yet, 
// it automatically writes a fresh record row.
  
  events: {
    async signIn({ user }) {
      if (!user?.email) return

      try {
        // 1. Find the accurate member ID matching the authenticated email string
        const [rows]: any = await pool.execute(
          "SELECT member_id FROM accounts WHERE email = ? LIMIT 1",
          [user.email]
        )

        if (rows.length > 0) {
          const memberId = rows[0].member_id

          // 2. Log the event in your transactions tracking table
          await pool.execute(
            `INSERT INTO transactions_log 
              (member_id, action, class_id, token_amount, token_balance_after, created_at)
             VALUES (?, 'login', NULL, NULL, NULL, NOW())`,
            [memberId]
          )
          console.log(`🔐 System Login transaction registered for member ID: ${memberId}`)
        }
      } catch (error) {
        console.error("❌ Failed to commit login event to database:", error)
      }
    }
  },


  //---
  // signIn({ user, account }): Intercepts social network accounts 
  // (like Google or GitHub OAuth). If the user does not exist in your 
  // MySQL accounts database yet, it automatically writes a fresh record row.
  
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {

      // 1. Only process OAuth providers (Google, GitHub, etc.)
      if (account && account.provider !== 'credentials' && user.email) {
        try {
          const username = user.name || user.email.split('@')[0];
          const email = user.email;
          const provider = account.provider;
          const startDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
          const currentActive = true
          const level = 1

          console.log('account.provider', provider)

          // 2. Check if user already exists
          const [rows]: any = await pool.execute(
            'SELECT member_id FROM accounts WHERE email = ? LIMIT 1',
            [email]
          );

          // 3. If user doesn't exist, insert them directly into MySQL
          if (rows.length === 0) {
            console.log(`Creating new OAuth account for: ${email}`);
            await pool.execute(
              `INSERT INTO accounts (username, email, start_date, status, member_level,oauth_provider ) 
              VALUES (?, ?, ?, ?, ?, ?)`,
              [username, email, startDate, currentActive, level, provider ]  

            );
          } else {
            console.log(`OAuth user already exists: ${email}`);
            // Optional: Update the last_login timestamp here if you have that column
          }
          // == ELM == Add transactions_log record
          // 

        } catch (error) {
          // Log the error but don't block the user from logging in
          console.error('Failed to sync OAuth user to database:', error);
        }
      }
      return true; // Return true to allow the user to sign in
    },

    // =======
    // Executes whenever an encrypted JSON Web Token session cookie is generated. 
    // It hashes the user's email with SHA-256 and compares it against 
    // your process.env.ADMIN_EMAIL_HASH list to attach a secure token.isAdmin = true flag.

    
    async jwt({ token, user }) {
      // Check the user email during initial token initialization or login refresh cycles
      const emailToCheck = user?.email || token?.email;

      if (emailToCheck) {
        const hashedUserEmail = crypto
          .createHash("sha256")
          .update(emailToCheck.trim().toLowerCase())
          .digest("hex");

        const envAdminHashesString = process.env.ADMIN_EMAIL_HASH || "";
        const approvedAdminHashes = envAdminHashesString
          .split(",")
          .map(hash => hash.trim());

        // Lock the evaluation directly into the secure session token layout
        token.isAdmin = approvedAdminHashes.includes(hashedUserEmail);
      } else {
        token.isAdmin = false;
      }
      return token;
    },


    // =========
    // Transports the backend token flag state parameters over onto the 
    // frontend session.user.isAdmin layer so client pages can read user role clearances.
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin === true;
      } else {
        session.user.isAdmin = false;
      }
      return session;
    },
  }
})



declare module "next-auth" {
  interface Session {
    user: {
      isAdmin: boolean
    } & DefaultSession["user"]
  }
}


declare module "next-auth/jwt" {
  interface JWT {
    isAdmin: boolean
  }
}
