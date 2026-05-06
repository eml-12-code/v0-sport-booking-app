import NextAuth from 'next-auth'
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
            'SELECT user_id, username, email, password FROM accounts WHERE email = ? LIMIT 1',
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
              return { id: user.user_id.toString(), name: user.username, email: user.email }
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
            'SELECT user_id FROM accounts WHERE email = ? LIMIT 1',
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
        } catch (error) {
          // Log the error but don't block the user from logging in
          console.error('Failed to sync OAuth user to database:', error);
        }
      }
      return true; // Return true to allow the user to sign in
    },
  }



})
