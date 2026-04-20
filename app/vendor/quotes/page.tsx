import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'

const statusColor: Record<string, string> = {
  submitted:   'bg-amber-50 text-amber-700',
  shortlisted: 'bg-blue-50 text-blue-700',
  won:         'bg-green-50 text-green-700',
  lost:        'bg-red-50 text-red-700',
}

export default async function VendorQuotesPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'vendor') redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/login')

  const quotes = await prisma.quote.findMany({
    where: { vendorId: vendor.id },
    include: { rfq: { include: { business: { select: { companyName: true, city: true } } } } },
    orderBy: { submittedAt: 'desc' },
  })

  const stats = {
    total: quotes.length,
    shortlisted: quotes.filter(q => q.status === 'shortlisted').length,
    won: quotes.filter(q => q.status === 'won').length,
    totalValue: quotes.reduce((s, q) => s + Number(q.totalAmount), 0),
  }

  return (
    <PortalLayout credits={vendor.credits}>
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800 mb-4">My Quotes</h1>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total sent',   value: stats.total },
            { label: 'Shortlisted',  value: stats.shortlisted, color: 'text-blue-600' },
            { label: 'Won',          value: stats.won,         color: 'text-green-600' },
            { label: 'Win rate',     value: stats.total ? `${Math.round((stats.won / stats.total) * 100)}%` : '0%' },
          ].map((s: any) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={`text-xl font-semibold ${s.color || 'text-gray-800'}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {quotes.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No quotes submitted yet. <Link href="/vendor/rfqs" className="text-blue-600">Browse RFQs</Link>
            </div>
          )}
          {quotes.map((q: any) => (
            <div key={q.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-medium text-sm text-gray-800">{q.rfq.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {q.rfq.business.companyName} · {q.rfq.business.city} · {q.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[q.status]}`}>
                  {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="text-xs text-gray-500">
                  PKR {Number(q.totalAmount).toLocaleString('en-PK')} ·
                  Submitted {new Date(q.submittedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} ·
                  Valid {q.validityDays} days
                </div>
                {q.status === 'won' && (
                  <Link href={`/vendor/quotes/${q.id}/delivery-note`}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Delivery note
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
