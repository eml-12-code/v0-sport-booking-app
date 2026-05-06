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
      // Your OAuth account creation logic remains here
      if (account && account.provider !== 'credentials' && user.email) {
        try {
          const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:3000`
          await fetch(`${baseUrl}/api/auth/oauth-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: user.name || user.email.split('@')[0],
              email: user.email,
              provider: account.provider,
            }),
          })
        } catch (error) {
          console.error('OAuth sync error:', error)
        }
      }
      return true
    },
  }
})

