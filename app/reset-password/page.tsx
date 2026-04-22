'use client'
import Logo from '@/components/Logo'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) setDone(true)
    else setError(data.error || 'Something went wrong')
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-sm w-full text-center">
        <h2 className="text-base font-semibold text-red-700 mb-2">Invalid reset link</h2>
        <p className="text-sm text-gray-500 mb-4">This link is invalid or has already been used.</p>
        <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Request a new reset link</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-500 text-sm mt-1">Set a new password</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {done ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l5 5L19 7" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500 mb-6">Your password has been reset successfully.</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
              >
                Sign in now
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-6">Create new password</h2>
              {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">New password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Confirm new password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Re-enter password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
