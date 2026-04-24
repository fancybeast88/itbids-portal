'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/PortalLayout'

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
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">My Stock</h1>
            <p className="text-xs text-gray-400 mt-0.5">Post available stock and upcoming inventory for businesses to browse</p>
          </div>
          <button onClick={() => setTab(tab === 'add' ? 'list' : 'add')}
            className={"text-sm px-4 py-2 rounded-lg font-medium " + (tab === 'add' ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white')}>
            {tab === 'add' ? '← Back to list' : '+ Add stock item'}
          </button>
        </div>

        {tab === 'list' && (
          <>
            <div className="flex gap-2 mb-4">
              {['all','available','upcoming'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={"text-xs px-3 py-1.5 rounded-full border transition " + (filter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500')}>
                  {f === 'all' ? 'All' : f === 'available' ? 'Available now' : 'Upcoming'}
                  <span className="ml-1 opacity-60">({f === 'all' ? items.length : items.filter(i => i.type === f).length})</span>
                </button>
              ))}
            </div>

            {loading && <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400 text-sm">
                No stock items yet. <button onClick={() => setTab('add')} className="text-blue-600">Add your first item</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {filtered.map(item => (
                <div key={item.id} className={"bg-white border-2 rounded-xl p-4 " + (typeColor[item.type] || 'border-gray-100')}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={"text-[10px] px-2 py-0.5 rounded-full border font-medium mr-2 " + (typeColor[item.type] || '')}>
                        {item.type === 'available' ? 'Available now' : 'Upcoming'}
                      </span>
                      <span className="text-[10px] text-gray-400">{item.condition}</span>
                    </div>
                    <button onClick={() => remove(item.id)} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
                  </div>
                  <div className="font-medium text-gray-800 text-sm">{item.brand} — {item.model}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.category} · {item.city}</div>
                  {item.description && <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.description}</div>}
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-gray-600"><strong>Qty:</strong> {item.quantity}</span>
                    {item.unitPricePkr && <span className="text-gray-600"><strong>PKR</strong> {Number(item.unitPricePkr).toLocaleString('en-PK')}</span>}
                    {item.type === 'upcoming' && item.expectedDate && (
                      <span className="text-blue-600"><strong>Expected:</strong> {new Date(item.expectedDate).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-300 mt-2">Added {new Date(item.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'add' && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 max-w-2xl space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Stock type *</label>
                <select value={form.type} onChange={e => setF('type', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="available">Available now</option>
                  <option value="upcoming">Upcoming stock</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Condition</label>
                <select value={form.condition} onChange={e => setF('condition', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="new">New</option>
                  <option value="refurbished">Refurbished</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Brand *</label>
                <select value={form.brand} onChange={e => setF('brand', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {BRANDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Category *</label>
                <select value={form.category} onChange={e => setF('category', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Model / Item name *</label>
                <input value={form.model} onChange={e => setF('model', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Dell Latitude 5540 i7 16GB 512GB" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Quantity *</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setF('quantity', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 10" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Unit price PKR</label>
                <input type="number" value={form.unitPricePkr} onChange={e => setF('unitPricePkr', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 150000" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">City</label>
                <select value={form.city} onChange={e => setF('city', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {form.type === 'upcoming' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Expected arrival date</label>
                  <input type="date" value={form.expectedDate} onChange={e => setF('expectedDate', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              <div className="col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Description / specs</label>
                <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Specs, warranty info, condition details..." />
              </div>
            </div>
            {error   && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
            {success && <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg">{success}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setTab('list')} className="text-sm border border-gray-200 text-gray-500 px-4 py-2 rounded-lg">Cancel</button>
              <button onClick={submit} disabled={saving} className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Adding...' : 'Add stock item'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
