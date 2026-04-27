import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import VendorRFQList from '@/components/vendor/VendorRFQList'

export default async function VendorRFQsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'vendor') redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/login')

  const rfqs = await prisma.rfq.findMany({
    where: { status: 'approved' },
    include: {
      business: { select: { companyName: true, city: true } },
      unlocks: { where: { vendorId: vendor.id }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rfqsWithUnlock = rfqs.map((r: any) => ({ ...r, isUnlocked: r.unlocks.length > 0 }))

  return (
    <PortalLayout credits={vendor.credits}>
</PortalLayout>
  )
}
