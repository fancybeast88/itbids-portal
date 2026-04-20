'use client'
import { useState } from 'react'

const methodBadge: Record<string, string> = {
  jazzcash:      'bg-red-50 text-red-700',
  easypaisa:     'bg-green-50 text-green-700',
  bank_transfer: 'bg-blue-50 text-blue-700',
}

export default function AdminPaymentsTable({ transactions: initial }: { transactions: any[] }) {
  const [txns, setTxns] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? txns : txns.filter(t => t.status === filter)

  async function confirmBank(id: string) {
    setLoading(id)
    const res = await fetch('/api/payments/bank/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: id }),
    })
    setLoading(null)
    if (res.ok) setTxns(ts => ts.map((t: any) => t.id === id ? { ...t, status: 'confirmed' } : t))
    else alert('Failed to confirm payment')
  }

  const totalConfirmed = txns.filter(t => t.status === 'confirmed').reduce((s, t) => s + (t.amountPkr || 0), 0)
  const totalPending = txns.filter(t => t.status === 'pending').reduce((s, t) => s + (t.amountPkr || 0), 0)

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-100 rounded-xl p-3">
          <div className="text-[10px] text-gray-400 mb-1">Total revenue confirmed</div>
          <div className="text-lg font-semibold text-green-600">PKR {totalConfirmed.toLocaleString('en-PK')}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-3">
          <div className="text-[10px] text-gray-400 mb-1">Pending confirmation</div>
          <div className="text-lg font-semibold text-amber-600">PKR {totalPending.toLocaleString('en-PK')}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-3">
          <div className="text-[10px] text-gray-400 mb-1">Total transactions</div>
          <div className="text-lg font-semibold text-gray-700">{txns.length}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'confirmed', 'failed'].map((f: any) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && txns.filter(t => t.status === 'pending').length > 0 && (
              <span className="ml-1 bg-amber-400 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {txns.filter(t => t.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Vendor</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Credits</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Amount</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Method</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Date</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No transactions found</td></tr>
            )}
            {filtered.map((t: any) => (
              <tr key={t.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-gray-700">{t.vendor?.companyName}</div>
                  <div className="text-[10px] text-gray-400">{t.vendor?.user?.email}</div>
                </td>
                <td className="px-4 py-2.5 text-green-600 font-medium">+{t.credits}</td>
                <td className="px-4 py-2.5 text-gray-700">PKR {(t.amountPkr || 0).toLocaleString('en-PK')}</td>
                <td className="px-4 py-2.5">
                  {t.paymentMethod ? (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${methodBadge[t.paymentMethod] || 'bg-gray-100 text-gray-500'}`}>
                      {t.paymentMethod.replace('_', ' ')}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    t.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                    t.status === 'pending'   ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {t.status === 'pending' && t.paymentMethod === 'bank_transfer' && (
                    <button onClick={() => confirmBank(t.id)} disabled={loading === t.id}
                      className="text-[10px] px-2.5 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200 disabled:opacity-50">
                      {loading === t.id ? '…' : 'Confirm'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
