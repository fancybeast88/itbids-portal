'use client'

import Link from 'next/link'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/* ---------- PageHeader ---------- */

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-6 animate-fade-in">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shrink-0">
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/* ---------- Stat cards ---------- */

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">{children}</div>
}

export function StatCard({
  label,
  value,
  color,
  href,
  icon: Icon,
}: {
  label: string
  value: ReactNode
  color?: string
  href?: string
  icon?: LucideIcon
}) {
  const content = (
    <div className="group relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        {Icon && (
          <div className="rounded-md bg-slate-50 p-1.5 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition">
            <Icon size={14} strokeWidth={2.25} />
          </div>
        )}
      </div>
      <div className={'mt-2 text-2xl font-semibold tabular-nums ' + (color || 'text-slate-900')}>
        {value}
      </div>
    </div>
  )
  return href ? <Link href={href} className="block">{content}</Link> : content
}

/* ---------- Card ---------- */

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={
        'rounded-xl border border-slate-200/80 bg-white shadow-card ' +
        (padded ? 'p-5 ' : '') +
        className
      }
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  icon: Icon,
  action,
}: {
  title: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {Icon && <Icon size={16} strokeWidth={2.25} className="text-slate-400" />}
        {title}
      </div>
      {action}
    </div>
  )
}

/* ---------- Badge ---------- */

type BadgeTone = 'slate' | 'brand' | 'green' | 'amber' | 'red' | 'violet'

const BADGE_TONES: Record<BadgeTone, string> = {
  slate:  'bg-slate-100 text-slate-700 ring-slate-200',
  brand:  'bg-brand-50 text-brand-700 ring-brand-100',
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber:  'bg-amber-50 text-amber-700 ring-amber-100',
  red:    'bg-red-50 text-red-700 ring-red-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
}

export function Badge({
  children,
  tone = 'slate',
  icon: Icon,
}: {
  children: ReactNode
  tone?: BadgeTone
  icon?: LucideIcon
}) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ' +
        BADGE_TONES[tone]
      }
    >
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase()
  if (s === 'approved' || s === 'confirmed' || s === 'won') return <Badge tone="green">{status}</Badge>
  if (s === 'pending' || s === 'submitted')                  return <Badge tone="amber">{status}</Badge>
  if (s === 'rejected' || s === 'failed' || s === 'lost')    return <Badge tone="red">{status}</Badge>
  if (s === 'shortlisted')                                    return <Badge tone="brand">{status}</Badge>
  return <Badge>{status}</Badge>
}

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

const BTN_BASE =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500'

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  ghost:     'text-slate-700 hover:bg-slate-100',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
}

const BTN_SIZES: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3.5 py-2',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${BTN_BASE} ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : Icon ? (
        <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.25} />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight size={size === 'sm' ? 13 : 15} strokeWidth={2.25} />}
    </button>
  )
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
          <Icon size={18} strokeWidth={2} />
        </div>
      )}
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {description && <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
