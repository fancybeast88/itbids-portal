import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import CreditTopup from '@/components/vendor/CreditTopup'

export default async function CreditsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'vendor') redirect('/login')
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/login')

  const txns = await prisma.creditTransaction.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const packages = await prisma.creditPackage.findMany({ where: { isActive: true }, orderBy: { credits: 'asc' } })

  return (
    <PortalLayout credits={vendor.credits}>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-1">Buy Credits</h1>
        <p className="text-xs text-gray-400 mb-6">Current balance: <strong>{vendor.credits} credits</strong></p>
        <CreditTopup packages={packages} transactions={txns} vendorEmail={session.user.email!} />
      </div>
    </PortalLayout>
  )
}
