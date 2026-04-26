import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminAdsManager from '@/components/admin/AdminAdsManager'

export default async function AdminAdsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/login')
  const ads = await prisma.advertisement.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <PortalLayout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-gray-800">Advertisement Manager</h1>
          <p className="text-xs text-gray-400 mt-0.5">Create and manage banners shown across the vendor and business portal</p>
        </div>
        <AdminAdsManager ads={ads} />
      </div>
    </PortalLayout>
  )
}
