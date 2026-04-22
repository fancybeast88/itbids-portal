'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta']
const BRANDS = ['Dell', 'HP', 'Fortinet', 'Cisco', 'Lenovo', 'IBM', 'Huawei', 'Aruba']

export default function AdminEditUserForm({ user }: { user: any }) {
  const router = useRouter()
  const profile = user.vendorProfile || user.businessProfile
  const isVendor = !!user.vendorProfile
  const [form, setForm] = useState({
    companyName:   profile?.companyName   || '',
    contactPerson: profile?.contactPerson || '',
    phone:         profile?.phone         || '',
    city:          profile?.city          || '',
    ntn:           profile?.ntn           || '',
    partnerLevel:  profile?.partnerLevel  || 'Authorized reseller',
    brands:        profile?.brands        || [] as string[],
    status:        user.status            || 'approved',
    role:          user.role              || '',
  })
  const [password, setPassword] = useState('')
  const [creditsToAdd, setCreditsToAdd] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  function set(field: string, val: any) { setForm(f => ({ ...f, [field]: val })) }

  function toggleBrand(b: string) {
    setForm(f => ({
      ...f,
      brands: f.brands.includes(b) ? f.brands.filter((x: string) => x !== b) : [...f.brands, b],
    }))
  }

  async function save() {
    setLoading(true); setError(''); setSuccess('')
    const body: any = { ...form }
    if (password) body.password = password
    if (creditsToAdd !== 0) body.creditsToAdd = creditsToAdd
    const res = await fetch(`/api/admin/users/${user.id}/edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (res.ok) {
      setSuccess('User updated successfully')
      setPassword('')
      setCreditsToAdd(0)
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to update user')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
            {profile?.companyName?.slice(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <div className="font-medium text-gray-800">{profile?.companyName}</div>
            <div className="text-xs text-gray-400">{user.email} · {user.role}</div>
          </div>
          <div className="ml-auto text-right">
              <div className="text-xs text-gray-400">Credits</div>
              <div className="text-xl font-semibold text-blue-600">{user.vendorProfile?.credits ?? user.businessProfile?.credits ?? 0}</div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="vendor">Vendor</option>
              <option value="business">Business</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Profile details</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Company name</label>
            <input value={form.companyName} onChange={e => set('companyName', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Contact person</label>
            <input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">City</label>
            <select value={form.city} onChange={e => set('city', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">NTN / CNIC</label>
            <input value={form.ntn} onChange={e => set('ntn', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          {isVendor && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Partner level</label>
              <select value={form.partnerLevel} onChange={e => set('partnerLevel', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>Authorized reseller</option>
                <option>Gold partner</option>
                <option>Platinum partner</option>
                <option>Titanium partner</option>
              </select>
            </div>
          )}
        </div>
        {isVendor && (
          <div className="mt-3">
            <label className="text-xs text-gray-400 block mb-2">Brands</label>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map(b => (
                <button key={b} type="button" onClick={() => toggleBrand(b)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${form.brands.includes(b) ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Reset password</div>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          placeholder="New password — leave blank to keep current" />
      </div>

      {isVendor && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Add / deduct credits</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Credits (negative to deduct)</label>
              <input type="number" value={creditsToAdd} onChange={e => setCreditsToAdd(+e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="pt-5 text-xs text-gray-400">
              Current: <span className="font-semibold text-gray-700">{user.vendorProfile?.credits ?? 0}</span>
              {creditsToAdd !== 0 && (
                <span className={`ml-2 font-semibold ${creditsToAdd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  → {(user.vendorProfile?.credits ?? 0) + creditsToAdd}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[10, 25, 50, 100, 250].map(n => (
              <button key={n} type="button" onClick={() => setCreditsToAdd(n)}
                className="text-xs px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg">+{n}</button>
            ))}
            {[-10, -25, -50].map(n => (
              <button key={n} type="button" onClick={() => setCreditsToAdd(n)}
                className="text-xs px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg">{n}</button>
            ))}
            <button type="button" onClick={() => setCreditsToAdd(0)}
              className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-lg">Clear</button>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
      {success && <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg">{success}</div>}

      <div className="flex gap-3 justify-end">
        <button onClick={() => router.push('/admin/users')}
          className="text-sm border border-gray-200 text-gray-500 px-5 py-2 rounded-lg">Cancel</button>
        <button onClick={save} disabled={loading}
          className="text-sm bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 font-medium">
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
