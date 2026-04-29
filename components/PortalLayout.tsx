'use client'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  LayoutDashboard,
  ListChecks,
  Package,
  FileText,
  CreditCard,
  Bell,
  UserCircle,
  ShieldCheck,
  ClipboardList,
  Receipt,
  Settings,
  Megaphone,
  FilePlus,
  Boxes,
  LogOut,
  Menu,
  X,
  Plus,
  Coins,
  type LucideIcon,
} from 'lucide-react'

type NavItem = { label: string; href: string; icon: LucideIcon }

const vendorNav: NavItem[] = [
  { label: 'Dashboard',     href: '/vendor/dashboard',     icon: LayoutDashboard },
  { label: 'Browse RFQs',   href: '/vendor/rfqs',          icon: ListChecks },
  { label: 'My Stock',      href: '/vendor/stock',         icon: Package },
  { label: 'My Quotes',     href: '/vendor/quotes',        icon: FileText },
  { label: 'Buy Credits',   href: '/vendor/credits',       icon: CreditCard },
  { label: 'Notifications', href: '/vendor/notifications', icon: Bell },
  { label: 'Profile',       href: '/vendor/profile',       icon: UserCircle },
]

const businessNav: NavItem[] = [
  { label: 'Dashboard',     href: '/business/dashboard',    icon: LayoutDashboard },
  { label: 'Post RFQ',      href: '/business/post-rfq',     icon: FilePlus },
  { label: 'My RFQs',       href: '/business/my-rfqs',      icon: ClipboardList },
  { label: 'Vendor Stock',  href: '/business/stock',        icon: Boxes },
  { label: 'Buy Credits',   href: '/business/credits',      icon: CreditCard },
  { label: 'Notifications', href: '/business/notifications',icon: Bell },
  { label: 'Profile',       href: '/business/profile',      icon: UserCircle },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard',       href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'RFQ Approvals',   href: '/admin/rfqs',      icon: ListChecks },
  { label: 'All Quotes',      href: '/admin/quotes',    icon: FileText },
  { label: 'Users',           href: '/admin/users',     icon: ShieldCheck },
  { label: 'Payments',        href: '/admin/payments',  icon: Receipt },
  { label: 'Settings',        href: '/admin/settings',  icon: Settings },
  { label: 'Advertisements',  href: '/admin/ads',       icon: Megaphone },
]

export default function PortalLayout({
  children,
  credits,
  bizCredits,
}: {
  children: React.ReactNode
  credits?: number
  bizCredits?: number
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = (session?.user as any)?.role
  const [navOpen, setNavOpen] = useState(false)

  const [ads, setAds] = useState<any[]>([])

  useEffect(() => {
    if (role && role !== 'admin') {
      fetch('/api/ads?placement=sidebar')
        .then(r => r.json())
        .then(d => setAds(Array.isArray(d) ? d : []))
        .catch(() => {})
    }
  }, [role])

  const nav = role === 'admin' ? adminNav : role === 'business' ? businessNav : vendorNav
  const roleLabel = role === 'admin' ? 'Admin' : role === 'business' ? 'Business' : 'Vendor'
  const roleAccent =
    role === 'admin'
      ? 'bg-violet-50 text-violet-700 ring-violet-100'
      : role === 'business'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : 'bg-brand-50 text-brand-700 ring-brand-100'

  const showCredits = role === 'vendor' || role === 'business'
  const creditValue = role === 'vendor' ? credits : role === 'business' ? bizCredits : undefined
  const creditHref = role === 'vendor' ? '/vendor/credits' : '/business/credits'

  return (
    <div className="flex min-h-screen bg-slate-50/70">
      {/* Mobile menu trigger */}
      <button
        onClick={() => setNavOpen(v => !v)}
        aria-label="Toggle menu"
        className="fixed z-40 bottom-4 right-4 md:hidden inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition"
      >
        {navOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile backdrop */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden"
          aria-hidden
        />
      )}

      <aside
        className={
          'fixed md:static inset-y-0 left-0 z-30 w-64 md:w-60 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ' +
          (navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
        }
      >
        {/* Brand + role */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <Logo size="sm" />
          <div className="mt-3 flex items-center gap-2">
            <span
              className={
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ' +
                roleAccent
              }
            >
              <ShieldCheck size={10} strokeWidth={2.5} />
              {roleLabel}
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {session?.user?.email?.split('@')[0]}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          <ul className="space-y-0.5">
            {nav.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    className={
                      'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ' +
                      (active
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
                    }
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 w-0.5 rounded-r-full bg-brand-600" />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={active ? 2.25 : 2}
                      className={active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}
                    />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {showCredits && (
            <Link
              href={creditHref}
              className="block rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/70 ring-1 ring-brand-100 p-3 hover:ring-brand-200 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  <Coins size={11} strokeWidth={2.5} />
                  Credits
                </div>
                <span className="text-[10px] text-brand-500/80">100 = PKR 1,000</span>
              </div>
              <div className="mt-1.5 text-2xl font-bold tabular-nums text-brand-700">
                {creditValue ?? '—'}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-brand-600 text-white text-[11px] font-medium px-2.5 py-1 shadow-sm hover:bg-brand-700 transition">
                <Plus size={11} strokeWidth={2.5} />
                Buy credits
              </div>
            </Link>
          )}

          {role !== 'admin' && ads.length > 0 && (
            <div className="space-y-2">
              {ads
                .filter((ad: any) => !!ad.imageUrl)
                .map((ad: any) => {
                  const img = (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ad.imageUrl}
                      alt=""
                      className="block w-full rounded-lg object-cover ring-1 ring-slate-200/80"
                    />
                  )
                  return ad.linkUrl ? (
                    <a
                      key={ad.id}
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="block transition hover:opacity-90"
                    >
                      {img}
                    </a>
                  ) : (
                    <div key={ad.id}>{img}</div>
                  )
                })}
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <LogOut size={13} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
