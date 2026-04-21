'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Pkg = { id: string; credits: number; pricePkr: number; label?: string | null }
type Txn = { id: string; credits: number; type: string; status: string; createdAt: Date; rfqId?: string | null }

const statusColor: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  confirmed: 'bg-green-50 text-green-700',
  failed:    'bg-red-50 text-red-700',
}

export default function BusinessCreditTopup({
  packages, transactions, bizCredits, postFee, bizEmail, bizId
}: {
  packages: Pkg[]; transactions: Txn[]; bizCredits: number;
  postFee: number; bizEmail: string; bizId: string
}) {
  const router = useRouter()
  const defaultPkg = packages.find(p => p.credits === 100) || packages[0]
  const [pkg, setPkg]       = useState<Pkg | null>(defaultPkg || null)
  const [method, setMethod] = useState<'jazzcash' | 'easypaisa' | 'bank'>('jazzcash')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  async function pay() {
    if (!pkg) return
    if ((method === 'jazzcash' || method === 'easypaisa') && !mobile) { setError('Please enter your mobile number'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/business/credits/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId: pkg.id, method, mobile }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Payment failed'); return }
    setSuccess(true)
    router.refresh()
  }

  if (success) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l5 5 7-8" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      <div className="font-semibold text-green-800 mb-1">Payment initiated</div>
      <div className="text-sm text-green-600 mb-1">Credits will be added once payment is confirmed.</div>
      <div className="text-xs text-gray-400">Confirmation sent to {bizEmail}</div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400 mb-1">Your credit balance</div>
          <div className="text-3xl font-bold text-blue-600">{bizCredits}</div>
          <div className="text-xs text-gray-400 mt-1">credits available</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">RFQ posting fee</div>
          <div className="text-xl font-semibold text-gray-700">{postFee} credits</div>
          <div className="text-xs text-gray-400 mt-1">per RFQ post</div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Select package</div>
        <div className="grid grid-cols-3 gap-3">
          {packages.map(p => (
            <button key={p.id} onClick={() => setPkg(p)}
              className={`border-2 rounded-xl p-3 text-center transition ${pkg?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="text-xl font-semibold text-gray-800">{p.credits}</div>
              <div className="text-[10px] text-gray-400 mb-1">credits</div>
              <div className="text-sm font-medium text-blue-600">PKR {p.pricePkr.toLocaleString('en-PK')}</div>
              {p.label && <div className="text-[10px] mt-1 bg-green-100 text-green-700 rounded-full px-2 py-0.5">{p.label}</div>}
              <div className="text-[10px] text-gray-400 mt-1">{Math.floor(p.credits / postFee)} RFQ posts</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Payment method</div>
        <div className="space-y-2">
          {[
            { key: 'jazzcash',  label: 'JazzCash',     desc: 'Mobile wallet · Instant',              color: 'bg-red-500'   },
            { key: 'easypaisa', label: 'Easypaisa',     desc: 'Mobile wallet · Instant',              color: 'bg-green-600' },
            { key: 'bank',      label: 'Bank transfer', desc: 'HBL / MCB / UBL · Confirmed by admin', color: 'bg-blue-600'  },
          ].map(m => (
            <button key={m.key} onClick={() => setMethod(m.key as any)}
              className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl text-left transition ${method === m.key ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
              <div className={`w-9 h-6 ${m.color} rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                {m.key === 'jazzcash' ? 'JC' : m.key === 'easypaisa' ? 'EP' : 'BT'}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">{m.label}</div>
                <div className="text-[10px] text-gray-400">{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
        {(method === 'jazzcash' || method === 'easypaisa') && (
          <div className="mt-3">
            <label className="text-xs text-gray-400 block mb-1">{method === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} mobile number</label>
            <input value={mobile} onChange={e => setMobile(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="+92 3XX XXXXXXX" />
          </div>
        )}
        {method === 'bank' && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <div>Bank: <strong>HBL</strong></div>
            <div>Account name: <strong>Lead Vault Pvt Ltd</strong></div>
            <div>Account no: <strong>0123-456789-01</strong></div>
            <div>Branch: <strong>Karachi Main</strong></div>
            <div className="text-amber-700 mt-1">Use your registered email as reference. Credits added after admin confirms (1–2 hrs).</div>
          </div>
        )}
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

      <button onClick={pay} disabled={loading || !pkg}
        className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
        {loading ? 'Processing…' : `Pay PKR ${pkg ? pkg.pricePkr.toLocaleString('en-PK') : '—'}`}
      </button>

      {transactions.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Transaction history</div>
          <div className="space-y-2">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className={t.credits > 0 ? 'text-green-600' : 'text-red-500'}>
                    {t.credits > 0 ? '+' : ''}{t.credits} credits
                  </span>
                  <span className="text-gray-400 ml-2 capitalize">
                    {t.type.replace('-', ' ')} · {new Date(t.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor[t.status] || 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
