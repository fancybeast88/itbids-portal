import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'
import { PageHeader, StatCard, StatGrid } from '@/components/ui'

export default async function BusinessDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')

  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) redirect('/login')

  const settings = await prisma.globalSettings.findUnique({ where: { id: 'singleton' } })
  const postFee = settings?.rfqPostFee ?? 50

  const [rfqs, rfqStats, recentQuotes, stockCount, totalQuotes] = await Promise.all([
    prisma.rfq.findMany({
      where: { businessId: biz.id },
      include: {
        quotes: { select: { id: true, status: true, totalAmount: true, vendor: { select: { companyName: true } } } },
        _count: { select: { unlocks: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.rfq.groupBy({ by: ['status'], where: { businessId: biz.id }, _count: true }),
    prisma.quote.findMany({
      where: { rfq: { businessId: biz.id } },
      include: { vendor: { select: { companyName: true } }, rfq: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    }),
    prisma.stockItem.count({ where: { isActive: true } }),
    prisma.quote.count({ where: { rfq: { businessId: biz.id } } }),
  ])

  const rfqMap = Object.fromEntries(rfqStats.map(r => [r.status, r._count]))
  const stats = {
    totalRfqs:   Object.values(rfqMap).reduce((a: any, b: any) => a + b, 0),
    activeRfqs:  rfqMap['approved'] || 0,
    pendingRfqs: rfqMap['pending'] || 0,
    totalQuotes,
  }

  const badge = (s: string) => ({
    pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700',
    rejected:'bg-red-50 text-red-700', submitted:'bg-gray-100 text-gray-600',
    shortlisted:'bg-blue-50 text-blue-700', won:'bg-green-50 text-green-700',
  }[s] || 'bg-gray-100 text-gray-500')

  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6 space-y-5">
        <PageHeader
          title={`Welcome, ${biz.companyName}`}
          subtitle="Here is an overview of your procurement activity"
          action={
            <Link href="/business/post-rfq"
              className={"text-sm px-4 py-2 rounded-lg font-medium " + (biz.credits >= postFee ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400')}>
              + Post RFQ ({postFee} credits)
            </Link>
          }
        />

        {biz.credits < postFee && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-amber-800">Insufficient credits to post RFQ</div>
              <div className="text-xs text-amber-600 mt-0.5">You need {postFee} credits. Current balance: {biz.credits}.</div>
            </div>
            <Link href="/business/credits" className="text-xs bg-amber-600 text-white px-4 py-2 rounded-lg">Buy credits</Link>
          </div>
        )}

        <StatGrid>
          {[
            { label:'Credits',         value:biz.credits,        color:'text-blue-600',   href:'/business/credits' },
            { label:'Total RFQs',      value:stats.totalRfqs,    color:'text-gray-800',   href:'/business/my-rfqs' },
            { label:'Active RFQs',     value:stats.activeRfqs,   color:'text-green-600',  href:'/business/my-rfqs' },
            { label:'Pending review',  value:stats.pendingRfqs,  color:'text-amber-600',  href:'/business/my-rfqs' },
            { label:'Quotes received', value:stats.totalQuotes,  color:'text-purple-600', href:'/business/my-rfqs' },
            { label:'Vendor stock',    value:stockCount,          color:'text-indigo-600', href:'/business/stock' },
          ].map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} color={s.color} href={s.href} />
          ))}
        </StatGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">My RFQs</div>
              <Link href="/business/my-rfqs" className="text-xs text-blue-600">View all</Link>
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

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">Recent quotes</div>
            </div>
            {recentQuotes.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No quotes yet</div>}
            {recentQuotes.map(q => (
              <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-xs font-medium text-gray-700">{q.vendor.companyName}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{q.rfq.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">PKR {Number(q.totalAmount).toLocaleString('en-PK')}</div>
                  <span className={'text-[10px] px-2 py-0.5 rounded-full ' + badge(q.status)}>{q.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label:'Post a new RFQ',  sub:postFee+' credits required',    href:'/business/post-rfq', color:'border-blue-200 bg-blue-50' },
            { label:'View vendor stock',sub:stockCount+' items available', href:'/business/stock',    color:'border-indigo-200 bg-indigo-50' },
            { label:'Buy credits',     sub:'Current: '+biz.credits+' cr',  href:'/business/credits',  color:'border-green-200 bg-green-50' },
            { label:'View my RFQs',    sub:stats.totalRfqs+' total RFQs',  href:'/business/my-rfqs',  color:'border-purple-200 bg-purple-50' },
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
