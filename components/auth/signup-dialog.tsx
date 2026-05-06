'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignupDialog({ open, onOpenChange }: SignupDialogProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [memberLevel, setMemberLevel] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setMemberLevel('1')
    setError(null)
    setSuccess(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          memberLevel: parseInt(memberLevel),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        handleOpenChange(false)
      }, 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Create Account
          </DialogTitle>
          <DialogDescription className="text-center">
            Fill in your details to create a new account
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-neutral-900">
              Account Created!
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              You can now sign in with your credentials
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4 pt-2">
            <div className="space-y-1.5">
              <label
                htmlFor="signup-username"
                className="block text-sm font-medium text-neutral-700"
              >
                Username
              </label>
              <Input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-neutral-700"
              >
                Email Address
              </label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-neutral-700"
              >
                Password
              </label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirm-password"
                className="block text-sm font-medium text-neutral-700"
              >
                Confirm Password
              </label>
              <Input
                id="signup-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="signup-member-level"
                className="block text-sm font-medium text-neutral-700"
              >
                Member Level
              </label>
              <Select
                value={memberLevel}
                onValueChange={setMemberLevel}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select member level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 - Basic</SelectItem>
                  <SelectItem value="2">Level 2 - Standard</SelectItem>
                  <SelectItem value="3">Level 3 - Premium</SelectItem>
                  <SelectItem value="4">Level 4 - Gold</SelectItem>
                  <SelectItem value="5">Level 5 - Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-center text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-medium text-white transition-colors',
                'bg-neutral-900 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
