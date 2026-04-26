import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import VendorRFQList from '@/components/vendor/VendorRFQList'

export default async function VendorRFQsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'vendor') redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/login')

  const rfqs = await prisma.rfq.findMany({
    where: { status: 'approved' },
    include: {
      business: { select: { companyName: true, city: true } },
      unlocks: { where: { vendorId: vendor.id }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rfqsWithUnlock = rfqs.map((r: any) => ({ ...r, isUnlocked: r.unlocks.length > 0 }))

  return (
    <PortalLayout credits={vendor.credits}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Browse RFQs</h1>
            <p className="text-xs text-gray-400 mt-0.5">{rfqs.length} active RFQs available</p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-semibold text-gray-800">{rfqs.length}</div>
              <div className="text-gray-400">Available</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-semibold text-green-600">{rfqsWithUnlock.filter(r => r.isUnlocked).length}</div>
              <div className="text-gray-400">Unlocked</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-semibold text-blue-600">{vendor.credits}</div>
              <div className="text-gray-400">Credits</div>
            </div>
          </div>
        </div>
        <VendorRFQList rfqs={rfqsWithUnlock} vendorCredits={vendor.credits} />
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
    </PortalLayout>
  )
}
