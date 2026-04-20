import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import QuoteForm from '@/components/vendor/QuoteForm'

export default async function NewQuotePage({ searchParams }: { searchParams: { rfqId?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'vendor') redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/login')

  if (!searchParams.rfqId) redirect('/vendor/rfqs')

  const unlock = await prisma.rfqUnlock.findUnique({
    where: { rfqId_vendorId: { rfqId: searchParams.rfqId, vendorId: vendor.id } },
  })
  if (!unlock) redirect('/vendor/rfqs')

  const rfq = await prisma.rfq.findUnique({
    where: { id: searchParams.rfqId },
    include: { business: { select: { companyName: true, city: true } } },
  })
  if (!rfq) redirect('/vendor/rfqs')

  return (
    <PortalLayout credits={vendor.credits}>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-1">Submit Quote</h1>
        <p className="text-xs text-gray-400 mb-6">Responding to: {rfq.title}</p>
        <QuoteForm rfq={rfq} vendor={vendor} />
      </div>
    </PortalLayout>
  )
}
