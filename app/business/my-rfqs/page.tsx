import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'

const statusColor: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-500',
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

export default async function MyRFQsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')
  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) redirect('/login')

  const rfqs = await prisma.rfq.findMany({
    where: { businessId: biz.id },
    include: {
      quotes: {
        select: { id: true, status: true, totalAmount: true, vendor: { select: { companyName: true } } }
      },
      _count: { select: { unlocks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <PortalLayout bizCredits={biz.credits}>
</PortalLayout>
  )
}
