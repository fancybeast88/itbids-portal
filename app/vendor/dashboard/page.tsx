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
</PortalLayout>
  )
}
