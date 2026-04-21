import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'

export default async function BusinessProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'business') redirect('/login')

  const biz = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { rfqs: true } } },
  })
  if (!biz) redirect('/login')

  return (
    <PortalLayout bizCredits={biz.credits}>
      <div className="p-6 max-w-md">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Profile</h1>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
              {biz.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-gray-800">{biz.companyName}</div>
              <div className="text-xs text-gray-400">{session.user.email}</div>
            </div>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Approved</span>
          </div>
          <table className="w-full text-xs">
            {[
              ['Contact', biz.contactPerson],
              ['Phone', biz.phone || '—'],
              ['City', biz.city || '—'],
              ['NTN', biz.ntn || '—'],
              ['RFQs posted', `${biz._count.rfqs}`],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-400 w-32">{label}</td>
                <td className="py-2 text-gray-700">{value}</td>
              </tr>
            ))}
          </table>
        </div>
      </div>
    </PortalLayout>
  )
}
