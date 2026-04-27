import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'

export default async function BusinessNotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')
  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  const notifications = await prisma.notification.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: 'desc' }, take: 30,
  })
  return (
    <PortalLayout bizCredits={biz?.credits ?? 0}>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Notifications</h1>
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {notifications.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No notifications yet</div>}
          {notifications.map(n => (
            <div key={n.id} className="px-4 py-3">
              <div className="text-xs font-medium text-gray-700">{n.title || n.type}</div>
              {n.body && <div className="text-xs text-gray-400 mt-0.5">{n.body}</div>}
              <div className="text-[10px] text-gray-300 mt-1">{new Date(n.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })}</div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
