'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Apple, Github, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export type LoginOAuthFlags = {
  google: boolean
  github: boolean
  apple: boolean
}

type OAuthId = 'google' | 'github' | 'apple'

export function LoginForm({ oauth }: { oauth: LoginOAuthFlags }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState<
    'credentials' | OAuthId | null
  >(null)
  const [error, setError] = useState<string | null>(null)

  const anyOAuth = oauth.google || oauth.github || oauth.apple

  async function onCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading('credentials')
    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
        callbackUrl,
      })
      if (res?.error) {
        setError('Invalid email or password.')
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function onOAuth(provider: OAuthId) {
    setError(null)
    if (!oauth[provider]) {
      setError(`"${provider}" sign-in is not configured yet.`)
      return
    }
    setLoading(provider)
    try {
      await signIn(provider, { callbackUrl })
    } finally {
      setLoading(null)
    }
  }

  const busy = loading !== null

  return (
    <div className="flex w-full max-w-sm flex-col items-center px-4">
      <header className="mb-10 w-full space-y-2 text-center">
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">
          Welcome to FitBook
        </h1>
        <p className="text-[15px] text-neutral-500">
          Book classes and manage your membership
        </p>
      </header>

      <div className="flex w-full flex-col gap-3">
        <OAuthRow
          label="Continue with Google"
          icon={<GoogleGlyph />}
          disabled={busy}
          title={
            oauth.google
              ? undefined
              : 'Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to enable Google sign-in'
          }
          onClick={() => onOAuth('google')}
          loading={loading === 'google'}
        />
        <OAuthRow
          label="Continue with GitHub"
          icon={<Github className="size-[22px] shrink-0 text-neutral-900" aria-hidden />}
          disabled={busy}
          title={
            oauth.github
              ? undefined
              : 'Add AUTH_GITHUB_ID and AUTH_GITHUB_SECRET to enable GitHub sign-in'
          }
          onClick={() => onOAuth('github')}
          loading={loading === 'github'}
        />
        <OAuthRow
          label="Continue with Apple"
          icon={<Apple className="size-[22px] shrink-0 text-neutral-900" aria-hidden />}
          disabled={busy}
          title={
            oauth.apple
              ? undefined
              : 'Add AUTH_APPLE_ID and AUTH_APPLE_SECRET to enable Apple sign-in'
          }
          onClick={() => onOAuth('apple')}
          loading={loading === 'apple'}
        />
      </div>

      {!anyOAuth ? (
        <p className="mt-4 max-w-sm text-center text-xs leading-relaxed text-neutral-600">
          Configure OAuth client IDs in{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-[0.65rem] text-neutral-600">
            .env.local
          </code>{' '}
          to enable the buttons above.
        </p>
      ) : null}

      <form
        onSubmit={onCredentialsSubmit}
        className="mt-10 flex w-full flex-col gap-5"
      >
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-left text-[13px] text-neutral-500"
          >
            Email
          </label>
          <input
            id="email"
            name="username"
            type="text"
            inputMode="email"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your email address"
            required
            className={cn(
              'h-12 w-full rounded-lg border bg-white px-3.5 text-[15px] text-neutral-900 outline-none transition-[box-shadow,border-color]',
              'border-neutral-300 placeholder:text-neutral-400',
              'focus-visible:border-[#c9a227] focus-visible:ring-2 focus-visible:ring-[#c9a227]/35',
            )}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-left text-[13px] text-neutral-500"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={cn(
              'h-12 w-full rounded-lg border bg-white px-3.5 text-[15px] text-neutral-900 outline-none transition-[box-shadow,border-color]',
              'border-neutral-300 placeholder:text-neutral-400',
              'focus-visible:border-[#c9a227] focus-visible:ring-2 focus-visible:ring-[#c9a227]/35',
            )}
          />
        </div>

        {error ? (
          <p className="text-center text-sm text-red-400/95" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-medium text-white transition-colors',
            'bg-neutral-900 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {loading === 'credentials' ? (
            <>
              <Loader2 className="size-5 animate-spin text-white" aria-hidden />
              Continuing…
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>

      <p className="mt-12 text-center text-[14px] text-neutral-500">
        Don&apos;t have an account?{' '}
        <a
          href="#"
          className="font-medium text-neutral-900 underline-offset-4 hover:text-neutral-700 hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          Sign up
        </a>
      </p>
    </div>
  )
}

function OAuthRow({
  label,
  icon,
  onClick,
  disabled,
  loading,
  title,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled: boolean
  loading: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-12 w-full items-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 text-[15px] font-medium text-neutral-900 transition-colors',
        'hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      <span className="flex size-[22px] shrink-0 items-center justify-center">
        {loading ? (
          <Loader2 className="size-5 animate-spin text-neutral-900" aria-hidden />
        ) : (
          icon
        )}
      </span>
      <span className="flex-1 text-center pr-[22px]">{label}</span>
    </button>
  )
}

function GoogleGlyph() {
  return (
    <svg className="size-[22px] shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
