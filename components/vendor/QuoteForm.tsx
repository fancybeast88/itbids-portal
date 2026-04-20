'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type LineItem = { desc: string; sku: string; qty: number; unitPrice: number }

export default function QuoteForm({ rfq, vendor }: { rfq: any; vendor: any }) {
  const router = useRouter()
  const [lines, setLines] = useState<LineItem[]>([
    { desc: rfq.title, sku: '', qty: 1, unitPrice: 0 },
  ])
  const [delivery, setDelivery] = useState('2–3 weeks')
  const [warranty, setWarranty] = useState('3 years')
  const [paymentTerms, setPaymentTerms] = useState('50% advance, 50% on delivery')
  const [validity, setValidity] = useState(14)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const gst = subtotal * 0.17
  const grand = subtotal + gst
  const fmt = (n: number) => Math.round(n).toLocaleString('en-PK')

  function updateLine(i: number, field: keyof LineItem, val: any) {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }

  async function submit() {
    if (grand === 0) { setError('Please enter at least one line item with a price'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfqId: rfq.id, lineItems: lines, totalAmount: grand, deliveryDays: delivery, warranty, paymentTerms, validityDays: validity, notes }),
    })
    setLoading(false)
    if (res.ok) setDone(true)
    else { const d = await res.json(); setError(d.error || 'Failed to submit') }
  }

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l5 5 7-8" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      <div className="font-semibold text-green-800 mb-1">Quote submitted</div>
      <div className="text-sm text-green-600 mb-4">{rfq.business?.companyName} has been notified.</div>
      <button onClick={() => router.push('/vendor/quotes')} className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg">View my quotes</button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* RFQ reference */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-0.5">
        <div className="font-medium text-gray-700">{rfq.title}</div>
        <div>Business: {rfq.business?.companyName} · {rfq.business?.city}</div>
        {rfq.budgetPkr && <div>Budget: PKR {Number(rfq.budgetPkr).toLocaleString('en-PK')}</div>}
        {rfq.specs && <div className="mt-1">{rfq.specs}</div>}
      </div>

      {/* Line items */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-xs font-medium text-gray-600 mb-3">Line items</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium w-2/5">Description</th>
              <th className="text-left pb-2 font-medium">SKU</th>
              <th className="text-left pb-2 font-medium w-14">Qty</th>
              <th className="text-left pb-2 font-medium">Unit price</th>
              <th className="text-right pb-2 font-medium">Total</th>
            </tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-1.5 pr-2"><input value={l.desc} onChange={e => updateLine(i,'desc',e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                  <td className="py-1.5 pr-2"><input value={l.sku} onChange={e => updateLine(i,'sku',e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs" placeholder="SKU" /></td>
                  <td className="py-1.5 pr-2"><input type="number" min="1" value={l.qty} onChange={e => updateLine(i,'qty',+e.target.value)}
                    className="w-14 border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                  <td className="py-1.5 pr-2"><input type="number" min="0" value={l.unitPrice} onChange={e => updateLine(i,'unitPrice',+e.target.value)}
                    className="w-28 border border-gray-200 rounded px-2 py-1 text-xs" placeholder="0" /></td>
                  <td className="py-1.5 text-right text-gray-600">PKR {fmt(l.qty * l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setLines(ls => [...ls, { desc: '', sku: '', qty: 1, unitPrice: 0 }])}
          className="text-xs text-blue-600 mt-2 hover:underline">+ Add line item</button>
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-right text-gray-500">
          <div>Subtotal: PKR {fmt(subtotal)}</div>
          <div>GST (17%): PKR {fmt(gst)}</div>
          <div className="font-semibold text-sm text-gray-800">Grand total: PKR {fmt(grand)}</div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3">
        <div><label className="text-[10px] text-gray-400 block mb-1">Delivery timeline</label>
          <select value={delivery} onChange={e => setDelivery(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
            {['1–2 weeks','2–3 weeks','3–4 weeks','4–6 weeks','6–8 weeks'].map((v: any) => <option key={v}>{v}</option>)}
          </select></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Warranty</label>
          <input value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Payment terms</label>
          <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
            {['100% advance','50% advance, 50% on delivery','30 days credit','LC'].map((v: any) => <option key={v}>{v}</option>)}
          </select></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Quote validity (days)</label>
          <input type="number" min="1" value={validity} onChange={e => setValidity(+e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" /></div>
        <div className="col-span-2"><label className="text-[10px] text-gray-400 block mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none" placeholder="Additional notes to the buyer…" /></div>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
      <div className="flex gap-3 justify-end">
        <button onClick={() => router.back()} className="text-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-600">Cancel</button>
        <button onClick={submit} disabled={loading} className="text-xs px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          {loading ? 'Submitting…' : 'Submit quote'}
        </button>
      </div>
    </div>
  )
}
