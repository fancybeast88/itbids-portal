import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'

export default async function BusinessDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')

  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) redirect('/login')

  const settings = await prisma.globalSettings.findUnique({ where: { id: 'singleton' } })
  const postFee = settings?.rfqPostFee ?? 50

  const [rfqs, recentQuotes, stockCount] = await Promise.all([
    prisma.rfq.findMany({
      where: { businessId: biz.id },
      include: {
        quotes: { select: { id: true, status: true, totalAmount: true, vendor: { select: { companyName: true } } } },
        _count: { select: { unlocks: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quote.findMany({
      where: { rfq: { businessId: biz.id } },
      include: { vendor: { select: { companyName: true } }, rfq: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    }),
    prisma.stockItem.count({ where: { isActive: true } }),
  ])

  const stats = {
    totalRfqs:    rfqs.length,
    activeRfqs:   rfqs.filter(r => r.status === 'approved').length,
    pendingRfqs:  rfqs.filter(r => r.status === 'pending').length,
    totalQuotes:  rfqs.reduce((s, r) => s + r.quotes.length, 0),
    shortlisted:  rfqs.reduce((s, r) => s + r.quotes.filter(q => q.status === 'shortlisted').length, 0),
    won:          rfqs.reduce((s, r) => s + r.quotes.filter(q => q.status === 'won').length, 0),
  }

  const canPost = biz.credits >= postFee

  const badge = (s: string) => ({
    pending:     'bg-amber-50 text-amber-700',
    approved:    'bg-green-50 text-green-700',
    rejected:    'bg-red-50 text-red-700',
    submitted:   'bg-gray-100 text-gray-600',
    shortlisted: 'bg-blue-50 text-blue-700',
    won:         'bg-green-50 text-green-700',
    lost:        'bg-red-50 text-red-600',
  }[s] || 'bg-gray-100 text-gray-500')

  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6 space-y-5">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Welcome, {biz.companyName}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Here is an overview of your procurement activity</p>
          </div>
          <Link href="/business/post-rfq"
            className={"text-sm px-4 py-2 rounded-lg font-medium " + (canPost ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
            + Post RFQ ({postFee} credits)
          </Link>
        </div>

        {/* Credit balance alert */}
        {!canPost && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-amber-800">Insufficient credits to post RFQ</div>
              <div className="text-xs text-amber-600 mt-0.5">You need {postFee} credits. Current balance: {biz.credits}. Buy credits to post new RFQs.</div>
            </div>
            <Link href="/business/credits" className="text-xs bg-amber-600 text-white px-4 py-2 rounded-lg">Buy credits</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Credits',        value: biz.credits,        color: 'text-blue-600',   href: '/business/credits' },
            { label: 'Total RFQs',     value: stats.totalRfqs,    color: 'text-gray-800',   href: '/business/my-rfqs' },
            { label: 'Active RFQs',    value: stats.activeRfqs,   color: 'text-green-600',  href: '/business/my-rfqs' },
            { label: 'Pending review', value: stats.pendingRfqs,  color: 'text-amber-600',  href: '/business/my-rfqs' },
            { label: 'Quotes received',value: stats.totalQuotes,  color: 'text-purple-600', href: '/business/my-rfqs' },
            { label: 'Vendor stock',   value: stockCount,          color: 'text-indigo-600', href: '/business/stock' },
          ].map(s => (
            <Link key={s.label} href={s.href} className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-sm transition">
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={'text-2xl font-bold ' + s.color}>{s.value}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* My RFQs */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">My RFQs</div>
              <Link href="/business/my-rfqs" className="text-xs text-blue-600">View all →</Link>
            </div>
            {rfqs.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No RFQs yet</div>}
            {rfqs.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{r.title}</div>
                  <div className="text-[10px] text-gray-400">{r._count.unlocks} unlocks · {r.quotes.length} quotes</div>
                </div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full ' + badge(r.status)}>{r.status}</span>
              </div>
            ))}
          </div>

          {/* Recent quotes */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">Recent quotes received</div>
            </div>
            {recentQuotes.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No quotes yet</div>}
            {recentQuotes.map(q => (
              <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-xs font-medium text-gray-700">{q.vendor.companyName}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{q.rfq.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-800">PKR {Number(q.totalAmount).toLocaleString('en-PK')}</div>
                  <span className={'text-[10px] px-2 py-0.5 rounded-full ' + badge(q.status)}>{q.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Post a new RFQ',        sub: postFee + ' credits required', href: '/business/post-rfq', color: 'border-blue-200 bg-blue-50' },
            { label: 'View vendor stock',      sub: stockCount + ' items available', href: '/business/stock',    color: 'border-indigo-200 bg-indigo-50' },
            { label: 'Buy credits',            sub: 'Current: ' + biz.credits + ' credits', href: '/business/credits', color: 'border-green-200 bg-green-50' },
            { label: 'View my RFQs',           sub: stats.totalRfqs + ' total RFQs', href: '/business/my-rfqs', color: 'border-purple-200 bg-purple-50' },
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
