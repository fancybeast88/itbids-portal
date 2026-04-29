'use client'
import { useState } from 'react'
import { Image as ImageIcon, Link2, Plus, Trash2, Edit3, Eye, EyeOff } from 'lucide-react'

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

const empty = {
  title: '',
  imageUrl: '',
  linkUrl: '',
  placement: 'both',
  showTo: 'all',
  isActive: true,
  sortOrder: 0,
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        'w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ' +
        (on ? 'bg-emerald-500' : 'bg-slate-200')
      }
    >
      <span
        className={
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ' +
          (on ? 'right-0.5' : 'left-0.5')
        }
      />
    </button>
  )
}

function AdPreview({ ad }: { ad: any }) {
  if (!ad.imageUrl) {
    return (
      <div className="w-full aspect-[4/1] rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
        Image preview will appear here
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.imageUrl}
      alt=""
      className="block w-full rounded-xl object-cover ring-1 ring-slate-200 shadow-card"
      onError={e => (e.currentTarget.style.display = 'none')}
    />
  )
}

export default function AdminAdsManager({ ads: initial }: { ads: any[] }) {
  const [ads, setAds] = useState<any[]>(initial)
  const [editing, setEditing] = useState<any | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<any>({ ...empty })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function setF(k: string, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }))
  }

  function startEdit(ad: any) {
    setForm({ ...empty, ...ad })
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
    if (!form.title?.trim()) {
      setError('Internal label is required')
      return
    }
    if (!form.imageUrl?.trim()) {
      setError('Image URL is required — banners are image-only')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const res = await fetch('/api/admin/ads/' + editing.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to update')
          return
        }
        setAds(ads.map(a => (a.id === editing.id ? { ...a, ...form } : a)))
        setSuccess('Updated')
        setEditing(null)
      } else {
        const res = await fetch('/api/admin/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to create')
          return
        }
        const all = await fetch('/api/admin/ads').then(r => r.json())
        setAds(all)
        setSuccess('Created')
        setCreating(false)
      }
    } finally {
      setSaving(false)
      setTimeout(() => setSuccess(''), 2000)
    }
  }

  async function toggle(id: string, val: boolean) {
    await fetch('/api/admin/ads/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !val }),
    })
    setAds(ads.map(a => (a.id === id ? { ...a, isActive: !val } : a)))
  }

  async function remove(id: string) {
    if (!confirm('Delete this advertisement permanently?')) return
    setDeleting(id)
    await fetch('/api/admin/ads/' + id, { method: 'DELETE' })
    setDeleting(null)
    setAds(ads.filter(a => a.id !== id))
  }

  const placementBadge = (p: string) =>
    ({
      both:    'bg-violet-50 text-violet-700 ring-violet-100',
      sidebar: 'bg-brand-50 text-brand-700 ring-brand-100',
      content: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    }[p] || 'bg-slate-100 text-slate-600 ring-slate-200')

  return (
    <div className="space-y-4">
      {success && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs">
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full ring-1 ring-slate-200">
            {ads.length} total
          </span>
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full ring-1 ring-emerald-100">
            {ads.filter(a => a.isActive).length} active
          </span>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
        >
          <Plus size={14} strokeWidth={2.5} />
          New advertisement
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="text-xs font-semibold text-amber-700 mb-1">Recommended banner sizes</div>
        <div className="text-[11px] text-amber-800 leading-relaxed">
          Content/full-width: <span className="font-semibold">1200 × 280 px</span>. Sidebar:{' '}
          <span className="font-semibold">300 × 250 px</span>. Banners render as the image only — no text or
          overlays will be added on top.
        </div>
      </div>

      {/* Ad list */}
      <div className="space-y-2">
        {ads.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
            No advertisements yet. Create your first one.
          </div>
        )}
        {ads.map(ad => (
          <div
            key={ad.id}
            className={
              'bg-white rounded-xl p-4 transition shadow-card ring-1 ' +
              (ad.isActive ? 'ring-emerald-200' : 'ring-slate-200 opacity-60')
            }
          >
            <div className="flex items-start gap-4">
              {ad.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.imageUrl}
                  alt=""
                  className="w-28 h-16 object-cover rounded-lg flex-shrink-0 ring-1 ring-slate-200"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="w-28 h-16 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center flex-shrink-0 text-slate-400">
                  <ImageIcon size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <div className="font-medium text-sm text-slate-800 truncate">{ad.title}</div>
                  <span
                    className={
                      'text-[10px] px-2 py-0.5 rounded-full font-medium ring-1 ring-inset ' +
                      (ad.isActive
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                        : 'bg-slate-100 text-slate-500 ring-slate-200')
                    }
                  >
                    {ad.isActive ? 'Active' : 'Paused'}
                  </span>
                  <span
                    className={
                      'text-[10px] px-2 py-0.5 rounded-full ring-1 ring-inset ' +
                      placementBadge(ad.placement || 'both')
                    }
                  >
                    {ad.placement || 'both'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                    {ad.showTo}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                  {ad.linkUrl && (
                    <span className="inline-flex items-center gap-1">
                      <Link2 size={11} />
                      <span className="truncate max-w-[40ch]">{ad.linkUrl}</span>
                    </span>
                  )}
                  {ad.sortOrder !== 0 && <span>Order: {ad.sortOrder}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Toggle on={ad.isActive} onClick={() => toggle(ad.id, ad.isActive)} />
                <button
                  onClick={() => startEdit(ad)}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg ring-1 ring-brand-100 hover:bg-brand-100 transition"
                >
                  <Edit3 size={11} />
                  Edit
                </button>
                <button
                  onClick={() => remove(ad.id)}
                  disabled={deleting === ad.id}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-red-50 text-red-600 rounded-lg ring-1 ring-red-100 hover:bg-red-100 transition disabled:opacity-50"
                >
                  <Trash2 size={11} />
                  {deleting === ad.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <div className="bg-white rounded-xl p-5 space-y-4 shadow-card ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">
              {editing ? 'Edit advertisement' : 'Create advertisement'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Eye size={12} />
              Image-only — no text rendered on banner
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 block mb-1">Internal label *</label>
              <input
                value={form.title}
                onChange={e => setF('title', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                placeholder="e.g. Dell Q3 campaign — for admin reference only"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Used for your own organization in this admin panel. Not shown to users.
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-500 block mb-1">Image URL *</label>
              <input
                value={form.imageUrl || ''}
                onChange={e => setF('imageUrl', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                placeholder="https://i.imgur.com/yourimage.jpg"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Upload to imgur.com (free) → right-click image → Copy image address → paste here.
              </div>

              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Live preview</div>
                <AdPreview ad={form} />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-500 block mb-1">Click-through URL</label>
              <input
                value={form.linkUrl || ''}
                onChange={e => setF('linkUrl', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                placeholder="https://advertiser.com  (optional — banner becomes clickable when set)"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">Placement</label>
              <select
                value={form.placement || 'both'}
                onChange={e => setF('placement', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {PLACEMENTS.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Show to</label>
              <select
                value={form.showTo || 'all'}
                onChange={e => setF('showTo', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {AUDIENCES.map(a => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Sort order (lower = first)</label>
              <input
                type="number"
                value={form.sortOrder || 0}
                onChange={e => setF('sortOrder', +e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 self-end">
              <Toggle on={form.isActive} onClick={() => setF('isActive', !form.isActive)} />
              <span className="text-xs text-slate-600 inline-flex items-center gap-1">
                {form.isActive ? (
                  <>
                    <Eye size={12} className="text-emerald-600" /> Active
                  </>
                ) : (
                  <>
                    <EyeOff size={12} className="text-slate-400" /> Paused
                  </>
                )}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 ring-1 ring-red-200 p-3 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setEditing(null)
                setCreating(false)
              }}
              className="text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 font-medium shadow-sm transition"
            >
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Create advertisement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
