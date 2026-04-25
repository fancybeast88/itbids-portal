import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  const [rfqStats, userStats, quoteStats, creditStats, recentRFQs, recentVendors, recentBiz, recentQuotes, recentTxns, topVendors, topBiz, globalSettings] = await Promise.all([
    prisma.rfq.groupBy({ by: ['status'], _count: true }),
    Promise.all([
      prisma.user.count({ where: { role: 'vendor' } }),
      prisma.user.count({ where: { role: 'vendor', status: 'pending' } }),
      prisma.user.count({ where: { role: 'vendor', status: 'approved' } }),
      prisma.user.count({ where: { role: 'business' } }),
      prisma.user.count({ where: { role: 'business', status: 'pending' } }),
      prisma.user.count({ where: { role: 'business', status: 'approved' } }),
    ]),
    prisma.quote.groupBy({ by: ['status'], _count: true }),
    Promise.all([
      prisma.creditTransaction.aggregate({ where: { status: 'confirmed', type: 'purchase' }, _sum: { amountPkr: true, credits: true }, _count: true }),
      prisma.creditTransaction.count({ where: { status: 'pending', type: 'purchase' } }),
    ]),
    prisma.rfq.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { business: { select: { companyName: true } } } }),
    prisma.user.findMany({ where: { role: 'vendor' }, orderBy: { createdAt: 'desc' }, take: 5, include: { vendorProfile: { select: { companyName: true, credits: true, city: true } } } }),
    prisma.user.findMany({ where: { role: 'business' }, orderBy: { createdAt: 'desc' }, take: 5, include: { businessProfile: { select: { companyName: true, credits: true, city: true } } } }),
    prisma.quote.findMany({ orderBy: { submittedAt: 'desc' }, take: 5, include: { vendor: { select: { companyName: true } }, rfq: { select: { title: true, business: { select: { companyName: true } } } } } }),
    prisma.creditTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { vendor: { select: { companyName: true } } } }),
    prisma.vendorProfile.findMany({ orderBy: { credits: 'desc' }, take: 5, include: { user: { select: { email: true, status: true } } } }),
    prisma.businessProfile.findMany({ include: { user: { select: { email: true, status: true } }, _count: { select: { rfqs: true } } }, orderBy: { credits: 'desc' }, take: 5 }),
    prisma.globalSettings.findUnique({ where: { id: 'singleton' } }),
  ])

  const rfqMap = Object.fromEntries(rfqStats.map(r => [r.status, r._count]))
  const quoteMap = Object.fromEntries(quoteStats.map(q => [q.status, q._count]))
  const [vendorTotal, vendorPending, vendorApproved, bizTotal, bizPending, bizApproved] = userStats
  const [txnStats, paymentPending] = creditStats

  const data = {
    overview: {
      rfqs: { total: Object.values(rfqMap).reduce((a:any,b:any)=>a+b,0), pending: rfqMap['pending']||0, approved: rfqMap['approved']||0, rejected: rfqMap['rejected']||0 },
      vendors: { total: vendorTotal, pending: vendorPending, approved: vendorApproved },
      businesses: { total: bizTotal, pending: bizPending, approved: bizApproved },
      quotes: { total: Object.values(quoteMap).reduce((a:any,b:any)=>a+b,0), submitted: quoteMap['submitted']||0, shortlisted: quoteMap['shortlisted']||0, won: quoteMap['won']||0 },
      revenue: { totalPkr: txnStats._sum.amountPkr||0, totalCredits: txnStats._sum.credits||0, transactions: txnStats._count, pending: paymentPending },
    },
    recentRFQs: recentRFQs.map(r => ({ ...r, budgetPkr: r.budgetPkr?.toString() })),
    recentVendors,
    recentBiz,
    recentQuotes: recentQuotes.map(q => ({ ...q, totalAmount: q.totalAmount.toString() })),
    recentTxns,
    topVendors,
    topBiz,
    postFee: globalSettings?.rfqPostFee ?? 50,
  }

  return (
    <PortalLayout>
      <AdminDashboardClient data={data} />
    </PortalLayout>
  )
}
