import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import VendorRFQList from '@/components/vendor/VendorRFQList'

export default async function VendorRFQsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') redirect('/login')
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!vendor) redirect('/login')
  const rfqs = await prisma.rfq.findMany({
    where: { status: 'approved' },
    include: { business: { select: { companyName: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const unlocks = await prisma.rfqUnlock.findMany({ where: { vendorId: vendor.id } })
  const unlockedIds = new Set(unlocks.map(u => u.rfqId))
  const rfqsWithStatus = rfqs.map(r => ({ ...r, isUnlocked: unlockedIds.has(r.id), budgetPkr: r.budgetPkr?.toString() }))
  return (
    <PortalLayout credits={vendor.credits}>
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Browse RFQs</h1>
        <VendorRFQList rfqs={rfqsWithStatus} vendorCredits={vendor.credits} />
      </div>
    </PortalLayout>
  )
}
