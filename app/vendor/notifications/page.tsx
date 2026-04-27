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
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Notifications</h1>
          <p className="text-xs text-gray-400 mt-0.5">Latest updates about RFQs, quotes, and credits</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {notifications.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No notifications yet</div>
          )}
          {notifications.map((n) => (
            <div key={n.id} className="p-4 flex items-start gap-3">
              <span className={"w-2.5 h-2.5 rounded-full mt-1.5 " + (typeColor[n.type] || 'bg-gray-300')} />
              <div className="min-w-0">
                <div className="text-sm text-gray-700">{n.title}</div>
                {n.body && <div className="text-xs text-gray-500 mt-0.5">{n.body}</div>}
                <div className="text-[11px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString('en-PK')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
