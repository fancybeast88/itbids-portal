'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">{children}</div>
}

export function StatCard({
  label,
  value,
  color,
  href,
}: {
  label: string
  value: ReactNode
  color?: string
  href?: string
}) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={'text-2xl font-semibold ' + (color || 'text-slate-900')}>{value}</div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
