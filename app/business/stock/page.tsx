'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/PortalLayout'

const typeColor: Record<string, string> = {
  available: 'bg-green-50 text-green-700 border-green-200',
  upcoming:  'bg-blue-50 text-blue-700 border-blue-200',
}

export default function BusinessStockPage() {
  const [items, setItems]     = useState<any[]>([])
  const [bizCredits, setBizCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [cat, setCat]         = useState('all')

  useEffect(() => {
    fetch('/api/vendor/stock').then(r => r.json()).then(d => {
      setItems(Array.isArray(d) ? d : [])
      setLoading(false)
    })
    fetch('/api/business/profile').then(r => r.json()).then(d => setBizCredits(d.credits || 0)).catch(() => {})
  }, [])

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))]

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.type !== filter) return false
    if (cat !== 'all' && i.category !== cat) return false
    if (search) {
      const s = search.toLowerCase()
      return i.model?.toLowerCase().includes(s) || i.brand?.toLowerCase().includes(s) ||
             i.vendor?.companyName?.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <PortalLayout bizCredits={bizCredits}>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-gray-800">Vendor Stock</h1>
          <p className="text-xs text-gray-400 mt-0.5">Browse available and upcoming IT stock from verified vendors</p>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by model, brand, vendor..."
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-52 focus:outline-none focus:border-blue-400" />
          {['all','available','upcoming'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={"text-xs px-3 py-1.5 rounded-full border transition " + (filter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500')}>
              {f === 'all' ? 'All stock' : f === 'available' ? 'Available now' : 'Upcoming'}
              <span className="ml-1 opacity-60">({f === 'all' ? items.length : items.filter(i => i.type === f).length})</span>
            </button>
          ))}
          <select value={cat} onChange={e => setCat(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
          </select>
        </div>

        {loading && <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400 text-sm">
            No stock items found matching your filters.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filtered.map(item => (
            <div key={item.id} className={"bg-white border-2 rounded-xl p-4 " + (typeColor[item.type] || 'border-gray-100')}>
              <div className="flex items-start justify-between mb-2">
                <span className={"text-[10px] px-2 py-0.5 rounded-full border font-medium " + (typeColor[item.type] || '')}>
                  {item.type === 'available' ? 'Available now' : 'Upcoming stock'}
                </span>
                <span className="text-[10px] text-gray-400 capitalize">{item.condition}</span>
              </div>
              <div className="font-medium text-gray-800 text-sm mt-1">{item.brand} — {item.model}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.category} · {item.city}</div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-1.5 leading-relaxed border-t border-gray-50 pt-1.5">{item.description}</div>
              )}
              <div className="flex gap-4 mt-2 text-xs flex-wrap">
                <span><strong className="text-gray-600">Qty:</strong> <span className="text-gray-800">{item.quantity}</span></span>
                {item.unitPricePkr && (
                  <span><strong className="text-gray-600">Price:</strong> <span className="text-blue-700 font-semibold">PKR {Number(item.unitPricePkr).toLocaleString('en-PK')}</span></span>
                )}
                {item.type === 'upcoming' && item.expectedDate && (
                  <span><strong className="text-gray-600">Expected:</strong> <span className="text-blue-600">{new Date(item.expectedDate).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })}</span></span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-700">{item.vendor?.companyName}</div>
                  <div className="text-[10px] text-gray-400">{item.vendor?.city} · {item.vendor?.partnerLevel}</div>
                </div>
                {item.vendor?.phone && (
                  <a href={"tel:" + item.vendor.phone}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg">
                    Contact
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
