import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'
import AdminQuotesTable from '@/components/admin/AdminQuotesTable'
import { PageHeader, StatCard, StatGrid } from '@/components/ui'

export default async function AdminQuotesPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  const [quotes, quoteStatusStats, quoteTotals] = await Promise.all([
    prisma.quote.findMany({
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
      take: 200,
    }),
    prisma.quote.groupBy({ by: ['status'], _count: true }),
    prisma.quote.aggregate({ _sum: { totalAmount: true }, _count: true }),
  ])

  const quoteMap = Object.fromEntries(quoteStatusStats.map(q => [q.status, q._count]))
  const stats = {
    total:       quoteTotals._count,
    submitted:   quoteMap['submitted'] || 0,
    shortlisted: quoteMap['shortlisted'] || 0,
    won:         quoteMap['won'] || 0,
    totalValue:  Number(quoteTotals._sum.totalAmount || 0),
  }

  return (
    <PortalLayout>
      <div className="p-6">
        <PageHeader title="All Submitted Quotes" subtitle="Moderate vendor responses and track quote outcomes." />

        <div className="mt-5 mb-6">
          <StatGrid>
          {[
            { label: 'Total quotes',  value: stats.total },
            { label: 'Pending',       value: stats.submitted,   color: 'text-amber-600' },
            { label: 'Shortlisted',   value: stats.shortlisted, color: 'text-blue-600' },
            { label: 'Won',           value: stats.won,         color: 'text-green-600' },
            { label: 'Total value',   value: `PKR ${Math.round(stats.totalValue / 1000)}K`, color: 'text-gray-700' },
          ].map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
          ))}
          </StatGrid>
        </div>

        <AdminQuotesTable quotes={quotes} />
      </div>
    </PortalLayout>
  )
}
