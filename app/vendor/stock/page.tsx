'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/PortalLayout'
import Link from 'next/link'
import { PageHeader } from '@/components/ui'

const BRANDS = ['Dell','HP','Fortinet','Cisco','Lenovo','IBM','Huawei','Aruba','Other']
const CATS   = ['Laptops','Desktops','Servers','Networking','Firewall','Storage','Other']
const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta']

const typeColor: Record<string, string> = {
  available: 'bg-green-50 text-green-700 border-green-200',
  upcoming:  'bg-blue-50 text-blue-700 border-blue-200',
}

export default function VendorStockPage() {
  const [items, setItems]   = useState<any[]>([])
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState<'list'|'add'>('list')
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]   = useState('')

  const [form, setForm] = useState({
    type: 'available', brand: 'Dell', category: 'Laptops',
    model: '', description: '', quantity: '', unitPricePkr: '',
    condition: 'new', city: 'Karachi', expectedDate: '',
  })

  useEffect(() => {
    fetch('/api/vendor/stock').then(r => r.json()).then(d => {
      setItems(Array.isArray(d) ? d : [])
      setLoading(false)
    })
    fetch('/api/vendor/quotes').then(r => r.json()).then(d => setCredits(d.credits || 0))
  }, [])

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit() {
    if (!form.model || !form.quantity) { setError('Model and quantity are required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/vendor/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity), unitPricePkr: form.unitPricePkr || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setSuccess('Stock item added!')
      setForm({ type:'available', brand:'Dell', category:'Laptops', model:'', description:'', quantity:'', unitPricePkr:'', condition:'new', city:'Karachi', expectedDate:'' })
      const updated = await fetch('/api/vendor/stock').then(r => r.json())
      setItems(Array.isArray(updated) ? updated : [])
      setTimeout(() => { setSuccess(''); setTab('list') }, 1500)
    } else setError(data.error || 'Failed to add')
  }

  async function remove(id: string) {
    if (!confirm('Remove this stock item?')) return
    await fetch('/api/vendor/stock/' + id, { method: 'DELETE' })
    setItems(items.filter(i => i.id !== id))
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  return (
    <PortalLayout credits={credits}>
      <div className="p-6 space-y-5">
        <PageHeader
          title="My Stock"
          subtitle="Publish current and upcoming inventory for business buyers"
          action={
            <div className="flex gap-2">
              <button onClick={() => setTab('list')} className={'text-xs px-3 py-2 rounded-lg border ' + (tab === 'list' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200')}>
                Stock list
              </button>
              <button onClick={() => setTab('add')} className={'text-xs px-3 py-2 rounded-lg border ' + (tab === 'add' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200')}>
                + Add stock
              </button>
            </div>
          }
        />

        {tab === 'list' && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {['all', 'available', 'upcoming'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={'text-xs px-3 py-1.5 rounded-lg border capitalize ' + (filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200')}>
                    {f}
                  </button>
                ))}
              </div>
              <Link href="/vendor/rfqs" className="text-xs text-blue-600">Browse RFQs</Link>
            </div>

            {loading && <div className="text-sm text-gray-400 text-center py-8">Loading stock...</div>}
            {!loading && filtered.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-8">No stock items found for this filter.</div>
            )}
            {!loading && filtered.length > 0 && (
              <div className="space-y-2">
                {filtered.map((i) => (
                  <div key={i.id} className="border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-800">{i.brand} {i.model}</div>
                        <span className={'text-[10px] px-2 py-0.5 rounded-full border ' + (typeColor[i.type] || 'bg-gray-50 text-gray-600 border-gray-200')}>
                          {i.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{i.category} • Qty: {i.quantity} • {i.city || 'N/A'}</div>
                      {i.description && <div className="text-xs text-gray-400 mt-1">{i.description}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-700">
                        {i.unitPricePkr ? `PKR ${Number(i.unitPricePkr).toLocaleString('en-PK')}` : 'Price on request'}
                      </div>
                      <button onClick={() => remove(i.id)} className="text-xs text-red-600 mt-2">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Type</label>
                <select value={form.type} onChange={e => setF('type', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="available">Available</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Brand</label>
                <select value={form.brand} onChange={e => setF('brand', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Category</label>
                <select value={form.category} onChange={e => setF('category', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Model *</label>
                <input value={form.model} onChange={e => setF('model', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Quantity *</label>
                <input type="number" min={1} value={form.quantity} onChange={e => setF('quantity', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Unit Price (PKR)</label>
                <input type="number" min={0} value={form.unitPricePkr} onChange={e => setF('unitPricePkr', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">City</label>
                <select value={form.city} onChange={e => setF('city', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Expected Date</label>
                <input type="date" value={form.expectedDate} onChange={e => setF('expectedDate', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setF('description', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>
            {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</div>}
            {success && <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-3">{success}</div>}
            <div className="mt-4 flex justify-end">
              <button onClick={submit} disabled={saving} className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Saving...' : 'Save stock item'}
              </button>
            </div>
          </div>
        )}
      </div>
</PortalLayout>
  )
}
