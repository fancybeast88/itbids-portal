import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  const [
    rfqPending, rfqApproved, rfqTotal,
    vendorPending, vendorApproved, vendorTotal,
    bizPending, bizApproved, bizTotal,
    quotesTotal, quotesShortlisted, quotesWon,
    paymentPending, paymentConfirmed, totalRevenue,
    recentRFQs, recentVendors, recentBiz, recentQuotes, recentTxns,
  ] = await Promise.all([
    prisma.rfq.count({ where: { status: 'pending' } }),
    prisma.rfq.count({ where: { status: 'approved' } }),
    prisma.rfq.count(),
    prisma.user.count({ where: { role: 'vendor', status: 'pending' } }),
    prisma.user.count({ where: { role: 'vendor', status: 'approved' } }),
    prisma.user.count({ where: { role: 'vendor' } }),
    prisma.user.count({ where: { role: 'business', status: 'pending' } }),
    prisma.user.count({ where: { role: 'business', status: 'approved' } }),
    prisma.user.count({ where: { role: 'business' } }),
    prisma.quote.count(),
    prisma.quote.count({ where: { status: 'shortlisted' } }),
    prisma.quote.count({ where: { status: 'won' } }),
    prisma.creditTransaction.count({ where: { status: 'pending', type: 'purchase' } }),
    prisma.creditTransaction.count({ where: { status: 'confirmed', type: 'purchase' } }),
    prisma.creditTransaction.aggregate({ where: { status: 'confirmed', type: 'purchase' }, _sum: { amountPkr: true } }),
    prisma.rfq.findMany({ orderBy: { createdAt: 'desc' }, take: 4, include: { business: { select: { companyName: true } } } }),
    prisma.user.findMany({ where: { role: 'vendor' }, orderBy: { createdAt: 'desc' }, take: 4, include: { vendorProfile: { select: { companyName: true, credits: true } } } }),
    prisma.user.findMany({ where: { role: 'business' }, orderBy: { createdAt: 'desc' }, take: 4, include: { businessProfile: { select: { companyName: true, credits: true } } } }),
    prisma.quote.findMany({ orderBy: { submittedAt: 'desc' }, take: 4, include: { vendor: { select: { companyName: true } }, rfq: { select: { title: true } } } }),
    prisma.creditTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 4, include: { vendor: { select: { companyName: true } } } }),
  ])

  const badge = (status: string) => {
    const m: Record<string, string> = {
      pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700',
      rejected:'bg-red-50 text-red-700', confirmed:'bg-green-50 text-green-700',
      submitted:'bg-gray-100 text-gray-600', shortlisted:'bg-blue-50 text-blue-700', won:'bg-green-50 text-green-700',
    }
    return m[status] || 'bg-gray-100 text-gray-500'
  }

  return (
    <PortalLayout>
      <div className="p-6 space-y-5">
        <h1 className="text-lg font-semibold text-gray-800">Admin Dashboard</h1>

        <div className="grid grid-cols-5 gap-3">
          {[
            { label:'Total RFQs', value:rfqTotal, sub:rfqPending+' pending', color:'text-blue-600', href:'/admin/rfqs' },
            { label:'Quotes', value:quotesTotal, sub:quotesWon+' won', color:'text-purple-600', href:'/admin/quotes' },
            { label:'Vendors', value:vendorTotal, sub:vendorPending+' pending', color:'text-blue-600', href:'/admin/users' },
            { label:'Businesses', value:bizTotal, sub:bizPending+' pending', color:'text-green-600', href:'/admin/users' },
            { label:'Revenue (PKR)', value:((totalRevenue._sum.amountPkr||0)/1000).toFixed(0)+'K', sub:paymentPending+' payments pending', color:'text-green-600', href:'/admin/payments' },
          ].map(s => (
            <Link key={s.label} href={s.href} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={'text-2xl font-bold '+s.color}>{s.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{s.sub}</div>
            </Link>
          ))}
        </div>

        {(rfqPending>0||vendorPending>0||bizPending>0||paymentPending>0) && (
          <div className="grid grid-cols-4 gap-3">
            {rfqPending>0&&<Link href="/admin/rfqs" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3"><div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">{rfqPending}</div><div><div className="text-xs font-medium text-amber-800">RFQs need approval</div><div className="text-[10px] text-amber-600">Click to review</div></div></Link>}
            {vendorPending>0&&<Link href="/admin/users" className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">{vendorPending}</div><div><div className="text-xs font-medium text-blue-800">Vendors pending</div><div className="text-[10px] text-blue-600">Click to approve</div></div></Link>}
            {bizPending>0&&<Link href="/admin/users" className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3"><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{bizPending}</div><div><div className="text-xs font-medium text-green-800">Businesses pending</div><div className="text-[10px] text-green-600">Click to approve</div></div></Link>}
            {paymentPending>0&&<Link href="/admin/payments" className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-3"><div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">{paymentPending}</div><div><div className="text-xs font-medium text-purple-800">Payments pending</div><div className="text-[10px] text-purple-600">Click to confirm</div></div></Link>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">RFQ Approvals</div>
              <div className="flex gap-1.5 text-[10px]">
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{rfqPending} pending</span>
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{rfqApproved} approved</span>
              </div>
            </div>
            {recentRFQs.map(r => (
              <div key={r.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                <div><div className="font-medium text-gray-700 truncate max-w-[200px]">{r.title}</div><div className="text-gray-400">{r.business.companyName} · {r.brand}</div></div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(r.status)}>{r.status}</span>
              </div>
            ))}
            <Link href="/admin/rfqs" className="block text-center text-xs text-blue-600 mt-3 pt-2 border-t border-gray-50 hover:underline">View all RFQs →</Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">All Quotes</div>
              <div className="flex gap-1.5 text-[10px]">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{quotesShortlisted} shortlisted</span>
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{quotesWon} won</span>
              </div>
            </div>
            {recentQuotes.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No quotes yet</div>}
            {recentQuotes.map(q => (
              <div key={q.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                <div><div className="font-medium text-gray-700 truncate max-w-[200px]">{q.rfq.title}</div><div className="text-gray-400">{q.vendor.companyName} · PKR {Number(q.totalAmount).toLocaleString('en-PK')}</div></div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(q.status)}>{q.status}</span>
              </div>
            ))}
            <Link href="/admin/quotes" className="block text-center text-xs text-blue-600 mt-3 pt-2 border-t border-gray-50 hover:underline">View all quotes →</Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">Users</div>
              <div className="flex gap-1.5 text-[10px]">
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{vendorTotal} vendors</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bizTotal} businesses</span>
              </div>
            </div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent vendors</div>
            {recentVendors.map(u => (
              <div key={u.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <div><div className="font-medium text-gray-700">{u.vendorProfile?.companyName||u.email}</div><div className="text-gray-400">{u.vendorProfile?.credits??0} credits</div></div>
                <div className="flex items-center gap-1.5">
                  <span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(u.status)}>{u.status}</span>
                  <Link href={'/admin/users/'+u.id} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Edit</Link>
                </div>
              </div>
            ))}
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">Recent businesses</div>
            {recentBiz.map(u => (
              <div key={u.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <div><div className="font-medium text-gray-700">{u.businessProfile?.companyName||u.email}</div><div className="text-gray-400">{u.businessProfile?.credits??0} credits</div></div>
                <div className="flex items-center gap-1.5">
                  <span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(u.status)}>{u.status}</span>
                  <Link href={'/admin/users/'+u.id} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Edit</Link>
                </div>
              </div>
            ))}
            <Link href="/admin/users" className="block text-center text-xs text-blue-600 mt-3 pt-2 border-t border-gray-50 hover:underline">View all users →</Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700">Payments</div>
              <div className="flex gap-1.5 text-[10px]">
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{paymentPending} pending</span>
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{paymentConfirmed} confirmed</span>
              </div>
            </div>
            {recentTxns.length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No transactions yet</div>}
            {recentTxns.map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                <div><div className="font-medium text-gray-700">{t.vendor.companyName}</div><div className="text-gray-400">+{t.credits} credits · PKR {(t.amountPkr||0).toLocaleString('en-PK')} · {t.paymentMethod||'N/A'}</div></div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(t.status)}>{t.status}</span>
              </div>
            ))}
            <Link href="/admin/payments" className="block text-center text-xs text-blue-600 mt-3 pt-2 border-t border-gray-50 hover:underline">View all payments →</Link>
          </div>

        </div>
      </div>
    </PortalLayout>
  )
}
