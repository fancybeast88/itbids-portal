'use client'
import { useState } from 'react'

const EMAIL_KEYS = [
  { key: 'rfq-approved',           label: 'RFQ approved',         desc: 'Notify business when RFQ goes live' },
  { key: 'rfq-rejected',           label: 'RFQ rejected',         desc: 'Notify business when RFQ is rejected' },
  { key: 'rfq-unlocked',           label: 'RFQ unlocked',         desc: 'Notify vendor when they unlock an RFQ' },
  { key: 'quote-received',         label: 'Quote received',        desc: 'Notify business when vendor submits a quote' },
  { key: 'quote-shortlisted',      label: 'Quote shortlisted',     desc: 'Notify vendor when their quote is shortlisted' },
  { key: 'credits-added',          label: 'Credits added',         desc: 'Notify user after payment confirmed' },
  { key: 'account-approved',       label: 'Account approved',      desc: 'Notify user when account is approved' },
  { key: 'account-pending',        label: 'New registration',      desc: 'Notify admin of new sign-ups' },
  { key: 'password-reset',         label: 'Password reset',        desc: 'Send password reset email' },
]

const CATEGORIES = ['Laptops','Desktops','Servers','Networking','Firewall','Storage','CCTV','Printers','UPS','Other']

export default function AdminSettingsForm({ costs, packages, emailSettings, rfqPostFee: initialPostFee }: {
  costs: any[]; packages: any[]; emailSettings: any[]; rfqPostFee: number
}) {
  const emailMap = Object.fromEntries(emailSettings.map(e => [e.key, e.value]))
  const [costList, setCostList]   = useState(costs.length > 0 ? costs : CATEGORIES.map(c => ({ category: c, cost: 2 })))
  const [pkgs, setPkgs]           = useState(packages)
  const [postFee, setPostFee]     = useState(initialPostFee)
  const [emails, setEmails]       = useState<Record<string, boolean>>(Object.fromEntries(EMAIL_KEYS.map(e => [e.key, emailMap[e.key] !== false])))
  const [saving, setSaving]       = useState<string | null>(null)
  const [saved, setSaved]         = useState<string | null>(null)
  const [newPkg, setNewPkg]       = useState({ credits: 0, pricePkr: 0, label: '' })
  const [newCat, setNewCat]       = useState('')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState(true)
  const [autoApproveVendors, setAutoApproveVendors] = useState(false)

  async function saveSection(section: string, body: any) {
    setSaving(section)
    await fetch('/api/admin/settings/global', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(null); setSaved(section)
    setTimeout(() => setSaved(null), 2500)
  }

  async function saveEmails() {
    setSaving('emails')
    await fetch('/api/admin/settings/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: emails }) })
    setSaving(null); setSaved('emails')
    setTimeout(() => setSaved(null), 2500)
  }

  async function savePackages() {
    setSaving('pkgs')
    await fetch('/api/admin/settings/packages', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packages: pkgs }) })
    setSaving(null); setSaved('pkgs')
    setTimeout(() => setSaved(null), 2500)
  }

  function addPackage() {
    if (!newPkg.credits || !newPkg.pricePkr) return
    setPkgs(p => [...p, { ...newPkg, id: 'new-' + Date.now(), isActive: true }])
    setNewPkg({ credits: 0, pricePkr: 0, label: '' })
  }

  function addCategory() {
    if (!newCat.trim()) return
    setCostList(l => [...l, { category: newCat.trim(), cost: 2 }])
    setNewCat('')
  }

  function SaveBtn({ section }: { section: string }) {
    return (
      <button onClick={() => section === 'global' ? saveSection('global', { rfqPostFee: postFee, costs: costList }) : section === 'emails' ? saveEmails() : savePackages()}
        disabled={saving === section}
        className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50">
        {saving === section ? 'Saving...' : saved === section ? 'Saved!' : 'Save'}
      </button>
    )
  }

  function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick} className={"w-9 h-5 rounded-full transition-colors relative flex-shrink-0 " + (on ? 'bg-blue-500' : 'bg-gray-200')}>
        <span className={"absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all " + (on ? 'right-0.5' : 'left-0.5')} />
      </button>
    )
  }

  return (
    <div className="space-y-5">

      {/* Portal controls */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Portal controls</div>
        <div className="space-y-3">
          {[
            { label: 'Maintenance mode', sub: 'Disable portal access for all users except admin', on: maintenanceMode, set: setMaintenanceMode },
            { label: 'Allow new registrations', sub: 'Let new vendors and businesses sign up', on: allowRegistration, set: setAllowRegistration },
            { label: 'Auto-approve vendors', sub: 'Automatically approve new vendor accounts', on: autoApproveVendors, set: setAutoApproveVendors },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm text-gray-700">{s.label}</div>
                <div className="text-[10px] text-gray-400">{s.sub}</div>
              </div>
              <Toggle on={s.on} onClick={() => s.set(!s.on)} />
            </div>
          ))}
        </div>
      </div>

      {/* RFQ posting fee */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business RFQ posting fee</div>
            <div className="text-xs text-gray-400 mt-0.5">Credits a business must spend to post one RFQ</div>
          </div>
          <SaveBtn section="global" />
        </div>
        <div className="flex items-center gap-3">
          <input type="number" min="0" max="500" value={postFee} onChange={e => setPostFee(+e.target.value)}
            className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center font-semibold" />
          <span className="text-xs text-gray-400">credits per RFQ</span>
          <span className="text-xs text-gray-400 ml-auto">= PKR {Math.round(postFee * 10).toLocaleString('en-PK')} value</span>
        </div>
        <div className="flex gap-2 mt-3">
          {[0, 25, 50, 100, 200].map(n => (
            <button key={n} type="button" onClick={() => setPostFee(n)}
              className={"text-xs px-3 py-1 rounded-lg border transition " + (postFee === n ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500')}>
              {n === 0 ? 'Free' : n + ' cr'}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor unlock cost per category */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor unlock cost per category</div>
            <div className="text-xs text-gray-400 mt-0.5">Credits a vendor spends to unlock one RFQ per category</div>
          </div>
          <SaveBtn section="global" />
        </div>
        <div className="space-y-2 mb-3">
          {costList.map((c: any, i: number) => (
            <div key={c.category} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{c.category}</span>
              <div className="flex items-center gap-2">
                <input type="number" min="1" max="20" value={c.cost}
                  onChange={e => setCostList((l: any[]) => l.map((x, idx) => idx === i ? { ...x, cost: +e.target.value } : x))}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
                <span className="text-xs text-gray-400">credits</span>
                <button onClick={() => setCostList((l: any[]) => l.filter((_, idx) => idx !== i))}
                  className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input value={newCat} onChange={e => setNewCat(e.target.value)}
            placeholder="Add new category..." className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs" />
          <button onClick={addCategory} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">+ Add</button>
        </div>
      </div>

      {/* Credit packages */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Credit packages</div>
            <div className="text-xs text-gray-400 mt-0.5">Packages shown on the buy credits page</div>
          </div>
          <SaveBtn section="pkgs" />
        </div>
        <div className="space-y-2 mb-4">
          {pkgs.map((p: any, i: number) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-gray-400 w-10">Credits</label>
                <input type="number" min="1" value={p.credits}
                  onChange={e => setPkgs((l: any[]) => l.map((x, idx) => idx === i ? { ...x, credits: +e.target.value } : x))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-gray-400 w-8">PKR</label>
                <input type="number" min="1" value={p.pricePkr}
                  onChange={e => setPkgs((l: any[]) => l.map((x, idx) => idx === i ? { ...x, pricePkr: +e.target.value } : x))}
                  className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[10px] text-gray-400 w-10">Label</label>
                <input value={p.label || ''} placeholder="Most popular..."
                  onChange={e => setPkgs((l: any[]) => l.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs" />
              </div>
              <button onClick={() => setPkgs((l: any[]) => l.filter((_, idx) => idx !== i))}
                className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-center bg-gray-50 rounded-lg p-3">
          <input type="number" placeholder="Credits" value={newPkg.credits || ''} onChange={e => setNewPkg(p => ({ ...p, credits: +e.target.value }))}
            className="w-20 border border-gray-200 rounded px-2 py-1 text-xs text-center" />
          <input type="number" placeholder="PKR" value={newPkg.pricePkr || ''} onChange={e => setNewPkg(p => ({ ...p, pricePkr: +e.target.value }))}
            className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-center" />
          <input placeholder="Label (optional)" value={newPkg.label} onChange={e => setNewPkg(p => ({ ...p, label: e.target.value }))}
            className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs" />
          <button onClick={addPackage} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">+ Add package</button>
        </div>
      </div>

      {/* Email notifications */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email notifications</div>
            <div className="text-xs text-gray-400 mt-0.5">Toggle which automated emails are sent</div>
          </div>
          <SaveBtn section="emails" />
        </div>
        <div className="space-y-1">
          {EMAIL_KEYS.map(e => (
            <div key={e.key} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm text-gray-700">{e.label}</div>
                <div className="text-[10px] text-gray-400">{e.desc}</div>
              </div>
              <Toggle on={emails[e.key] ?? true} onClick={() => setEmails(m => ({ ...m, [e.key]: !m[e.key] }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-100 rounded-xl p-5">
        <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">Danger zone</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div>
              <div className="text-sm text-gray-700">Clear expired RFQs</div>
              <div className="text-[10px] text-gray-400">Remove all rejected and expired RFQs older than 90 days</div>
            </div>
            <button className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Clear</button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-700">Reset category credit costs</div>
              <div className="text-[10px] text-gray-400">Reset all category unlock costs back to default (2 credits)</div>
            </div>
            <button onClick={() => setCostList((l: any[]) => l.map(c => ({ ...c, cost: 2 })))}
              className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Reset</button>
          </div>
        </div>
      </div>

    </div>
  )
}
