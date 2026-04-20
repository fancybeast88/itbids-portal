import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import PostRFQForm from '@/components/business/PostRFQForm'

export default async function PostRFQPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'business') redirect('/login')
  const biz = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } })
  if (!biz) redirect('/login')
  return (
    <PortalLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-800 mb-1">Post a New RFQ</h1>
        <p className="text-xs text-gray-400 mb-6">Fill in the details below. Your RFQ will be reviewed by our admin team before going live.</p>
        <PostRFQForm />
      </div>
    </PortalLayout>
  )
}
