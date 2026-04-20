import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PortalLayout from '@/components/PortalLayout'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'admin') redirect('/login')

  const [rfqPending, vendorPending, bizPending, paymentPending, totalRevenue, recentTxns] = await Promise.all([
    prisma.rfq.count({ where: { status: 'pending' } }),
    prisma.user.count({ where: { role: 'vendor', status: 'pending' } }),
    prisma.user.count({ where: { role: 'business', status: 'pending' } }),
    prisma.creditTransaction.count({ where: { status: 'pending', type: 'purchase' } }),
    prisma.creditTransaction.aggregate({ where: { status: 'confirmed', type: 'purchase' }, _sum: { amountPkr: true } }),
    prisma.creditTransaction.findMany({ where: { type: 'purchase' }, include: { vendor: { select: { companyName: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ])

  const stats = [
    { label: 'Pending RFQs',     value: rfqPending,    color: 'text-amber-600',  href: '/admin/rfqs' },
    { label: 'Pending vendors',  value: vendorPending, color: 'text-blue-600',   href: '/admin/users' },
    { label: 'Pending businesses', value: bizPending,  color: 'text-blue-600',   href: '/admin/users' },
    { label: 'Pending payments', value: paymentPending, color: 'text-amber-600', href: '/admin/payments' },
    { label: 'Total revenue (PKR)', value: `${(totalRevenue._sum.amountPkr || 0).toLocaleString('en-PK')}`, color: 'text-green-600' },
  ]

  return (
    <PortalLayout>
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-800 mb-5">Admin Dashboard</h1>

        <div className="grid grid-cols-5 gap-3 mb-6">
          {stats.map((s: any) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-600 mb-3">Recent credit purchases</div>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Vendor</th>
              <th className="text-left pb-2 font-medium">Credits</th>
              <th className="text-left pb-2 font-medium">Amount</th>
              <th className="text-left pb-2 font-medium">Method</th>
              <th className="text-left pb-2 font-medium">Date</th>
              <th className="text-left pb-2 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {recentTxns.map((t: any) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-700">{t.vendor.companyName}</td>
                  <td className="py-2 text-green-600">+{t.credits}</td>
                  <td className="py-2">PKR {(t.amountPkr || 0).toLocaleString('en-PK')}</td>
                  <td className="py-2 text-gray-400 capitalize">{t.paymentMethod || '—'}</td>
                  <td className="py-2 text-gray-400">{new Date(t.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</td>
                  <td className="py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'confirmed' ? 'bg-green-50 text-green-700' : t.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalLayout>
  )
}
