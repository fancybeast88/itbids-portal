'use client'
import { useEffect, useState } from 'react'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'
import { PageHeader, StatCard, StatGrid } from '@/components/ui'

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
      const normalized = (d.quotes || []).map((q: any) => ({
        ...q,
        status: (q.status || 'submitted').toLowerCase(),
      }))
      setQuotes(normalized)
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
      <div className="p-6 space-y-5">
        <PageHeader
          title="My Quotes"
          subtitle="Track submission status and outcomes for your RFQ responses"
          action={<Link href="/vendor/rfqs" className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white font-medium">Browse RFQs</Link>}
        />

        <StatGrid>
          {[
            { label: 'Total quotes', value: stats.total, color: 'text-gray-800' },
            { label: 'Pending review', value: stats.pending, color: 'text-amber-600' },
            { label: 'Shortlisted', value: stats.shortlisted, color: 'text-blue-600' },
            { label: 'Won', value: stats.won, color: 'text-green-600' },
          ].map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
          ))}
        </StatGrid>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          {loading && <div className="text-sm text-gray-400 text-center py-8">Loading quotes...</div>}
          {!loading && quotes.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">
              No quotes submitted yet.
            </div>
          )}
          {!loading && quotes.length > 0 && (
            <div className="space-y-3">
              {quotes.map((q) => {
                const status = (q.status || 'submitted').toLowerCase()
                return (
                  <div key={q.id} className={'border rounded-xl p-4 ' + (statusColor[status] || 'border-gray-200 bg-gray-50/40')}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{q.rfq?.title || 'RFQ'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{q.rfq?.brand || 'General'}</div>
                      </div>
                      <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (statusBadge[status] || 'bg-gray-100 text-gray-600')}>
                        {statusLabel[status] || status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-gray-400">Amount</div>
                        <div className="font-medium text-gray-700">PKR {Number(q.totalAmount || 0).toLocaleString('en-PK')}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Delivery</div>
                        <div className="font-medium text-gray-700">{q.deliveryDays ? `${q.deliveryDays} days` : 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Submitted</div>
                        <div className="font-medium text-gray-700">{new Date(q.submittedAt).toLocaleDateString('en-PK')}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-3">{statusDesc[status] || 'Quote status updated.'}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
</PortalLayout>
  )
}
