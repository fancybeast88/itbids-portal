import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'

const typeColor: Record<string, string> = {
  'rfq-approved':      'bg-green-400',
  'rfq-unlocked':      'bg-blue-400',
  'quote-shortlisted': 'bg-blue-600',
  'credits-added':     'bg-green-600',
  'account-approved':  'bg-teal-500',
}

export default async function VendorNotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'vendor') redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  })

  return (
    <PortalLayout credits={vendor.credits}>
</PortalLayout>
  )
}
