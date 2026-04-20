import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminPaymentsTable from '@/components/admin/AdminPaymentsTable'

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'admin') redirect('/login')

  const transactions = await prisma.creditTransaction.findMany({
    where: { type: 'purchase' },
    include: { vendor: { select: { companyName: true, user: { select: { email: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <PortalLayout>
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Payments</h1>
        <AdminPaymentsTable transactions={transactions} />
      </div>
    </PortalLayout>
  )
}
