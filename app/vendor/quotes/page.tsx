'use client'
import { useEffect, useState } from 'react'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'

const statusColor: Record<string, string> = {
  submitted:   'border-amber-200 bg-amber-50/30',
  shortlisted: 'border-blue-200 bg-blue-50/30',
  won:         'border-green-200 bg-green-50/30',
  lost:        'border-red-200 bg-red-50/30',
}
const statusBadge: Record<string, string> = {
  submitted:   'bg-amber-50 text-amber-700',
  shortlisted: 'bg-blue-50 text-blue-700',
  won:         'bg-green-50 text-green-700',
  lost:        'bg-red-50 text-red-600',
}
const statusLabel: Record<string, string> = {
  submitted:   'Pending review',
  shortlisted: 'Shortlisted by buyer',
  won:         'Won - Contract awarded',
  lost:        'Rejected',
}
const statusDesc: Record<string, string> = {
  submitted:   'Your quote is submitted. Waiting for the business to review.',
  shortlisted: 'The business has shortlisted your quote. Expect them to contact you soon.',
  won:         'Congratulations! Your quote was selected. The business will contact you to proceed.',
  lost:        'The business rejected this quote. Keep submitting on other RFQs.',
}

export default function VendorQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vendor/quotes').then(r => r.json()).then(d => {
      setQuotes(d.quotes || [])
      setCredits(d.credits || 0)
      setLoading(false)
    })
  }, [])

  const stats = {
    total:       quotes.length,
    pending:     quotes.filter(q => q.status === 'submitted').length,
    shortlisted: quotes.filter(q => q.status === 'shortlisted').length,
    won:         quotes.filter(q => q.status === 'won').length,
  }

  return (
    <PortalLayout credits={credits}>
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">My Quotes</h1>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label:'Total submitted', value:stats.total,       color:'text-gray-800' },
            { label:'Pending review',  value:stats.pending,     color:'text-amber-600' },
            { label:'Shortlisted',     value:stats.shortlisted, color:'text-blue-600'  },
            { label:'Won',             value:stats.won,         color:'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={'text-xl font-semibold ' + s.color}>{s.value}</div>
            </div>
          ))}
        </div>

        {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>}

        <div className="space-y-3">
          {!loading && quotes.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
              No quotes submitted yet. <Link href="/vendor/rfqs" className="text-blue-600">Browse RFQs</Link>
            </div>
          )}
          {quotes.map(q => {
            const lines = Array.isArray(q.lineItems) ? q.lineItems : []
            return (
              <div key={q.id} className={'bg-white border-2 rounded-xl overflow-hidden ' + (statusColor[q.status] || 'border-gray-100')}>
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100">
                  <span className={'text-[10px] px-2.5 py-1 rounded-full font-semibold ' + (statusBadge[q.status] || '')}>
                    {statusLabel[q.status] || q.status}
                  </span>
                  <span className="text-xs text-gray-500">{statusDesc[q.status]}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-medium text-sm text-gray-800">{q.rfq?.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{q.rfq?.brand} · {q.rfq?.category} · {q.rfq?.business?.companyName} · {q.rfq?.business?.city}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-gray-800">PKR {Number(q.totalAmount).toLocaleString('en-PK')}</div>
                      <div className="text-[10px] text-gray-400">{new Date(q.submittedAt).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                    {[['Delivery',q.deliveryDays],['Warranty',q.warranty],['Payment',q.paymentTerms],['Valid',q.validityDays?q.validityDays+' days':null]].map(([l,v])=>(
                      <div key={l} className="bg-gray-50 rounded-lg p-2">
                        <div className="text-gray-400 mb-0.5">{l}</div>
                        <div className="font-medium text-gray-700">{v || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                  {lines.length > 0 && (
                    <table className="w-full text-xs mt-2">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-2 py-1.5 font-medium text-gray-400">Description</th>
                          <th className="text-center px-2 py-1.5 font-medium text-gray-400">Qty</th>
                          <th className="text-right px-2 py-1.5 font-medium text-gray-400">Unit price</th>
                          <th className="text-right px-2 py-1.5 font-medium text-gray-400">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((item:any,idx:number)=>(
                          <tr key={idx} className="border-t border-gray-50">
                            <td className="px-2 py-1.5 text-gray-700">{item.desc||item.description||'N/A'}</td>
                            <td className="px-2 py-1.5 text-center">{item.qty||item.quantity||1}</td>
                            <td className="px-2 py-1.5 text-right">PKR {Math.round(item.unitPrice||item.unit_price||0).toLocaleString('en-PK')}</td>
                            <td className="px-2 py-1.5 text-right font-medium">PKR {Math.round((item.qty||item.quantity||1)*(item.unitPrice||item.unit_price||0)).toLocaleString('en-PK')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {q.status === 'shortlisted' && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                      The business may contact you directly. Be ready to discuss delivery and invoicing.
                    </div>
                  )}
                  {q.status === 'won' && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                      You won this contract! Coordinate with {q.rfq?.business?.companyName} for delivery.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PortalLayout>
  )
}
