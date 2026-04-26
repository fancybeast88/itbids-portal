import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import BusinessCreditTopup from '@/components/business/BusinessCreditTopup'

export default async function BusinessCreditsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')

  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) redirect('/login')

  const packages = await prisma.creditPackage.findMany({ where: { isActive: true }, orderBy: { credits: 'asc' } })
  const transactions = await prisma.businessCreditTransaction.findMany({
    where: { bizId: biz.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  const settings = await prisma.globalSettings.findUnique({ where: { id: 'singleton' } })
  const postFee = settings?.rfqPostFee ?? 50

  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-1">Buy Credits</h1>
        <p className="text-xs text-gray-400 mb-6">
          Current balance: <strong>{biz.credits} credits</strong> · Posting an RFQ costs <strong>{postFee} credits</strong>
        </p>
        <BusinessCreditTopup packages={packages} transactions={transactions} bizCredits={biz.credits} postFee={postFee} bizEmail={session.user.email!} bizId={biz.id} />
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
