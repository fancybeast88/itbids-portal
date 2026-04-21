import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'

export default async function BusinessNotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'business') redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  })

  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Notifications</h1>
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {notifications.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No notifications yet</div>
          )}
          {notifications.map((n: any) => (
            <div key={n.id} className={`flex gap-3 px-4 py-3.5 ${!n.isRead ? 'bg-blue-50/40' : ''}`}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-400" />
              <div>
                {n.title && <div className="text-xs font-medium text-gray-700 mb-0.5">{n.title}</div>}
                <div className="text-xs text-gray-600 leading-relaxed">{n.body}</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
