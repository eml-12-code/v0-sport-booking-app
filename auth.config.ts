// auth.config.ts

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from 'next-auth/providers/apple'
import GitHub from 'next-auth/providers/github'


export default {
  providers: [Google], // Add other OAuth providers here
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
