import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import PostRFQForm from '@/components/business/PostRFQForm'

export default async function PostRFQPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')

  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) redirect('/login')

  const settings = await prisma.globalSettings.findUnique({ where: { id: 'singleton' } })
  const postFee = settings?.rfqPostFee ?? 50

  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-1">Post a New RFQ</h1>
        <p className="text-xs text-gray-400 mb-6">
          Posting costs <strong>{postFee} credits</strong> · Your balance: <strong>{biz.credits} credits</strong>
        </p>
        <PostRFQForm postFee={postFee} bizCredits={biz.credits} />
      </div>
    </PortalLayout>
  )
}
