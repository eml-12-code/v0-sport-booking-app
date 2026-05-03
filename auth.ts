import NextAuth from 'next-auth'
import Apple from 'next-auth/providers/apple'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { NextResponse } from 'next/server'

import type { NextAuthConfig } from 'next-auth'

const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'credentials',
    credentials: {
      username: { label: 'Username', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: async (credentials) => {
      const username = (credentials?.username as string | undefined)?.trim()
      const password = credentials?.password as string | undefined
      if (!username || !password) return null

      const expectedUser =
        process.env.AUTH_DEMO_USERNAME ??
        (process.env.NODE_ENV !== 'production' ? 'demo' : '')
      const expectedPass =
        process.env.AUTH_DEMO_PASSWORD ??
        (process.env.NODE_ENV !== 'production' ? 'demo' : '')

      if (!expectedUser || !expectedPass) return null

      if (username === expectedUser && password === expectedPass) {
        return {
          id: 'local-user',
          name: username,
          email: `${username}@users.local`,
        }
      }
      return null
    },
  }),
]

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  )
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  )
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user
      const onLogin = nextUrl.pathname.startsWith('/login')

      if (onLogin) {
        if (loggedIn) {
          return NextResponse.redirect(new URL('/', nextUrl))
        }
        return true
      }

      return loggedIn
    },
  },
})
