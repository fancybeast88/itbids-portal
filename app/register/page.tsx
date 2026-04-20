'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BRANDS = ['Dell', 'HPE', 'Fortinet', 'Cisco', 'Lenovo', 'Ruijie', 'Huawei', 'Veeam', 'Kaspersky', 'TrendMicro', 'Ubiquiti', 'Others']
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'vendor' | 'business'>('vendor')
  const [form, setForm] = useState({
    companyName: '', contactPerson: '', email: '', phone: '',
    city: '', ntn: '', partnerLevel: 'Authorized reseller',
    brands: [] as string[], password: '', confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function toggleBrand(b: string) {
    setForm(f => ({
      ...f,
      brands: f.brands.includes(b) ? f.brands.filter(x => x !== b) : [...f.brands, b]
    }))
  }

  async function submit() {
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Registration failed'); return }
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-green-200 rounded-xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l5 5L19 7" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h2 className="text-lg font-semibold text-green-800 mb-2">Application submitted</h2>
        <p className="text-sm text-gray-500 mb-4">Our admin team will review and approve your account within 24 hours. You'll receive a confirmation email.</p>
        <Link href="/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg text-sm">Go to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">IT Bids Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="flex gap-2 mb-6">
            {[1,2,3].map((s: any) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s < step ? 'bg-green-500' : s === step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

          {step === 1 && (
            <div>
              <p className="text-sm font-medium mb-4">Step 1 — Account type</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(['vendor', 'business'] as const).map((r: any) => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`border-2 rounded-xl p-4 text-center transition ${role === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`font-semibold text-sm ${role === r ? 'text-blue-700' : 'text-gray-800'}`}>
                      {r === 'vendor' ? 'Vendor' : 'Business'}
                    </div>
                    <div className={`text-xs mt-1 ${role === r ? 'text-blue-500' : 'text-gray-400'}`}>
                      {r === 'vendor' ? 'Supply IT products' : 'Post RFQs & buy'}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Continue</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm font-medium mb-4">Step 2 — Company details</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 block mb-1">Company name</label>
                    <input value={form.companyName} onChange={e => setForm(f=>({...f,companyName:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="TechPro Solutions" /></div>
                  <div><label className="text-xs text-gray-500 block mb-1">Contact person</label>
                    <input value={form.contactPerson} onChange={e => setForm(f=>({...f,contactPerson:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ahmed Raza" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 block mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="you@company.com" /></div>
                  <div><label className="text-xs text-gray-500 block mb-1">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="+92 300 0000000" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 block mb-1">City</label>
                    <select value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">Select city</option>
                      {CITIES.map((c: any) => <option key={c}>{c}</option>)}
                    </select></div>
                  <div><label className="text-xs text-gray-500 block mb-1">NTN / CNIC</label>
                    <input value={form.ntn} onChange={e => setForm(f=>({...f,ntn:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0000000-0" /></div>
                </div>
                {role === 'vendor' && (
                  <>
                    <div><label className="text-xs text-gray-500 block mb-1">Partner level</label>
                      <select value={form.partnerLevel} onChange={e => setForm(f=>({...f,partnerLevel:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        {['Authorized reseller','Gold partner','Platinum partner','Titanium partner'].map((p: any) => <option key={p}>{p}</option>)}
                      </select></div>
                    <div><label className="text-xs text-gray-500 block mb-1">Brands you deal in</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {BRANDS.map((b: any) => (
                          <button key={b} onClick={() => toggleBrand(b)} type="button"
                            className={`text-xs px-3 py-1 rounded-full border transition ${form.brands.includes(b) ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-500'}`}>
                            {b}
                          </button>
                        ))}
                      </div></div>
                  </>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Back</button>
                <button onClick={() => { if (!form.companyName || !form.email) { setError('Please fill in company name and email'); return } setError(''); setStep(3) }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm font-medium mb-4">Step 3 — Set password</p>
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500 block mb-1">Password</label>
                  <input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Min 8 characters" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Confirm password</label>
                  <input type="password" value={form.confirmPassword} onChange={e => setForm(f=>({...f,confirmPassword:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Re-enter password" /></div>
              </div>
              <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg mt-4">
                Your account will be reviewed by our admin team before activation. You will receive an email once approved.
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Back</button>
                <button onClick={submit} disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
