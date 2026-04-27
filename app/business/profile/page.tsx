import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import ChangePasswordForm from '@/components/ChangePasswordForm'

export default async function BusinessProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') redirect('/login')
  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) redirect('/login')
  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6 max-w-2xl space-y-5">
        <h1 className="text-lg font-semibold text-gray-800">Profile</h1>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Company info</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Company name',biz.companyName],['Contact person',biz.contactPerson],['Phone',biz.phone||'—'],['City',biz.city||'—'],['NTN / CNIC',biz.ntn||'—'],['Email',session.user?.email||'—']].map(([l,v]) => (
              <div key={l}><div className="text-gray-400 mb-0.5">{l}</div><div className="font-medium text-gray-800">{v}</div></div>
            ))}
          </div>
        </div>
        <ChangePasswordForm />
      </div>
    </PortalLayout>
  )
}
