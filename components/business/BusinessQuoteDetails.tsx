'use client'
import { useState } from 'react'

const statusColor: Record<string, string> = {
  submitted:   'bg-amber-50 text-amber-700',
  shortlisted: 'bg-blue-50 text-blue-700',
  won:         'bg-green-50 text-green-700',
  lost:        'bg-red-50 text-red-700',
}

function fmt(n: number) { return Math.round(n).toLocaleString('en-PK') }

function downloadPDF(q: any, rfqTitle: string, bizName: string) {
  const lines = Array.isArray(q.lineItems) ? q.lineItems : []
  const date = new Date(q.submittedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
  const dash = '\u2014'

  const lineRows = lines.map((item: any) => {
    const desc = item.desc || item.description || dash
    const sku = item.sku || dash
    const qty = item.qty || item.quantity || 1
    const unit = item.unitPrice || item.unit_price || 0
    const total = qty * unit
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0">${desc}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${sku}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:right">PKR ${fmt(unit)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">PKR ${fmt(total)}</td>
    </tr>`
  }).join('')

  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Quote</title>' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a1a2e;font-size:13px;padding:40px}' +
    '.header{display:flex;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #1A56DB}' +
    '.brand{font-size:22px;font-weight:700;color:#1A56DB}.brand-sub{font-size:11px;color:#888;margin-top:2px}' +
    '.doc-title{font-size:18px;font-weight:700;text-align:right}.doc-date{font-size:11px;color:#888;text-align:right;margin-top:4px}' +
    '.section{margin-bottom:24px}.section-title{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}' +
    '.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}.info-box{background:#f8faff;border-radius:8px;padding:14px}' +
    '.info-label{font-size:10px;color:#888;margin-bottom:2px}.info-value{font-size:13px;font-weight:600;color:#1a1a2e}' +
    'table{width:100%;border-collapse:collapse}thead tr{background:#1a1a2e}thead th{color:#fff;padding:10px;font-size:11px;text-align:left}' +
    '.total-row td{padding:12px 10px;font-size:15px;font-weight:700;color:#1A56DB;border-top:2px solid #1A56DB}' +
    '.terms{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:20px}.term-box{background:#f8faff;border-radius:6px;padding:10px}' +
    '.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:10px;color:#aaa;text-align:center}</style></head><body>' +
    '<div class="header"><div><div class="brand">Lead Vault</div><div class="brand-sub">Pakistan IT Procurement</div></div>' +
    `<div><div class="doc-title">PROFORMA INVOICE</div><div class="doc-date">Date: ${date}</div></div></div>` +
    `<div class="section"><div class="section-title">RFQ</div><div class="info-box"><div class="info-label">Title</div><div class="info-value">${rfqTitle}</div></div></div>` +
    '<div class="section grid2">' +
    `<div><div class="section-title">Vendor</div><div class="info-box"><div class="info-label">Company</div><div class="info-value">${q.vendor?.companyName || dash}</div>` +
    `<div style="margin-top:8px"><div class="info-label">Contact</div><div class="info-value">${q.vendor?.contactPerson || dash}</div></div>` +
    `<div style="margin-top:8px"><div class="info-label">Phone</div><div class="info-value">${q.vendor?.phone || dash}</div></div>` +
    `<div style="margin-top:8px"><div class="info-label">City</div><div class="info-value">${q.vendor?.city || dash}</div></div>` +
    `<div style="margin-top:8px"><div class="info-label">Partner level</div><div class="info-value">${q.vendor?.partnerLevel || dash}</div></div></div></div>` +
    `<div><div class="section-title">Business (Buyer)</div><div class="info-box"><div class="info-label">Company</div><div class="info-value">${bizName}</div></div></div></div>` +
    '<div class="section"><div class="section-title">Line Items</div><table>' +
    '<thead><tr><th>Description</th><th>SKU</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>' +
    (lineRows || '<tr><td colspan="5" style="padding:12px;text-align:center;color:#888">No line items</td></tr>') +
    `<tr class="total-row"><td colspan="4" style="text-align:right;padding:12px 10px">TOTAL</td><td style="text-align:right;padding:12px 10px">PKR ${fmt(Number(q.totalAmount))}</td></tr>` +
    '</tbody></table></div>' +
    `<div class="terms">` +
    `<div class="term-box"><div class="info-label">Delivery</div><div class="info-value">${q.deliveryDays || dash}</div></div>` +
    `<div class="term-box"><div class="info-label">Warranty</div><div class="info-value">${q.warranty || dash}</div></div>` +
    `<div class="term-box"><div class="info-label">Payment terms</div><div class="info-value">${q.paymentTerms || dash}</div></div>` +
    `<div class="term-box"><div class="info-label">Validity</div><div class="info-value">${q.validityDays ? q.validityDays + ' days' : dash}</div></div>` +
    `<div class="term-box" style="grid-column:span 2"><div class="info-label">Notes</div><div class="info-value">${q.notes || dash}</div></div></div>` +
    '<div class="footer">Generated via Lead Vault &middot; leadvault.pk</div></body></html>'

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) win.onload = () => { setTimeout(() => { win.print(); URL.revokeObjectURL(url) }, 500) }
}

export default function BusinessQuoteDetails({ quotes, rfqTitle, bizName }: {
  quotes: any[]; rfqTitle: string; bizName: string
}) {
  const [expanded, setExpanded] = useState<string | null>(quotes[0]?.id || null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(quotes.map(q => [q.id, q.status]))
  )

  async function updateStatus(qId: string, status: string) {
    setUpdating(qId)
    const res = await fetch(`/api/quotes/${qId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    if (res.ok) setStatuses(s => ({ ...s, [qId]: status }))
    else alert('Failed to update status')
  }

  return (
    <div className="space-y-3">
      {quotes.map((q, i) => {
        const status = statuses[q.id]
        const isOpen = expanded === q.id
        const lines  = Array.isArray(q.lineItems) ? q.lineItems : []
        return (
          <div key={q.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50"
              onClick={() => setExpanded(isOpen ? null : q.id)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">{i+1}</div>
                <div>
                  <div className="font-medium text-sm text-gray-800">{q.vendor?.companyName}</div>
                  <div className="text-xs text-gray-400">{q.vendor?.city} &middot; {q.vendor?.partnerLevel}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-gray-800">PKR {fmt(Number(q.totalAmount))}</div>
                  <div className="text-[10px] text-gray-400">{new Date(q.submittedAt).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})}</div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${statusColor[status]}`}>
                  {status.charAt(0).toUpperCase()+status.slice(1)}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`text-gray-400 transition-transform ${isOpen?'rotate-180':''}`}>
                  <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-gray-100 p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Vendor details</div>
                    {([["Contact",q.vendor?.contactPerson],["Phone",q.vendor?.phone],["City",q.vendor?.city],["Level",q.vendor?.partnerLevel]] as [string,string|undefined][]).map(([l,v])=>v&&(
                      <div key={l} className="flex gap-2 text-xs mb-1.5">
                        <span className="text-gray-400 w-16 flex-shrink-0">{l}</span>
                        <span className="text-gray-700 font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quote terms</div>
                    {([["Total",`PKR ${fmt(Number(q.totalAmount))}`],["Delivery",q.deliveryDays],["Warranty",q.warranty],["Payment",q.paymentTerms],["Valid",q.validityDays?`${q.validityDays} days`:null]] as [string,string|null][]).map(([l,v])=>v&&(
                      <div key={l} className="flex gap-2 text-xs mb-1.5">
                        <span className="text-gray-400 w-16 flex-shrink-0">{l}</span>
                        <span className="text-gray-700 font-medium">{v}</span>
                      </div>
                    ))}
                    {q.notes && <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2 leading-relaxed">{q.notes}</div>}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Actions</div>
                    <div className="space-y-2">
                      {status==='submitted'&&(
                        <button onClick={()=>updateStatus(q.id,'shortlisted')} disabled={updating===q.id}
                          className="w-full text-xs px-3 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                          {updating===q.id?'Updating...':"Shortlist vendor"}
                        </button>
                      )}
                      {status==='shortlisted'&&(
                        <button onClick={()=>updateStatus(q.id,'won')} disabled={updating===q.id}
                          className="w-full text-xs px-3 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                          {updating===q.id?'Updating...':'Mark as won'}
                        </button>
                      )}
                      {(status==='submitted'||status==='shortlisted')&&(
                        <button onClick={()=>updateStatus(q.id,'lost')} disabled={updating===q.id}
                          className="w-full text-xs px-3 py-2 border border-red-200 text-red-600 rounded-lg">
                          Reject quote
                        </button>
                      )}
                      <button onClick={()=>downloadPDF(q,rfqTitle,bizName)}
                        className="w-full text-xs px-3 py-2 border border-gray-200 text-gray-600 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
                {lines.length>0&&(
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Line items</div>
                    <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-400">Description</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-400">SKU</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-400">Qty</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-400">Unit price</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-400">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((item:any,idx:number)=>(
                          <tr key={idx} className="border-t border-gray-50">
                            <td className="px-3 py-2 text-gray-700">{item.desc||item.description||'N/A'}</td>
                            <td className="px-3 py-2 text-gray-400">{item.sku||'N/A'}</td>
                            <td className="px-3 py-2 text-center">{item.qty||item.quantity||1}</td>
                            <td className="px-3 py-2 text-right">PKR {fmt(item.unitPrice||item.unit_price||0)}</td>
                            <td className="px-3 py-2 text-right font-medium">PKR {fmt((item.qty||item.quantity||1)*(item.unitPrice||item.unit_price||0))}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-200 bg-blue-50/30">
                          <td colSpan={4} className="px-3 py-2 text-right font-semibold text-gray-700">Total</td>
                          <td className="px-3 py-2 text-right font-bold text-blue-700">PKR {fmt(Number(q.totalAmount))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
