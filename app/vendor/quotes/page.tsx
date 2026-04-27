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
</PortalLayout>
  )
}
