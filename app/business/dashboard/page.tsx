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
</PortalLayout>
  )
}
