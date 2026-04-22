'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BRANDS = ['Dell','HP','Fortinet','Cisco','Lenovo','IBM','Huawei','Aruba','Other']
const CATS   = ['Laptops','Desktops','Servers','Networking','Firewall','Storage','Other']
const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta']

export default function PostRFQForm({ postFee, bizCredits }: { postFee: number; bizCredits: number }) {
  const router = useRouter()
  const [form, setForm] = useState({ title:'', brand:'Dell', category:'Laptops', quantity:'', budgetPkr:'', city:'Karachi', specs:'' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, val: string) { setForm(f => ({ ...f, [field]: val })) }

  async function submit() {
    if (!form.title || !form.specs) { setError('Please fill in title and specifications'); return }
    if (bizCredits < postFee) {
      setError('You need ' + postFee + ' credits to post an RFQ but only have ' + bizCredits + '. Ask admin to add credits.')
      return
    }
    setLoading(true); setError('')
    const res = await fetch('/api/rfqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, budgetPkr: form.budgetPkr ? parseInt(form.budgetPkr.replace(/,/g,'')) : null }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) setDone(true)
    else setError(data.error || 'Failed to submit')
  }

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="font-semibold text-green-800 mb-1">RFQ submitted for approval</div>
      <div className="text-sm text-green-700 mb-1">{postFee} credits deducted from your account.</div>
      <div className="flex gap-3 mt-4">
        <button onClick={() => { setDone(false); setForm({ title:'',brand:'Dell',category:'Laptops',quantity:'',budgetPkr:'',city:'Karachi',specs:'' }) }}
          className="text-sm border border-green-300 text-green-800 px-4 py-2 rounded-lg">Post another</button>
        <button onClick={() => router.push('/business/my-rfqs')}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg">View my RFQs</button>
      </div>
    </div>
  )

  const hasCredits = bizCredits >= postFee

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-4 flex items-center justify-between border ${hasCredits ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-200'}`}>
        <div>
          <div className={'text-sm font-medium ' + (hasCredits ? 'text-blue-700' : 'text-red-700')}>
            Posting fee: {postFee} credits per RFQ
          </div>
          <div className={'text-xs mt-0.5 ' + (hasCredits ? 'text-blue-500' : 'text-red-500')}>
            Your balance: {bizCredits} credits — {hasCredits ? 'sufficient to post' : 'insufficient, contact admin'}
          </div>
        </div>
        <div className={'text-2xl font-bold ' + (hasCredits ? 'text-blue-600' : 'text-red-600')}>{bizCredits}</div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">RFQ title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="e.g. 50x Dell Latitude 5540 Laptops" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Brand</label>
            <select value={form.brand} onChange={e => set('brand', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {BRANDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Quantity</label>
            <input value={form.quantity} onChange={e => set('quantity', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 20 units" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Budget (PKR)</label>
            <input value={form.budgetPkr} onChange={e => set('budgetPkr', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 2,500,000" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">City</label>
          <select value={form.city} onChange={e => set('city', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Full specs and requirements *</label>
          <textarea value={form.specs} onChange={e => set('specs', e.target.value)} rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400"
            placeholder="Describe specs, warranty, delivery timeline..." />
        </div>
        <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg">
          Do not include your company name or contact details in the specs.
        </div>
        {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        <div className="flex justify-end">
          <button onClick={submit} disabled={loading || !hasCredits}
            className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit RFQ (' + postFee + ' credits)'}
          </button>
        </div>
      </div>
    </div>
  )
}
