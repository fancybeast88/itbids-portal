'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/PortalLayout'

const typeColor: Record<string, string> = {
  available: 'bg-green-50 text-green-700 border-green-200',
  upcoming:  'bg-blue-50 text-blue-700 border-blue-200',
}

export default function BusinessStockPage() {
  const [items, setItems]     = useState<any[]>([])
  const [bizCredits, setBizCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [cat, setCat]         = useState('all')

  useEffect(() => {
    fetch('/api/vendor/stock').then(r => r.json()).then(d => {
      setItems(Array.isArray(d) ? d : [])
      setLoading(false)
    })
    fetch('/api/business/profile').then(r => r.json()).then(d => setBizCredits(d.credits || 0)).catch(() => {})
  }, [])

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))]

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.type !== filter) return false
    if (cat !== 'all' && i.category !== cat) return false
    if (search) {
      const s = search.toLowerCase()
      return i.model?.toLowerCase().includes(s) || i.brand?.toLowerCase().includes(s) ||
             i.vendor?.companyName?.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <PortalLayout bizCredits={bizCredits}>
</PortalLayout>
  )
}
