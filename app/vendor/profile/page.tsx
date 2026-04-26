import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import ChangePasswordForm from '@/components/ChangePasswordForm'

export default async function VendorProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') redirect('/login')
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!vendor) redirect('/login')

  return (
    <PortalLayout credits={vendor.credits}>
      <div className="p-6 max-w-2xl space-y-5">
        <h1 className="text-lg font-semibold text-gray-800">Profile</h1>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Company info</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Company name', vendor.companyName],['Contact person', vendor.contactPerson],['Phone', vendor.phone||'—'],['City', vendor.city||'—'],['NTN / CNIC', vendor.ntn||'—'],['Partner level', vendor.partnerLevel||'—'],['Brands', vendor.brands?.join(', ')||'—'],['Email', session.user?.email||'—']].map(([l,v]) => (
              <div key={l}><div className="text-gray-400 mb-0.5">{l}</div><div className="font-medium text-gray-800">{v}</div></div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-400">Credit balance</div>
            <div className="text-xl font-bold text-blue-600">{vendor.credits} credits</div>
          </div>
        </div>
        <ChangePasswordForm />
      </div>
    </PortalLayout>
  )
}

