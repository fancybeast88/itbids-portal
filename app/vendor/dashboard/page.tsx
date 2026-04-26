import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'

export default async function VendorDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!vendor) redirect('/login')

  const [quotes, rfqsAvailable, stockItems, recentUnlocks] = await Promise.all([
    prisma.quote.findMany({
      where: { vendorId: vendor.id },
      include: { rfq: { include: { business: { select: { companyName: true } } } } },
      orderBy: { submittedAt: 'desc' },
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

  const stats = {
    credits:     vendor.credits,
    totalQuotes: quotes.length,
    pending:     quotes.filter(q => q.status === 'submitted').length,
    shortlisted: quotes.filter(q => q.status === 'shortlisted').length,
    won:         quotes.filter(q => q.status === 'won').length,
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
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Welcome, {vendor.companyName}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Here is your activity overview</p>
          </div>
          <Link href="/vendor/rfqs" className="text-sm px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">
            Browse RFQs
          </Link>
        </div>

        {/* Low credits warning */}
        {vendor.credits < 10 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-amber-800">Low credits — only {vendor.credits} left</div>
              <div className="text-xs text-amber-600 mt-0.5">Buy more credits to unlock RFQs and submit quotes.</div>
            </div>
            <Link href="/vendor/credits" className="text-xs bg-amber-600 text-white px-4 py-2 rounded-lg">Buy credits</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Credits',       value: stats.credits,     color: 'text-blue-600',   href: '/vendor/credits' },
            { label: 'RFQs available',value: rfqsAvailable,     color: 'text-gray-800',   href: '/vendor/rfqs' },
            { label: 'Quotes sent',   value: stats.totalQuotes, color: 'text-purple-600', href: '/vendor/quotes' },
            { label: 'Shortlisted',   value: stats.shortlisted, color: 'text-blue-600',   href: '/vendor/quotes' },
            { label: 'Won',           value: stats.won,         color: 'text-green-600',  href: '/vendor/quotes' },
            { label: 'Stock listed',  value: stats.stockItems,  color: 'text-indigo-600', href: '/vendor/stock' },
          ].map(s => (
            <Link key={s.label} href={s.href} className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-sm transition">
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={'text-2xl font-bold ' + s.color}>{s.value}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Recent quotes */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">My quotes</div>
              <Link href="/vendor/quotes" className="text-xs text-blue-600">View all →</Link>
            </div>
            {quotes.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No quotes submitted yet</div>}
            {quotes.slice(0, 5).map(q => (
              <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-xs font-medium text-gray-700 truncate max-w-[180px]">{q.rfq.title}</div>
                  <div className="text-[10px] text-gray-400">{q.rfq.business.companyName} · PKR {Number(q.totalAmount).toLocaleString('en-PK')}</div>
                </div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full ' + badge(q.status)}>{q.status}</span>
              </div>
            ))}
          </div>

          {/* Recent unlocks */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">Recently unlocked RFQs</div>
              <Link href="/vendor/rfqs" className="text-xs text-blue-600">Browse more →</Link>
            </div>
            {recentUnlocks.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No unlocks yet</div>}
            {recentUnlocks.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-xs font-medium text-gray-700 truncate max-w-[180px]">{u.rfq.title}</div>
                  <div className="text-[10px] text-gray-400">{u.rfq.business.companyName} · {u.creditsUsed} credits used</div>
                </div>
                <div className="text-[10px] text-gray-400">{new Date(u.unlockedAt).toLocaleDateString('en-PK', { day:'numeric', month:'short' })}</div>
              </div>
            ))}
          </div>
        </div>

        {/* My stock */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-700">My stock listings</div>
            <Link href="/vendor/stock" className="text-xs text-blue-600">Manage stock →</Link>
          </div>
          {stockItems.length === 0 && (
            <div className="text-xs text-gray-400 py-3 text-center">
              No stock listed yet. <Link href="/vendor/stock" className="text-blue-600">Add your first item</Link>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {stockItems.map(s => (
              <div key={s.id} className="bg-gray-50 rounded-lg p-3">
                <span className={'text-[10px] px-2 py-0.5 rounded-full ' + badge(s.type)}>{s.type}</span>
                <div className="text-xs font-medium text-gray-800 mt-1.5">{s.brand} — {s.model}</div>
                <div className="text-[10px] text-gray-400">{s.category} · Qty: {s.quantity}</div>
                {s.unitPricePkr && <div className="text-[10px] text-blue-600 mt-0.5">PKR {Number(s.unitPricePkr).toLocaleString('en-PK')}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Browse RFQs',     sub: rfqsAvailable + ' live RFQs', href: '/vendor/rfqs',   color: 'border-blue-200 bg-blue-50' },
            { label: 'Add stock item',  sub: stats.stockItems + ' listed', href: '/vendor/stock',  color: 'border-indigo-200 bg-indigo-50' },
            { label: 'Buy credits',     sub: stats.credits + ' remaining', href: '/vendor/credits', color: 'border-green-200 bg-green-50' },
            { label: 'View my quotes',  sub: stats.won + ' won so far',   href: '/vendor/quotes',  color: 'border-purple-200 bg-purple-50' },
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
