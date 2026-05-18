import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from 'next-auth/providers/apple'
import GitHub from 'next-auth/providers/github'

export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  trustHost: true,
  providers: [
    // OAuth providers are generally Edge-compatible
    Google({ 
      clientId: process.env.AUTH_GOOGLE_ID, 
      clientSecret: process.env.AUTH_GOOGLE_SECRET, 
        authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET }),
    Apple({ clientId: process.env.AUTH_APPLE_ID, clientSecret: process.env.AUTH_APPLE_SECRET }),
  ], 
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const onLogin = nextUrl.pathname.startsWith('/login');
      if (onLogin) {
        if (loggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }
      return loggedIn;
    },
  },
} satisfies NextAuthConfig;
