import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'
import { PageHeader, StatCard, StatGrid } from '@/components/ui'

export default async function VendorDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!vendor) redirect('/login')

  const [quoteStats, recentQuotes, rfqsAvailable, stockItems, recentUnlocks] = await Promise.all([
    prisma.quote.groupBy({ by: ['status'], where: { vendorId: vendor.id }, _count: true }),
    prisma.quote.findMany({
      where: { vendorId: vendor.id },
      include: { rfq: { include: { business: { select: { companyName: true } } } } },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    }),
    prisma.rfq.count({ where: { status: 'approved' } }),
    prisma.stockItem.findMany({
      where: { vendorId: vendor.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.rfqUnlock.findMany({
      where: { vendorId: vendor.id },
      include: { rfq: { include: { business: { select: { companyName: true } } } } },
      orderBy: { unlockedAt: 'desc' },
      take: 5,
    }),
  ])

  const quoteMap = Object.fromEntries(quoteStats.map(q => [q.status, q._count]))
  const stats = {
    credits:     vendor.credits,
    totalQuotes: Object.values(quoteMap).reduce((a: any, b: any) => a + b, 0),
    pending:     quoteMap['submitted'] || 0,
    shortlisted: quoteMap['shortlisted'] || 0,
    won:         quoteMap['won'] || 0,
    stockItems:  stockItems.length,
  }

  const badge = (s: string) => ({
    submitted:   'bg-amber-50 text-amber-700',
    shortlisted: 'bg-blue-50 text-blue-700',
    won:         'bg-green-50 text-green-700',
    lost:        'bg-red-50 text-red-600',
    available:   'bg-green-50 text-green-700',
    upcoming:    'bg-blue-50 text-blue-700',
  }[s] || 'bg-gray-100 text-gray-500')

  return (
    <PortalLayout credits={vendor.credits}>
      <div className="p-6 space-y-5">
        <PageHeader
          title={`Welcome, ${vendor.companyName}`}
          subtitle="Track RFQs, quotes, stock, and unlock activity"
          action={<Link href="/vendor/quotes/new" className="text-sm px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">+ Submit Quote</Link>}
        />

        <StatGrid>
          {[
            { label: 'Credits', value: stats.credits, color: 'text-blue-600', href: '/vendor/credits' },
            { label: 'RFQs available', value: rfqsAvailable, color: 'text-green-600', href: '/vendor/rfqs' },
            { label: 'Total quotes', value: stats.totalQuotes, color: 'text-gray-800', href: '/vendor/quotes' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600', href: '/vendor/quotes' },
            { label: 'Shortlisted', value: stats.shortlisted, color: 'text-indigo-600', href: '/vendor/quotes' },
            { label: 'Won', value: stats.won, color: 'text-emerald-600', href: '/vendor/quotes' },
          ].map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} color={s.color} href={s.href} />
          ))}
        </StatGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">Recent quotes</div>
              <Link href="/vendor/quotes" className="text-xs text-blue-600">View all</Link>
            </div>
            {recentQuotes.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No quotes submitted yet</div>}
            {recentQuotes.map(q => (
              <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-xs font-medium text-gray-700 truncate max-w-[220px]">{q.rfq.title}</div>
                  <div className="text-[10px] text-gray-400">{q.rfq.business.companyName}</div>
                </div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full ' + badge(q.status)}>{q.status}</span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">Recent unlocks</div>
              <Link href="/vendor/rfqs" className="text-xs text-blue-600">Browse RFQs</Link>
            </div>
            {recentUnlocks.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No RFQs unlocked yet</div>}
            {recentUnlocks.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-xs font-medium text-gray-700 truncate max-w-[220px]">{u.rfq.title}</div>
                  <div className="text-[10px] text-gray-400">{u.rfq.business.companyName}</div>
                </div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full ' + badge('available')}>Unlocked</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Browse RFQs', sub: rfqsAvailable + ' approved RFQs', href: '/vendor/rfqs', color: 'border-blue-200 bg-blue-50' },
            { label: 'Manage stock', sub: stats.stockItems + ' active items', href: '/vendor/stock', color: 'border-indigo-200 bg-indigo-50' },
            { label: 'My quotes', sub: stats.totalQuotes + ' total submitted', href: '/vendor/quotes', color: 'border-purple-200 bg-purple-50' },
            { label: 'Buy credits', sub: 'Current: ' + stats.credits + ' cr', href: '/vendor/credits', color: 'border-green-200 bg-green-50' },
          ].map(a => (
            <Link key={a.label} href={a.href} className={'border-2 rounded-xl p-4 hover:shadow-sm transition ' + a.color}>
              <div className="text-sm font-medium text-gray-800 mb-1">{a.label}</div>
              <div className="text-[10px] text-gray-500">{a.sub}</div>
            </Link>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
