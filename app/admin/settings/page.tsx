import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminSettingsForm from '@/components/admin/AdminSettingsForm'

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'admin') redirect('/login')

  const [costs, packages, emailSettings] = await Promise.all([
    prisma.categoryCreditCost.findMany({ orderBy: { category: 'asc' } }),
    prisma.creditPackage.findMany({ where: { isActive: true }, orderBy: { credits: 'asc' } }),
    prisma.emailSettings.findMany(),
  ])

  return (
    <PortalLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Settings</h1>
        <AdminSettingsForm costs={costs} packages={packages} emailSettings={emailSettings} />
      </div>
    </PortalLayout>
  )
}
