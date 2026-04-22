'use client'
import Logo from '@/components/Logo'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (res.ok) setDone(true)
    else setError('Something went wrong. Please try again.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-500 text-sm mt-1">Reset your password</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {done ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="#0F6E56" strokeWidth="1.5"/>
                  <path d="M2 8l10 6 10-6" stroke="#0F6E56" strokeWidth="1.5"/>
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for <strong>{email}</strong>, we sent a password reset link. Check your inbox and spam folder.
              </p>
              <p className="text-xs text-gray-400">The link expires in 1 hour.</p>
              <Link href="/login" className="block mt-6 text-sm text-blue-600 hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-2">Forgot password?</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we will send you a reset link.</p>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="you@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-4">
                Remember your password?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
