'use client'
import { useState } from 'react'

const PLACEMENTS = [
  { value: 'both',    label: 'Both (sidebar + content area)' },
  { value: 'sidebar', label: 'Sidebar only' },
  { value: 'content', label: 'Content area only' },
]
const AUDIENCES = [
  { value: 'all',      label: 'All users' },
  { value: 'vendor',   label: 'Vendors only' },
  { value: 'business', label: 'Businesses only' },
]
const BG_COLORS = [
  { value: '', label: 'Default amber' },
  { value: 'from-blue-50 to-indigo-50 border-blue-300', label: 'Blue' },
  { value: 'from-green-50 to-emerald-50 border-green-300', label: 'Green' },
  { value: 'from-purple-50 to-violet-50 border-purple-300', label: 'Purple' },
  { value: 'from-red-50 to-orange-50 border-red-300', label: 'Red/Orange' },
  { value: 'from-gray-50 to-slate-50 border-gray-300', label: 'Gray' },
]

const empty = {
  title: '', imageUrl: '', linkUrl: '', bodyText: '',
  contactEmail: '', bgColor: '', textColor: '',
  placement: 'both', showTo: 'all', isActive: true, sortOrder: 0,
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={"w-10 h-5 rounded-full transition-colors relative flex-shrink-0 " + (on ? 'bg-green-500' : 'bg-gray-200')}>
      <span className={"absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all " + (on ? 'right-0.5' : 'left-0.5')} />
    </button>
  )
}

function AdPreview({ ad }: { ad: any }) {
  const bg = ad.bgColor || 'from-amber-50 to-yellow-50 border-amber-300'
  return (
    <div className={"rounded-xl border-2 border-dashed bg-gradient-to-br p-3 relative overflow-hidden " + bg}>
      <div className="absolute top-1 right-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest">Sponsored</div>
      {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} className="w-full h-20 object-cover rounded-lg mb-2" onError={e => (e.currentTarget.style.display='none')} />}
      <div className="text-xs font-bold text-gray-700 mb-1">{ad.title || 'Ad title'}</div>
      {ad.bodyText && <div className="text-[10px] text-gray-600 leading-relaxed mb-1.5">{ad.bodyText}</div>}
      {(ad.linkUrl || ad.contactEmail) && (
        <div className="bg-white/60 rounded px-2 py-1 text-[9px] font-bold text-blue-700 truncate">
          {ad.linkUrl || ad.contactEmail}
        </div>
      )}
    </div>
  )
}

