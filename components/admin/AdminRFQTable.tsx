'use client'
import { useState } from 'react'

const statusColor: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  draft:    'bg-gray-100 text-gray-500',
}

export default function AdminRFQTable({ rfqs: initial, costs }: { rfqs: any[]; costs: any[] }) {
  const [rfqs, setRFQs]   = useState(initial)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [costEdits, setCostEdits] = useState<Record<string, number>>({})

  const costMap = Object.fromEntries(costs.map(c => [c.category, c.cost]))
  const filtered = filter === 'all' ? rfqs : rfqs.filter(r => r.status === filter)

  async function approve(id: string) {
    setLoading(id)
    const res = await fetch(`/api/admin/rfqs/${id}/approve`, { method: 'POST' })
    setLoading(null)
    if (res.ok) setRFQs(rs => rs.map(r => r.id === id ? { ...r, status: 'approved' } : r))
    else alert('Failed to approve')
  }

  async function reject(id: string) {
    const reason = prompt('Reason for rejection (optional):')
    setLoading(id)
    const res = await fetch(`/api/admin/rfqs/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setLoading(null)
    if (res.ok) setRFQs(rs => rs.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    else alert('Failed to reject')
  }

  async function updateCreditCost(id: string) {
    const cost = costEdits[id]
    if (!cost || cost < 1) return
    const res = await fetch(`/api/admin/rfqs/${id}/credit-cost`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creditCost: cost }),
    })
    if (res.ok) {
      setRFQs(rs => rs.map(r => r.id === id ? { ...r, creditCost: cost } : r))
      alert('Credit cost updated!')
    } else alert('Failed to update')
  }

  return (
    <>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && (
              <span className="ml-1.5 bg-amber-400 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {rfqs.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Brand</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Unlock credits</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No RFQs found</td></tr>
            )}
            {filtered.map(rfq => (
              <>
                <tr key={rfq.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => setExpanded(expanded === rfq.id ? null : rfq.id)}>
                  <td className="px-4 py-3 text-gray-700 font-medium">{rfq.title}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{rfq.brand}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{rfq.business?.companyName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <input type="number" min="1" max="20"
                        defaultValue={rfq.creditCost || costMap[rfq.category] || 2}
                        onChange={e => setCostEdits(prev => ({ ...prev, [rfq.id]: +e.target.value }))}
                        className="w-14 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-center" />
                      <span className="text-gray-400">cr</span>
                      <button onClick={() => updateCreditCost(rfq.id)}
                        className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        Set
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[rfq.status]}`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {rfq.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => approve(rfq.id)} disabled={loading === rfq.id}
                          className="text-[10px] px-2.5 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200 disabled:opacity-50">
                          {loading === rfq.id ? '…' : 'Approve'}
                        </button>
                        <button onClick={() => reject(rfq.id)} disabled={loading === rfq.id}
                          className="text-[10px] px-2.5 py-1 bg-red-50 text-red-700 rounded-lg border border-red-200 disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {expanded === rfq.id && (
                  <tr key={rfq.id + '-exp'} className="border-b border-gray-100 bg-blue-50/20">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="text-xs text-gray-600 space-y-1.5">
                        <div className="flex gap-6">
                          <span><strong>Qty:</strong> {rfq.quantity || '—'}</span>
                          <span><strong>Budget:</strong> PKR {rfq.budgetPkr ? Number(rfq.budgetPkr).toLocaleString('en-PK') : '—'}</span>
                          <span><strong>City:</strong> {rfq.city || '—'}</span>
                          <span><strong>Category:</strong> {rfq.category}</span>
                          <span><strong>Posted:</strong> {new Date(rfq.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {rfq.specs && (
                          <div className="mt-2 text-gray-500 leading-relaxed bg-white border border-gray-100 rounded p-2">
                            {rfq.specs}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
