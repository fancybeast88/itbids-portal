'use client'
import { useState } from 'react'

const statusColor: Record<string, string> = {
  submitted:   'bg-amber-50 text-amber-700',
  shortlisted: 'bg-blue-50 text-blue-700',
  won:         'bg-green-50 text-green-700',
  lost:        'bg-red-50 text-red-700',
}

export default function AdminQuotesTable({ quotes }: { quotes: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')

  const filtered = quotes.filter(q => {
    if (filter !== 'all' && q.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return q.rfq?.title?.toLowerCase().includes(s) ||
             q.vendor?.companyName?.toLowerCase().includes(s) ||
             q.rfq?.business?.companyName?.toLowerCase().includes(s)
    }
    return true
  })

  function fmt(n: number) { return Math.round(n).toLocaleString('en-PK') }

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by RFQ, vendor, or business..."
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-56 focus:outline-none focus:border-blue-400" />
        {['all','submitted','shortlisted','won','lost'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span className="ml-1 opacity-60">({quotes.filter(q => q.status === f).length})</span>}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">RFQ</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Vendor</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Business</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Amount</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Submitted</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No quotes found</td></tr>
            )}
            {filtered.map(q => (
              <>
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-700 max-w-[180px] truncate">{q.rfq?.title}</div>
                    <div className="text-[10px] text-gray-400">{q.rfq?.brand} · {q.rfq?.category}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-gray-700 font-medium">{q.vendor?.companyName}</div>
                    <div className="text-[10px] text-gray-400">{q.vendor?.city}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-gray-700">{q.rfq?.business?.companyName}</div>
                    <div className="text-[10px] text-gray-400">{q.rfq?.business?.city}</div>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-700">
                    PKR {fmt(Number(q.totalAmount))}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">
                    {new Date(q.submittedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[q.status] || 'bg-gray-100 text-gray-500'}`}>
                      {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                      className="text-[10px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                      {expanded === q.id ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>

                {expanded === q.id && (
                  <tr key={q.id + '-detail'} className="border-b border-gray-100 bg-blue-50/20">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid grid-cols-3 gap-4">

                        {/* Quote details */}
                        <div>
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quote details</div>
                          <table className="w-full text-xs">
                            {[
                              ['Total amount',    `PKR ${fmt(Number(q.totalAmount))}`],
                              ['Delivery',        q.deliveryDays || '—'],
                              ['Warranty',        q.warranty     || '—'],
                              ['Payment terms',   q.paymentTerms || '—'],
                              ['Valid for',       q.validityDays ? `${q.validityDays} days` : '—'],
                            ].map(([label, value]) => (
                              <tr key={label}>
                                <td className="py-1 text-gray-400 w-28">{label}</td>
                                <td className="py-1 text-gray-700 font-medium">{value}</td>
                              </tr>
                            ))}
                          </table>
                          {q.notes && (
                            <div className="mt-2 text-[10px] text-gray-500 bg-gray-50 rounded p-2 leading-relaxed">
                              <span className="font-medium text-gray-600">Notes: </span>{q.notes}
                            </div>
                          )}
                        </div>

                        {/* Line items */}
                        <div>
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Line items</div>
                          {Array.isArray(q.lineItems) && q.lineItems.length > 0 ? (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400 border-b border-gray-100">
                                  <th className="text-left pb-1 font-medium">Item</th>
                                  <th className="text-right pb-1 font-medium">Qty</th>
                                  <th className="text-right pb-1 font-medium">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {q.lineItems.map((item: any, i: number) => (
                                  <tr key={i} className="border-b border-gray-50 last:border-0">
                                    <td className="py-1 text-gray-700 pr-2">
                                      <div>{item.desc || item.description || '—'}</div>
                                      {item.sku && <div className="text-[9px] text-gray-400">{item.sku}</div>}
                                    </td>
                                    <td className="py-1 text-right text-gray-500">{item.qty || item.quantity || 1}</td>
                                    <td className="py-1 text-right text-gray-700 font-medium">
                                      PKR {fmt((item.qty || item.quantity || 1) * (item.unitPrice || item.unit_price || item.unit || 0))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-[10px] text-gray-400">No line items</div>
                          )}
                        </div>

                        {/* Contact info */}
                        <div>
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Contacts</div>
                          <div className="text-[10px] font-medium text-gray-500 mb-1">Vendor</div>
                          <table className="w-full text-xs mb-3">
                            {[
                              ['Company',  q.vendor?.companyName  || '—'],
                              ['Contact',  q.vendor?.contactPerson || '—'],
                              ['Phone',    q.vendor?.phone         || '—'],
                              ['City',     q.vendor?.city          || '—'],
                              ['Level',    q.vendor?.partnerLevel  || '—'],
                            ].map(([label, value]) => (
                              <tr key={label}>
                                <td className="py-0.5 text-gray-400 w-16">{label}</td>
                                <td className="py-0.5 text-gray-700">{value}</td>
                              </tr>
                            ))}
                          </table>
                          <div className="text-[10px] font-medium text-gray-500 mb-1">Business (Buyer)</div>
                          <table className="w-full text-xs">
                            {[
                              ['Company', q.rfq?.business?.companyName || '—'],
                              ['Phone',   q.rfq?.business?.phone       || '—'],
                              ['City',    q.rfq?.business?.city        || '—'],
                            ].map(([label, value]) => (
                              <tr key={label}>
                                <td className="py-0.5 text-gray-400 w-16">{label}</td>
                                <td className="py-0.5 text-gray-700">{value}</td>
                              </tr>
                            ))}
                          </table>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
