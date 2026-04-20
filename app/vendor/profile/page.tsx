import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'

export default async function VendorProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'vendor') redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { rfqUnlocks: true, quotes: true } },
    },
  })
  if (!vendor) redirect('/login')

  return (
    <PortalLayout credits={vendor.credits}>
      <div className="p-6 max-w-md">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Profile</h1>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
              {vendor.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-gray-800">{vendor.companyName}</div>
              <div className="text-xs text-gray-400">{session.user.email}</div>
            </div>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Approved</span>
          </div>
          <table className="w-full text-xs">
            {[
              ['Contact', vendor.contactPerson],
              ['Phone', vendor.phone || '—'],
              ['City', vendor.city || '—'],
              ['NTN', vendor.ntn || '—'],
              ['Partner level', vendor.partnerLevel || '—'],
              ['Brands', vendor.brands.join(', ') || '—'],
              ['Credits balance', `${vendor.credits}`],
              ['RFQs unlocked', `${vendor._count.rfqUnlocks}`],
              ['Quotes submitted', `${vendor._count.quotes}`],
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
