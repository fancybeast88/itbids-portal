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
    </PortalLayout>
  )
}
