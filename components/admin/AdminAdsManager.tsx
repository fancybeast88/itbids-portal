'use client'
import { useState } from 'react'

const showToOptions = [
  { value: 'all',      label: 'All users (vendor + business)' },
  { value: 'vendor',   label: 'Vendors only' },
  { value: 'business', label: 'Businesses only' },
]

const emptyForm = { title: '', imageUrl: '', linkUrl: '', bodyText: '', contactEmail: '', isActive: true, showTo: 'all' }

export default function AdminAdsManager({ ads: initial }: { ads: any[] }) {
  const [ads, setAds]     = useState(initial)
  const [form, setForm]   = useState({ ...emptyForm })
  const [tab, setTab]     = useState<'list'|'new'>('list')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function setF(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function create() {
    if (!form.title) { setError('Title is required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/admin/ads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      const updated = await fetch('/api/admin/ads').then(r => r.json())
      setAds(updated)
      setForm({ ...emptyForm })
      setSuccess('Advertisement created!')
      setTab('list')
      setTimeout(() => setSuccess(''), 2000)
    } else setError(data.error || 'Failed to create')
  }

  async function toggle(id: string, isActive: boolean) {
    setToggling(id)
    await fetch('/api/admin/ads/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) })
    setToggling(null)
    setAds(ads.map(a => a.id === id ? { ...a, isActive: !isActive } : a))
  }

  async function remove(id: string) {
    if (!confirm('Delete this advertisement?')) return
    setDeleting(id)
    await fetch('/api/admin/ads/' + id, { method: 'DELETE' })
    setDeleting(null)
    setAds(ads.filter(a => a.id !== id))
  }

  function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick} className={"w-10 h-5 rounded-full transition-colors relative flex-shrink-0 " + (on ? 'bg-green-500' : 'bg-gray-200')}>
        <span className={"absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all " + (on ? 'right-0.5' : 'left-0.5')} />
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {success && <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg">{success}</div>}

      {/* Tab nav */}
      <div className="flex gap-2">
        {[{key:'list',label:'All advertisements'},{key:'new',label:'+ Create new'}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={"text-xs px-4 py-2 rounded-lg font-medium transition " + (tab === t.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="space-y-3">
          {ads.length === 0 && (
            <div className="text-center py-12 bg-white border border-gray-100 rounded-xl text-gray-400 text-sm">
              No advertisements yet. Create your first one.
            </div>
          )}
          {ads.map(ad => (
            <div key={ad.id} className={"bg-white border-2 rounded-xl p-4 " + (ad.isActive ? 'border-green-200' : 'border-gray-100 opacity-60')}>
              <div className="flex items-start gap-4">
                {/* Image preview */}
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={ad.title} className="w-24 h-16 object-cover rounded-lg border border-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-24 h-16 rounded-lg bg-amber-50 border-2 border-dashed border-amber-300 flex items-center justify-center flex-shrink-0">
                    <div className="text-[9px] text-amber-500 text-center font-medium">No image<br/>Text only</div>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-sm text-gray-800">{ad.title}</div>
                    <span className={"text-[9px] px-2 py-0.5 rounded-full font-medium " + (ad.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {ad.isActive ? 'Active' : 'Paused'}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{ad.showTo}</span>
                  </div>
                  {ad.bodyText && <div className="text-xs text-gray-500 mb-1 leading-relaxed">{ad.bodyText}</div>}
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    {ad.linkUrl && <span>Link: {ad.linkUrl}</span>}
                    {ad.contactEmail && <span>Email: {ad.contactEmail}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Toggle on={ad.isActive} onClick={() => toggling !== ad.id && toggle(ad.id, ad.isActive)} />
                  <button onClick={() => remove(ad.id)} disabled={deleting === ad.id}
                    className="text-[10px] px-2.5 py-1 bg-red-50 text-red-600 rounded-lg border border-red-200 disabled:opacity-50">
                    {deleting === ad.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'new' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 max-w-2xl space-y-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Create advertisement</div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Title *</label>
            <input value={form.title} onChange={e => setF('title', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. TO LET — Advertisement Space" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Image URL</label>
            <input value={form.imageUrl} onChange={e => setF('imageUrl', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="https://your-image-url.com/banner.jpg" />
            <div className="text-[10px] text-gray-400 mt-1">Upload your image to Imgur, Cloudinary, or any image host and paste the URL here</div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-cover border border-gray-100" />
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Body text</label>
            <textarea value={form.bodyText} onChange={e => setF('bodyText', e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="Short description or ad copy..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Click-through URL</label>
              <input value={form.linkUrl} onChange={e => setF('linkUrl', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="https://advertiser-website.com" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Contact email</label>
              <input value={form.contactEmail} onChange={e => setF('contactEmail', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="advert@leadvault.pk" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Show to</label>
            <select value={form.showTo} onChange={e => setF('showTo', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {showToOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Toggle on={form.isActive} onClick={() => setF('isActive', !form.isActive)} />
            <span className="text-xs text-gray-600">Active immediately after creating</span>
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setTab('list'); setForm({ ...emptyForm }) }}
              className="text-sm border border-gray-200 text-gray-500 px-4 py-2 rounded-lg">Cancel</button>
            <button onClick={create} disabled={saving}
              className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Creating...' : 'Create advertisement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
