import type { Metadata } from 'next'
import { Suspense } from 'react'

import { LoginForm, type LoginOAuthFlags } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign in · FitBook',
  description: 'Sign in to FitBook with your account or a connected provider.',
}

export const dynamic = 'force-dynamic'

function oauthFlags(): LoginOAuthFlags {
  
  const enabled = (id?: string, secret?: string) =>
    Boolean(id && secret)

  return {
    google: enabled(process.env.AUTH_GOOGLE_ID, process.env.AUTH_GOOGLE_SECRET),
    github: enabled(process.env.AUTH_GITHUB_ID, process.env.AUTH_GITHUB_SECRET),
    apple: enabled(process.env.AUTH_APPLE_ID, process.env.AUTH_APPLE_SECRET),
  }
}



function LoginFormFallback() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 px-4">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-neutral-200" />
      <div className="h-5 w-72 animate-pulse rounded bg-neutral-200" />
      <div className="flex w-full flex-col gap-3">
        <div className="h-12 w-full animate-pulse rounded-lg bg-neutral-200" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-neutral-200" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-neutral-200" />
      </div>
      <div className="mt-4 h-24 w-full animate-pulse rounded-lg bg-neutral-200" />
    </div>
  )
}

export default function LoginPage() {
  const oauth = oauthFlags()

  return (
    <div className="min-h-screen bg-white font-sans antialiased selection:bg-[#c9a227]/30 selection:text-neutral-900">
      <div className="h-12 shrink-0 pt-[env(safe-area-inset-top,0px)]" aria-hidden />
      <div className="mx-auto flex min-h-[calc(100vh-3rem-env(safe-area-inset-top,0px))] max-w-lg flex-col items-center justify-center px-2 pb-20 pt-6">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm oauth={oauth} />
        </Suspense>
      </div>
    </div>
  )
}
