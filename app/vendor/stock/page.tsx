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
</PortalLayout>
  )
}
