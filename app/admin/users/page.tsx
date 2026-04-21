import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminUserTable from '@/components/admin/AdminUserTable'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  const [vendors, businesses] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'vendor' },
      include: { vendorProfile: true },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.user.findMany({
      where: { role: 'business' },
      include: { businessProfile: true },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
  ])

  return (
    <PortalLayout>
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Users</h1>
        <AdminUserTable vendors={vendors} businesses={businesses} />
      </div>
    </PortalLayout>
  )
}
