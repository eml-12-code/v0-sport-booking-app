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
          console.log('Username' , username )
          console.log('Password' ,)
          console.log('--- Database Query Result ---')
          console.log('Raw rows from DB:', JSON.stringify(rows, null, 2)) 
          
          const user = rows[0] 

          if (user && user.password) {
            const isPasswordCorrect = await bcrypt.compare(password, user.password)
            if (isPasswordCorrect) {
              return { id: user.member_id.toString(), name: user.username, email: user.email }
            }
          }
        } catch (error) {
          console.error('Login Database Error:', error)
          return null
        }
        return null
      },
    }),  
  ],

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
    async session({ session, token }) {

      if (session.user) {
        // Read the verified boolean flag from the secure JWT layer
        session.user.isAdmin = token.isAdmin === true;
        
        console.log(`🔐 Admin Check: ${session.user.email} -> Allowed: ${session.user.isAdmin}`);
      } else {
        session.user.isAdmin = false;
      }

      return session;
    },

    //-----------
    

    //----------
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
