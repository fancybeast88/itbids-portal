'use client'
import { useState } from 'react'

const statusColor: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  approved:  'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-700',
  suspended: 'bg-gray-100 text-gray-500',
}

function UserTable({ users, type }: { users: any[]; type: 'vendor' | 'business' }) {
  const [list, setList] = useState(users)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? list : list.filter(u => u.status === filter)

  async function act(userId: string, action: 'approve' | 'reject') {
    setLoading(userId)
    const res = await fetch(`/api/admin/users/${userId}/${action}`, { method: 'POST' })
    setLoading(null)
    if (res.ok) setList(l => l.map((u: any) => u.id === userId ? { ...u, status: action === 'approve' ? 'approved' : 'rejected' } : u))
    else alert('Action failed')
  }

  const profile = (u: any) => type === 'vendor' ? u.vendorProfile : u.businessProfile

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {type === 'vendor' ? 'Vendors' : 'Businesses'}
          <span className="ml-2 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">{list.length}</span>
        </div>
        <div className="flex gap-1.5">
          {['all','pending','approved','rejected'].map((f: any) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Company</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Email</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">City</th>
              {type === 'vendor' && <th className="text-left px-4 py-2.5 font-medium text-gray-400">Brands</th>}
              {type === 'vendor' && <th className="text-left px-4 py-2.5 font-medium text-gray-400">Credits</th>}
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Joined</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No users found</td></tr>
            )}
            {filtered.map((u: any) => {
              const p = profile(u)
              return (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-gray-700">{p?.companyName || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500">{u.email}</td>
                  <td className="px-4 py-2.5 text-gray-400">{p?.city || '—'}</td>
                  {type === 'vendor' && (
                    <td className="px-4 py-2.5 text-gray-400">{p?.brands?.join(', ') || '—'}</td>
                  )}
                  {type === 'vendor' && (
                    <td className="px-4 py-2.5 text-gray-600">{p?.credits ?? 0}</td>
                  )}
                  <td className="px-4 py-2.5 text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[u.status]}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => act(u.id, 'approve')} disabled={loading === u.id}
                          className="text-[10px] px-2.5 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200 disabled:opacity-50">
                          {loading === u.id ? '…' : 'Approve'}
                        </button>
                        <button onClick={() => act(u.id, 'reject')} disabled={loading === u.id}
                          className="text-[10px] px-2.5 py-1 bg-red-50 text-red-700 rounded-lg border border-red-200 disabled:opacity-50">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminUserTable({ vendors, businesses }: { vendors: any[]; businesses: any[] }) {
  return (
    <>
      <UserTable users={vendors} type="vendor" />
      <UserTable users={businesses} type="business" />
    </>
  )
}
