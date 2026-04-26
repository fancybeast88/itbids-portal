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
    <div className="mx-6 mb-6 rounded-xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 relative">
          <div className="absolute top-2 right-3 text-[9px] font-bold text-amber-400 uppercase tracking-widest">Sponsored</div>
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

