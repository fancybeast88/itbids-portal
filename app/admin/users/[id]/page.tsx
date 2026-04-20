import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminEditUserForm from '@/components/admin/AdminEditUserForm'

export default async function AdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id },
    include: { vendorProfile: true, businessProfile: true },
  })
  if (!user) redirect('/admin/users')

  return (
    <PortalLayout>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <a href="/admin/users" className="text-xs text-gray-400 hover:text-gray-600">← Back to users</a>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold text-gray-800">Edit user</h1>
        </div>
        <AdminEditUserForm user={user} />
      </div>
    </PortalLayout>
  )
}
