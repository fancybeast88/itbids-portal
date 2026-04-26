'use client'
import { useState } from 'react'

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit() {
    setError(''); setSuccess('')
    if (!form.current || !form.newPass || !form.confirm) { setError('All fields are required'); return }
    if (form.newPass !== form.confirm) { setError('New passwords do not match'); return }
    if (form.newPass.length < 8) { setError('New password must be at least 8 characters'); return }
    if (form.current === form.newPass) { setError('New password must be different from current password'); return }

    setLoading(true)
    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPass }),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setSuccess('Password changed successfully!')
      setForm({ current: '', newPass: '', confirm: '' })
    } else {
      setError(data.error || 'Failed to change password')
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 max-w-md">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Change password</div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Current password</label>
          <input type="password" value={form.current} onChange={e => set('current', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Enter your current password" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">New password</label>
          <input type="password" value={form.newPass} onChange={e => set('newPass', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Min 8 characters" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Confirm new password</label>
          <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Re-enter new password" />
        </div>
        {error   && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        {success && <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg">{success}</div>}
        <button onClick={submit} disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {loading ? 'Changing...' : 'Change password'}
        </button>
      </div>
    </div>
  )
}
