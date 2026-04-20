'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BRANDS = ['All', 'Dell', 'HP', 'Fortinet', 'Cisco', 'Lenovo']
const CATS   = ['All', 'Laptops', 'Desktops', 'Servers', 'Networking', 'Firewall', 'Storage']

export default function VendorRFQList({ rfqs, vendorCredits }: { rfqs: any[]; vendorCredits: number }) {
  const router = useRouter()
  const [brand, setBrand] = useState('All')
  const [cat, setCat]     = useState('All')
  const [search, setSearch] = useState('')
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<any | null>(null)
  const [credits, setCredits] = useState(vendorCredits)

  const filtered = rfqs.filter(r =>
    (brand === 'All' || r.brand === brand) &&
    (cat === 'All' || r.category === cat) &&
    (search === '' || r.title.toLowerCase().includes(search.toLowerCase()))
  )

  async function doUnlock(rfq: any) {
    setConfirm(null)
    setUnlocking(rfq.id)
    const res = await fetch(`/api/rfqs/${rfq.id}/unlock`, { method: 'POST' })
    setUnlocking(null)
    if (res.ok) { setCredits(c => c - rfq.creditCost); router.refresh() }
    else { const d = await res.json(); alert(d.error || 'Failed to unlock') }
  }

  return (
    <>
      {confirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg">
            <h3 className="font-semibold mb-2">Unlock RFQ</h3>
            <p className="text-sm text-gray-600 mb-1"><strong>{confirm.title}</strong></p>
            <p className="text-sm text-gray-500 mb-4">
              This costs <strong>{confirm.creditCost} credits</strong>. You have <strong>{credits}</strong>.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirm(null)} className="text-sm px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
              <button onClick={() => doUnlock(confirm)} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg">
                Confirm ({confirm.creditCost} cr)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RFQs..."
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:border-blue-400" />
        <select value={brand} onChange={e => setBrand(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none">
          {BRANDS.map((b: any) => <option key={b}>{b}</option>)}
        </select>
        <select value={cat} onChange={e => setCat(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none">
          {CATS.map((c: any) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* RFQ cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No RFQs found</div>
        )}
        {filtered.map(rfq => (
          <div key={rfq.id}
            className={`bg-white border rounded-xl p-4 ${rfq.isUnlocked ? 'border-l-2 border-l-green-500 border-gray-100' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="font-medium text-sm text-gray-800">{rfq.title}</div>
              <div className="flex gap-1.5 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{rfq.brand}</span>
                {rfq.isUnlocked
                  ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Unlocked</span>
                  : <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Locked</span>}
              </div>
            </div>

            {rfq.isUnlocked ? (
              <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                <div>Business: <span className="text-gray-700">{rfq.business.companyName}</span> · {rfq.business.city}</div>
                <div>Budget: <span className="text-gray-700">PKR {Number(rfq.budgetPkr).toLocaleString('en-PK')}</span> · Qty: {rfq.quantity}</div>
                {rfq.specs && <div className="mt-1 text-gray-600 leading-relaxed">{rfq.specs.slice(0, 180)}{rfq.specs.length > 180 ? '…' : ''}</div>}
              </div>
            ) : (
              <div className="text-xs text-gray-400 mb-3 blur-sm select-none">
                Business details and full specifications hidden until unlocked.
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div className="text-[10px] text-gray-400">
                {rfq.category} · Posted {new Date(rfq.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                {!rfq.isUnlocked && ` · ${rfq.creditCost} credits to unlock`}
              </div>
              <div className="flex gap-2">
                {rfq.isUnlocked ? (
                  <Link href={`/vendor/quotes/new?rfqId=${rfq.id}`}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg">
                    Send quote
                  </Link>
                ) : (
                  <button
                    onClick={() => setConfirm(rfq)}
                    disabled={unlocking === rfq.id || credits < rfq.creditCost}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-40">
                    {unlocking === rfq.id ? 'Unlocking…' : `Unlock (${rfq.creditCost} cr)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
