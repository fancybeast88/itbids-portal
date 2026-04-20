'use client'
import { useState } from 'react'

const EMAIL_KEYS = [
  { key: 'rfq-approved',      label: 'RFQ approved',       desc: 'Notify business when RFQ goes live' },
  { key: 'rfq-rejected',      label: 'RFQ rejected',       desc: 'Notify business when RFQ is rejected' },
  { key: 'rfq-unlocked',      label: 'RFQ unlocked',       desc: 'Notify vendor when they unlock an RFQ' },
  { key: 'quote-received',    label: 'Quote received',     desc: 'Notify business when vendor submits a quote' },
  { key: 'quote-shortlisted', label: 'Quote shortlisted',  desc: 'Notify vendor when their quote is shortlisted' },
  { key: 'credits-added',     label: 'Credits added',      desc: 'Notify vendor after payment confirmed' },
  { key: 'account-approved',  label: 'Account approved',   desc: 'Notify user when their account is approved' },
  { key: 'account-pending',   label: 'New registration',   desc: 'Notify admin of new user sign-ups' },
]

export default function AdminSettingsForm({
  costs, packages, emailSettings,
}: {
  costs: any[]; packages: any[]; emailSettings: any[]
}) {
  const emailMap = Object.fromEntries(emailSettings.map((e: any) => [e.key, e.value]))
  const [costList, setCostList]   = useState(costs)
  const [pkgs, setPkgs]           = useState(packages)
  const [emails, setEmails]       = useState<Record<string, boolean>>(
    Object.fromEntries(EMAIL_KEYS.map((e: any) => [e.key, emailMap[e.key] !== false]))
  )
  const [saving, setSaving]       = useState<string | null>(null)
  const [saved, setSaved]         = useState<string | null>(null)

  async function saveCosts() {
    setSaving('costs')
    await fetch('/api/admin/settings/credit-costs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costs: costList }),
    })
    setSaving(null); setSaved('costs')
    setTimeout(() => setSaved(null), 2500)
  }

  async function savePackages() {
    setSaving('pkgs')
    await fetch('/api/admin/settings/packages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packages: pkgs }),
    })
    setSaving(null); setSaved('pkgs')
    setTimeout(() => setSaved(null), 2500)
  }

  async function saveEmails() {
    setSaving('emails')
    await fetch('/api/admin/settings/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: emails }),
    })
    setSaving(null); setSaved('emails')
    setTimeout(() => setSaved(null), 2500)
  }

  function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick}
        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${on ? 'bg-blue-500' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'right-0.5' : 'left-0.5'}`} />
      </button>
    )
  }

  return (
    <div className="space-y-5">

      {/* Credit cost per category */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Credit cost per RFQ category</div>
            <div className="text-xs text-gray-400 mt-0.5">Credits a vendor must spend to unlock one RFQ</div>
          </div>
          <button onClick={saveCosts} disabled={saving === 'costs'}
            className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50">
            {saving === 'costs' ? 'Saving…' : saved === 'costs' ? 'Saved!' : 'Save'}
          </button>
        </div>
        <div className="space-y-2">
          {costList.map((c, i) => (
            <div key={c.category} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{c.category}</span>
              <div className="flex items-center gap-2">
                <input type="number" min="1" max="20" value={c.cost}
                  onChange={e => setCostList(l => l.map((x, idx) => idx === i ? { ...x, cost: +e.target.value } : x))}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
                <span className="text-xs text-gray-400">credits</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit packages */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Credit packages</div>
            <div className="text-xs text-gray-400 mt-0.5">Packages shown to vendors on the buy credits page</div>
          </div>
          <button onClick={savePackages} disabled={saving === 'pkgs'}
            className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50">
            {saving === 'pkgs' ? 'Saving…' : saved === 'pkgs' ? 'Saved!' : 'Save'}
          </button>
        </div>
        <div className="space-y-2">
          {pkgs.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-gray-400 w-14">Credits</label>
                <input type="number" min="1" value={p.credits}
                  onChange={e => setPkgs(l => l.map((x, idx) => idx === i ? { ...x, credits: +e.target.value } : x))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-gray-400 w-14">PKR</label>
                <input type="number" min="1" value={p.pricePkr}
                  onChange={e => setPkgs(l => l.map((x, idx) => idx === i ? { ...x, pricePkr: +e.target.value } : x))}
                  className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-gray-400 w-14">Label</label>
                <input value={p.label || ''} placeholder="e.g. Most popular"
                  onChange={e => setPkgs(l => l.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                  className="w-32 border border-gray-200 rounded-lg px-2 py-1 text-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email notifications */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Email notifications</div>
            <div className="text-xs text-gray-400 mt-0.5">Toggle which emails are sent automatically</div>
          </div>
          <button onClick={saveEmails} disabled={saving === 'emails'}
            className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50">
            {saving === 'emails' ? 'Saving…' : saved === 'emails' ? 'Saved!' : 'Save'}
          </button>
        </div>
        <div className="space-y-1">
          {EMAIL_KEYS.map((e: any) => (
            <div key={e.key} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm text-gray-700">{e.label}</div>
                <div className="text-xs text-gray-400">{e.desc}</div>
              </div>
              <Toggle on={emails[e.key]} onClick={() => setEmails(m => ({ ...m, [e.key]: !m[e.key] }))} />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
