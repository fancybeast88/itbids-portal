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
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Notifications</h1>
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {notifications.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No notifications yet</div>
          )}
          {notifications.map((n: any) => (
            <div key={n.id} className={`flex gap-3 px-4 py-3.5 ${!n.isRead ? 'bg-blue-50/40' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColor[n.type] || 'bg-gray-300'}`} />
              <div className="flex-1">
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
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 11V5l5-4 5 4v6H7V7H5v4H1z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-sm font-bold text-amber-700">TO LET - Advertisement Space</div>
          </div>
          <div className="text-xs text-amber-800 leading-relaxed mb-3">
            Advertise your IT products and services here and reach hundreds of verified IT vendors and businesses across Pakistan through Lead Vault.
          </div>
          <div className="bg-amber-100 rounded-lg px-3 py-2 inline-block">
            <div className="text-[10px] text-amber-600 mb-0.5">To book this space, email us at</div>
            <div className="text-sm font-bold text-amber-800">advert@leadvault.pk</div>
          </div>
        </div>
    <div className="mx-6 mb-6 rounded-xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 relative">
          <div className="absolute top-2 right-3 text-[9px] font-bold text-amber-400 uppercase tracking-widest">Sponsored</div>
          <div className="text-sm font-bold text-amber-700 mb-1">TO LET - Advertisement Space</div>
          <div className="text-xs text-amber-800 leading-relaxed mb-3">Reach hundreds of verified IT vendors and businesses across Pakistan through Lead Vault.</div>
          <div className="bg-amber-100 rounded-lg px-3 py-2 inline-block">
            <div className="text-[10px] text-amber-600 mb-0.5">Book this space</div>
            <div className="text-sm font-bold text-amber-800">advert@leadvault.pk</div>
          </div>
        </div>
    </PortalLayout>
  )
}
