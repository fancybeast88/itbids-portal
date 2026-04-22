import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import BusinessQuoteDetails from '@/components/business/BusinessQuoteDetails'
import Link from 'next/link'

export default async function RFQQuotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')

  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) redirect('/login')

  const rfq = await prisma.rfq.findUnique({
    where: { id, businessId: biz.id },
    include: {
      quotes: {
        include: {
          vendor: {
            select: { companyName: true, contactPerson: true, phone: true, city: true, partnerLevel: true, brands: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      },
      _count: { select: { unlocks: true } },
    },
  })

  if (!rfq) redirect('/business/my-rfqs')

  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/business/my-rfqs" className="text-xs text-gray-400 hover:text-gray-600">← My RFQs</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold text-gray-800">{rfq.title}</h1>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div><div className="text-gray-400 mb-0.5">Brand</div><div className="font-medium">{rfq.brand}</div></div>
            <div><div className="text-gray-400 mb-0.5">Category</div><div className="font-medium">{rfq.category}</div></div>
            <div><div className="text-gray-400 mb-0.5">Budget</div><div className="font-medium">PKR {rfq.budgetPkr ? Number(rfq.budgetPkr).toLocaleString('en-PK') : '—'}</div></div>
            <div><div className="text-gray-400 mb-0.5">Quotes received</div><div className="font-medium text-blue-600">{rfq.quotes.length}</div></div>
          </div>
        </div>
        {rfq.quotes.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
            No quotes received yet. Vendors will submit quotes after unlocking your RFQ.
          </div>
        ) : (
          <BusinessQuoteDetails quotes={rfq.quotes} rfqTitle={rfq.title} bizName={biz.companyName} />
        )}
      </div>
    </PortalLayout>
  )
}
