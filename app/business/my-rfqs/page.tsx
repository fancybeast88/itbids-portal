import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'

const statusColor: Record<string, string> = {
  draft:'bg-gray-100 text-gray-500', pending:'bg-amber-50 text-amber-700',
  approved:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700',
}

export default async function MyRFQsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')
  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) redirect('/login')

  const rfqs = await prisma.rfq.findMany({
    where: { businessId: biz.id },
    include: { quotes: { select: { id: true, status: true, totalAmount: true, vendor: { select: { companyName: true } } } }, _count: { select: { unlocks: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-800">My RFQs</h1>
          <Link href="/business/post-rfq" className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg">+ Post RFQ</Link>
        </div>
        {rfqs.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
            No RFQs yet. <Link href="/business/post-rfq" className="text-blue-600">Post your first RFQ</Link>
          </div>
        )}
        <div className="space-y-4">
          {rfqs.map(rfq => (
            <div key={rfq.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-medium text-sm text-gray-800">{rfq.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{rfq.brand} · {rfq.category} · {rfq.city}</div>
                </div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ' + (statusColor[rfq.status] || 'bg-gray-100 text-gray-500')}>
                  {rfq.status}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mb-3">
                <span>{rfq._count.unlocks} unlocked</span>
                <span>{rfq.quotes.length} quotes</span>
                <span>Unlock: {rfq.creditCost} cr</span>
              </div>
              {rfq.quotes.length > 0 && (
                <div className="border-t border-gray-50 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-medium text-gray-400 uppercase">Quotes</div>
                    <Link href={'/business/my-rfqs/' + rfq.id} className="text-[10px] px-2.5 py-1 bg-blue-600 text-white rounded-lg">View details + PDF</Link>
                  </div>
                  {rfq.quotes.slice(0, 3).map(q => (
                    <div key={q.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">{q.vendor.companyName}</span>
                      <span className="text-xs text-gray-500">PKR {Number(q.totalAmount).toLocaleString('en-PK')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
