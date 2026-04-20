import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminRFQTable from '@/components/admin/AdminRFQTable'

export default async function AdminRFQsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'admin') redirect('/login')

  const rfqs = await prisma.rfq.findMany({
    include: { business: { select: { companyName: true, city: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  const costs = await prisma.categoryCreditCost.findMany()

  return (
    <PortalLayout>
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">RFQ Approvals</h1>
        <AdminRFQTable rfqs={rfqs} costs={costs} />
      </div>
    </PortalLayout>
  )
}