export default function AdminAdsManager({ ads: initial }: { ads: any[] }) {
  const [ads, setAds]       = useState<any[]>(initial)
  const [editing, setEditing] = useState<any | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm]     = useState<any>({ ...empty })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState(false)

  function setF(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })) }

  function startEdit(ad: any) {
    setForm({ ...ad })
    setEditing(ad)
    setCreating(false)
    setError('')
  }

  function startCreate() {
    setForm({ ...empty })
    setEditing(null)
    setCreating(true)
    setError('')
  }

  async function save() {
    if (!form.title) { setError('Title is required'); return }
    setSaving(true); setError('')
    if (editing) {
      const res = await fetch('/api/admin/ads/' + editing.id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (res.ok) {
        setAds(ads.map(a => a.id === editing.id ? { ...a, ...form } : a))
        setSuccess('Updated!'); setEditing(null)
      } else setError('Failed to update')
    } else {
      const res = await fetch('/api/admin/ads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        const all = await fetch('/api/admin/ads').then(r => r.json())
        setAds(all); setSuccess('Created!'); setCreating(false)
      } else setError(data.error || 'Failed to create')
    }
    setSaving(false)
    setTimeout(() => setSuccess(''), 2000)
  }

  async function toggle(id: string, val: boolean) {
    await fetch('/api/admin/ads/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !val }) })
    setAds(ads.map(a => a.id === id ? { ...a, isActive: !val } : a))
  }

  async function remove(id: string) {
    if (!confirm('Delete this advertisement permanently?')) return
    setDeleting(id)
    await fetch('/api/admin/ads/' + id, { method: 'DELETE' })
    setDeleting(null)
    setAds(ads.filter(a => a.id !== id))
  }

  const placementBadge = (p: string) => ({ both:'bg-purple-50 text-purple-700', sidebar:'bg-blue-50 text-blue-700', content:'bg-green-50 text-green-700' }[p] || 'bg-gray-100 text-gray-500')

  return (
    <div className="space-y-4">
      {success && <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">{success}</div>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs">
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{ads.length} total</span>
          <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full">{ads.filter(a=>a.isActive).length} active</span>
        </div>
        <button onClick={startCreate} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
          + New advertisement
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs text-center">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
          <div className="text-purple-400 mb-1">Both placements</div>
          <div className="text-xl font-bold text-purple-700">{ads.filter(a=>a.placement==='both'||!a.placement).length}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="text-blue-400 mb-1">Sidebar only</div>
          <div className="text-xl font-bold text-blue-700">{ads.filter(a=>a.placement==='sidebar').length}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <div className="text-green-400 mb-1">Content only</div>
          <div className="text-xl font-bold text-green-700">{ads.filter(a=>a.placement==='content').length}</div>
        </div>
      </div>

      {/* Ad list */}
      <div className="space-y-2">
        {ads.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-100 rounded-xl text-gray-400 text-sm">
            No advertisements yet. Create your first one.
          </div>
        )}
        {ads.map(ad => (
          <div key={ad.id} className={"bg-white border-2 rounded-xl p-4 transition " + (ad.isActive ? 'border-green-200' : 'border-gray-100 opacity-60')}>
            <div className="flex items-start gap-4">
              {ad.imageUrl ? (
                <img src={ad.imageUrl} alt={ad.title} className="w-20 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100" onError={e => (e.currentTarget.style.display='none')} />
              ) : (
                <div className="w-20 h-14 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] text-gray-400 text-center">No image</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="font-medium text-sm text-gray-800">{ad.title}</div>
                  <span className={"text-[9px] px-2 py-0.5 rounded-full font-medium " + (ad.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {ad.isActive ? 'Active' : 'Paused'}
                  </span>
                  <span className={"text-[9px] px-2 py-0.5 rounded-full " + placementBadge(ad.placement || 'both')}>
                    {ad.placement || 'both'}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{ad.showTo}</span>
                </div>
                {ad.bodyText && <div className="text-xs text-gray-500 truncate mb-1">{ad.bodyText}</div>}
                <div className="flex gap-3 text-[10px] text-gray-400 flex-wrap">
                  {ad.linkUrl && <span>🔗 {ad.linkUrl}</span>}
                  {ad.contactEmail && <span>✉ {ad.contactEmail}</span>}
                  {ad.sortOrder !== 0 && <span>Order: {ad.sortOrder}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Toggle on={ad.isActive} onClick={() => toggle(ad.id, ad.isActive)} />
                <button onClick={() => startEdit(ad)} className="text-[10px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">Edit</button>
                <button onClick={() => remove(ad.id)} disabled={deleting === ad.id}
                  className="text-[10px] px-2.5 py-1 bg-red-50 text-red-600 rounded-lg border border-red-200 disabled:opacity-50">
                  {deleting === ad.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">{editing ? 'Edit advertisement' : 'Create advertisement'}</div>
            <button onClick={() => setPreview(!preview)} className="text-xs px-3 py-1 border border-gray-200 text-gray-500 rounded-lg">
              {preview ? 'Hide preview' : 'Show preview'}
            </button>
          </div>

          {preview && (
            <div className="max-w-xs">
              <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Preview</div>
              <AdPreview ad={form} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Title *</label>
              <input value={form.title} onChange={e => setF('title', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Dell Enterprise Solutions" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Image URL</label>
              <input value={form.imageUrl||''} onChange={e => setF('imageUrl', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="https://i.imgur.com/yourimage.jpg" />
              <div className="text-[10px] text-gray-400 mt-1">Upload to imgur.com (free) → right click image → Copy image address → paste here</div>
              {form.imageUrl && (
                <div className="mt-2 relative inline-block">
                  <img src={form.imageUrl} alt="preview" className="h-20 rounded-lg object-cover border border-gray-100" onError={e => (e.currentTarget.src = '')} />
                  <button onClick={() => setF('imageUrl', '')} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">x</button>
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Body text / ad copy</label>
              <textarea value={form.bodyText||''} onChange={e => setF('bodyText', e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Short tagline or description..." />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Click-through URL</label>
              <input value={form.linkUrl||''} onChange={e => setF('linkUrl', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="https://advertiser.com" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Contact email</label>
              <input value={form.contactEmail||''} onChange={e => setF('contactEmail', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="contact@company.com" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Placement</label>
              <select value={form.placement||'both'} onChange={e => setF('placement', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Show to</label>
              <select value={form.showTo||'all'} onChange={e => setF('showTo', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Background style</label>
              <select value={form.bgColor||''} onChange={e => setF('bgColor', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {BG_COLORS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sort order (lower = first)</label>
              <input type="number" value={form.sortOrder||0} onChange={e => setF('sortOrder', +e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Toggle on={form.isActive} onClick={() => setF('isActive', !form.isActive)} />
              <span className="text-xs text-gray-600">{form.isActive ? 'Active — visible to users' : 'Paused — hidden from users'}</span>
            </div>
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
            <button onClick={() => { setEditing(null); setCreating(false) }}
              className="text-sm border border-gray-200 text-gray-500 px-4 py-2 rounded-lg">Cancel</button>
            <button onClick={save} disabled={saving}
              className="text-sm bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 font-medium">
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Create advertisement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
