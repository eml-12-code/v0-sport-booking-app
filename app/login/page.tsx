import type { Metadata } from 'next'
import { Suspense } from 'react'

import { LoginForm, type LoginOAuthFlags } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign in · FitBook',
  description: 'Sign in to FitBook with your account or a connected provider.',
}

function oauthFlags(): LoginOAuthFlags {
  return {
    google: !!(
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ),
    github: !!(
      process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ),
  }
}

function LoginFormFallback() {
  return (
    <div className="h-[420px] w-full max-w-md animate-pulse rounded-xl border bg-muted/40" />
  )
}

export default function LoginPage() {
  const oauth = oauthFlags()

  return (
    <div className="min-h-screen bg-background">
      <div className="h-12" aria-hidden />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col items-center justify-center px-4 pb-16 pt-6">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm oauth={oauth} />
        </Suspense>
      </div>
    </div>
  )
}
