import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminQuotesTable from '@/components/admin/AdminQuotesTable'

export default async function AdminQuotesPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  const quotes = await prisma.quote.findMany({
    include: {
      rfq: {
        include: {
          business: { select: { companyName: true, city: true, phone: true } },
        },
      },
      vendor: {
        select: { companyName: true, contactPerson: true, phone: true, city: true, partnerLevel: true },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  const stats = {
    total:       quotes.length,
    submitted:   quotes.filter(q => q.status === 'submitted').length,
    shortlisted: quotes.filter(q => q.status === 'shortlisted').length,
    won:         quotes.filter(q => q.status === 'won').length,
    totalValue:  quotes.reduce((s, q) => s + Number(q.totalAmount), 0),
  }

  return (
    <PortalLayout>
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">All Submitted Quotes</h1>

        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total quotes',  value: stats.total },
            { label: 'Pending',       value: stats.submitted,   color: 'text-amber-600' },
            { label: 'Shortlisted',   value: stats.shortlisted, color: 'text-blue-600' },
            { label: 'Won',           value: stats.won,         color: 'text-green-600' },
            { label: 'Total value',   value: `PKR ${Math.round(stats.totalValue / 1000)}K`, color: 'text-gray-700' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={`text-xl font-semibold ${s.color || 'text-gray-800'}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <AdminQuotesTable quotes={quotes} />
      </div>
    </PortalLayout>
  )
}
