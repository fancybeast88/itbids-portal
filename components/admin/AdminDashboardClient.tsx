'use client'
import { useState } from 'react'
import Link from 'next/link'

const badge = (s: string) => ({
  pending:'bg-amber-50 text-amber-700 border border-amber-200',
  approved:'bg-green-50 text-green-700 border border-green-200',
  rejected:'bg-red-50 text-red-600 border border-red-200',
  submitted:'bg-gray-100 text-gray-600 border border-gray-200',
  shortlisted:'bg-blue-50 text-blue-700 border border-blue-200',
  won:'bg-green-50 text-green-700 border border-green-200',
  lost:'bg-red-50 text-red-600 border border-red-200',
  confirmed:'bg-green-50 text-green-700 border border-green-200',
}[s] || 'bg-gray-100 text-gray-500')

function Section({ title, action, children }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="text-xs font-semibold text-gray-700">{title}</div>
        {action && <Link href={action.href} className="text-xs text-blue-600 hover:underline">{action.label} &rarr;</Link>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Row({ left, right, sub }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div>
        <div className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{left}</div>
        {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
      </div>
      <div className="flex-shrink-0 ml-2">{right}</div>
    </div>
  )
}

export default function AdminDashboardClient({ data }: { data: any }) {
  const { overview, recentRFQs, recentVendors, recentBiz, recentQuotes, recentTxns, topVendors, topBiz } = data
  const [tab, setTab] = useState('overview')

  const tabs = [
    { key:'overview', label:'Overview' },
    { key:'rfqs', label:'RFQs' },
    { key:'quotes', label:'Quotes' },
    { key:'vendors', label:'Vendors' },
    { key:'businesses', label:'Businesses' },
    { key:'payments', label:'Payments' },
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Complete portal overview and activity</p>
        </div>
        <Link href="/admin/settings" className="text-xs bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Portal Settings</Link>
      </div>

      {(overview.rfqs.pending > 0 || overview.vendors.pending > 0 || overview.businesses.pending > 0 || overview.revenue.pending > 0) && (
        <div className="grid grid-cols-4 gap-3">
          {overview.rfqs.pending > 0 && <Link href="/admin/rfqs" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3"><div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">{overview.rfqs.pending}</div><div><div className="text-xs font-semibold text-amber-800">RFQs pending</div><div className="text-[10px] text-amber-600">Need approval</div></div></Link>}
          {overview.vendors.pending > 0 && <Link href="/admin/users" className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3"><div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">{overview.vendors.pending}</div><div><div className="text-xs font-semibold text-blue-800">Vendors pending</div><div className="text-[10px] text-blue-600">Awaiting approval</div></div></Link>}
          {overview.businesses.pending > 0 && <Link href="/admin/users" className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3"><div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">{overview.businesses.pending}</div><div><div className="text-xs font-semibold text-indigo-800">Businesses pending</div><div className="text-[10px] text-indigo-600">Awaiting approval</div></div></Link>}
          {overview.revenue.pending > 0 && <Link href="/admin/payments" className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3"><div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">{overview.revenue.pending}</div><div><div className="text-xs font-semibold text-green-800">Payments pending</div><div className="text-[10px] text-green-600">Confirm credits</div></div></Link>}
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {[
          { label:'Total RFQs', value:overview.rfqs.total, sub:overview.rfqs.pending+' pending', color:'text-blue-600', href:'/admin/rfqs' },
          { label:'Total quotes', value:overview.quotes.total, sub:overview.quotes.won+' won', color:'text-purple-600', href:'/admin/quotes' },
          { label:'Vendors', value:overview.vendors.total, sub:overview.vendors.approved+' approved', color:'text-indigo-600', href:'/admin/users' },
          { label:'Businesses', value:overview.businesses.total, sub:overview.businesses.approved+' approved', color:'text-teal-600', href:'/admin/users' },
          { label:'Revenue PKR', value:Math.round(Number(overview.revenue.totalPkr)/1000)+'K', sub:overview.revenue.transactions+' txns', color:'text-green-600', href:'/admin/payments' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
            <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
            <div className={'text-2xl font-bold '+s.color}>{s.value}</div>
            <div className="text-[10px] text-gray-400 mt-1">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={"flex-1 text-xs py-2 rounded-lg font-medium transition " + (tab === t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <Section title="Recent RFQs" action={{ href:'/admin/rfqs', label:'View all' }}>
            {recentRFQs.map((r: any) => <Row key={r.id} left={r.title} sub={r.business.companyName+' · '+r.brand} right={<span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(r.status)}>{r.status}</span>} />)}
          </Section>
          <Section title="Recent quotes" action={{ href:'/admin/quotes', label:'View all' }}>
            {recentQuotes.map((q: any) => <Row key={q.id} left={q.rfq.title} sub={q.vendor.companyName+' > '+q.rfq.business?.companyName} right={<div className="text-right"><div className="text-xs font-medium">PKR {Number(q.totalAmount).toLocaleString('en-PK')}</div><span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(q.status)}>{q.status}</span></div>} />)}
          </Section>
          <Section title="Top vendors" action={{ href:'/admin/users', label:'Manage' }}>
            {topVendors.map((v: any) => <Row key={v.id} left={v.companyName} sub={v.city} right={<div className="flex items-center gap-2"><span className="text-xs font-semibold text-blue-600">{v.credits} cr</span><span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(v.user.status)}>{v.user.status}</span></div>} />)}
          </Section>
          <Section title="Recent payments" action={{ href:'/admin/payments', label:'View all' }}>
            {recentTxns.map((t: any) => <Row key={t.id} left={t.vendor.companyName} sub={'PKR '+(t.amountPkr||0).toLocaleString('en-PK')} right={<span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(t.status)}>{t.status}</span>} />)}
          </Section>
        </div>
      )}

      {tab === 'rfqs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[{label:'Total',value:overview.rfqs.total,color:'text-gray-800'},{label:'Pending',value:overview.rfqs.pending,color:'text-amber-600'},{label:'Approved',value:overview.rfqs.approved,color:'text-green-600'},{label:'Rejected',value:overview.rfqs.rejected,color:'text-red-500'}].map(s=>(
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4"><div className="text-[10px] text-gray-400 mb-1">{s.label}</div><div className={'text-2xl font-bold '+s.color}>{s.value}</div></div>
            ))}
          </div>
          <Section title="All recent RFQs" action={{ href:'/admin/rfqs', label:'Full management' }}>
            {recentRFQs.map((r: any) => <Row key={r.id} left={r.title} sub={r.business.companyName+' · '+r.brand+' · Unlock: '+r.creditCost+' cr'} right={<span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(r.status)}>{r.status}</span>} />)}
          </Section>
        </div>
      )}

      {tab === 'quotes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[{label:'Total',value:overview.quotes.total,color:'text-gray-800'},{label:'Pending',value:overview.quotes.submitted,color:'text-amber-600'},{label:'Shortlisted',value:overview.quotes.shortlisted,color:'text-blue-600'},{label:'Won',value:overview.quotes.won,color:'text-green-600'}].map(s=>(
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4"><div className="text-[10px] text-gray-400 mb-1">{s.label}</div><div className={'text-2xl font-bold '+s.color}>{s.value}</div></div>
            ))}
          </div>
          <Section title="Recent quotes" action={{ href:'/admin/quotes', label:'Full details' }}>
            {recentQuotes.map((q: any) => <Row key={q.id} left={q.rfq.title} sub={q.vendor.companyName+' > '+q.rfq.business?.companyName} right={<div className="flex items-center gap-2"><span className="text-xs font-medium">PKR {Number(q.totalAmount).toLocaleString('en-PK')}</span><span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(q.status)}>{q.status}</span></div>} />)}
          </Section>
        </div>
      )}

      {tab === 'vendors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[{label:'Total',value:overview.vendors.total,color:'text-gray-800'},{label:'Approved',value:overview.vendors.approved,color:'text-green-600'},{label:'Pending',value:overview.vendors.pending,color:'text-amber-600'}].map(s=>(
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4"><div className="text-[10px] text-gray-400 mb-1">{s.label}</div><div className={'text-2xl font-bold '+s.color}>{s.value}</div></div>
            ))}
          </div>
          <Section title="Recent vendors" action={{ href:'/admin/users', label:'Manage all' }}>
            {recentVendors.map((u: any) => <Row key={u.id} left={u.vendorProfile?.companyName||u.email} sub={u.vendorProfile?.city+' · '+u.email} right={<div className="flex items-center gap-2"><span className="text-xs font-semibold text-blue-600">{u.vendorProfile?.credits??0} cr</span><span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(u.status)}>{u.status}</span><Link href={'/admin/users/'+u.id} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Edit</Link></div>} />)}
          </Section>
          <Section title="Top vendors by credits">
            {topVendors.map((v: any, i: number) => <Row key={v.id} left={'#'+(i+1)+' '+v.companyName} sub={v.city} right={<div className="flex items-center gap-2"><span className="text-xs font-bold text-blue-700">{v.credits} cr</span><Link href={'/admin/users/'+v.userId} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Edit</Link></div>} />)}
          </Section>
        </div>
      )}

      {tab === 'businesses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[{label:'Total',value:overview.businesses.total,color:'text-gray-800'},{label:'Approved',value:overview.businesses.approved,color:'text-green-600'},{label:'Pending',value:overview.businesses.pending,color:'text-amber-600'}].map(s=>(
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4"><div className="text-[10px] text-gray-400 mb-1">{s.label}</div><div className={'text-2xl font-bold '+s.color}>{s.value}</div></div>
            ))}
          </div>
          <Section title="Recent businesses" action={{ href:'/admin/users', label:'Manage all' }}>
            {recentBiz.map((u: any) => <Row key={u.id} left={u.businessProfile?.companyName||u.email} sub={u.businessProfile?.city+' · '+u.email} right={<div className="flex items-center gap-2"><span className="text-xs font-semibold text-teal-600">{u.businessProfile?.credits??0} cr</span><span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(u.status)}>{u.status}</span><Link href={'/admin/users/'+u.id} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Edit</Link></div>} />)}
          </Section>
          <Section title="Top businesses by credits">
            {topBiz.map((b: any, i: number) => <Row key={b.id} left={'#'+(i+1)+' '+b.companyName} sub={b.city+' · '+b._count.rfqs+' RFQs'} right={<div className="flex items-center gap-2"><span className="text-xs font-bold text-teal-700">{b.credits} cr</span><Link href={'/admin/users/'+b.userId} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Edit</Link></div>} />)}
          </Section>
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[{label:'Revenue',value:'PKR '+Math.round(Number(overview.revenue.totalPkr)/1000)+'K',color:'text-green-600'},{label:'Credits sold',value:overview.revenue.totalCredits,color:'text-blue-600'},{label:'Transactions',value:overview.revenue.transactions,color:'text-gray-800'},{label:'Pending',value:overview.revenue.pending,color:'text-amber-600'}].map(s=>(
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4"><div className="text-[10px] text-gray-400 mb-1">{s.label}</div><div className={'text-2xl font-bold '+s.color}>{s.value}</div></div>
            ))}
          </div>
          <Section title="Recent transactions" action={{ href:'/admin/payments', label:'Manage all' }}>
            {recentTxns.map((t: any) => <Row key={t.id} left={t.vendor.companyName} sub={new Date(t.createdAt).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})+' · '+(t.paymentMethod||'N/A')} right={<div className="flex items-center gap-2"><div className="text-right"><div className="text-xs font-semibold">+{t.credits} cr</div><div className="text-[10px] text-gray-500">PKR {(t.amountPkr||0).toLocaleString('en-PK')}</div></div><span className={'text-[10px] px-2 py-0.5 rounded-full '+badge(t.status)}>{t.status}</span></div>} />)}
          </Section>
        </div>
      )}
    </div>
  )
}
