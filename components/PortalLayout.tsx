'use client'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

type NavItem = { label: string; href: string; icon: React.ReactNode }

function Icon({ d }: { d: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 opacity-70">
      <path d={d} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

const vendorNav: NavItem[] = [
  { label: 'Browse RFQs',    href: '/vendor/rfqs',          icon: <Icon d="M1 2h13M1 7h13M1 12h8" /> },
  { label: 'My Quotes',      href: '/vendor/quotes',        icon: <Icon d="M2 2h11v11H2z" /> },
  { label: 'Buy Credits',    href: '/vendor/credits',       icon: <Icon d="M7 1v13M2 5l5-4 5 4M2 10l5 4 5-4" /> },
  { label: 'Notifications',  href: '/vendor/notifications', icon: <Icon d="M7 1a4 4 0 014 4v3l1 2H2l1-2V5a4 4 0 014-4zM5 10.5a2 2 0 004 0" /> },
  { label: 'Profile',        href: '/vendor/profile',       icon: <Icon d="M7 6a3 3 0 100-6 3 3 0 000 6zM1 14c0-3 2.7-5 6-5s6 2 6 5" /> },
]

const businessNav: NavItem[] = [
  { label: 'Post RFQ',       href: '/business/post-rfq',    icon: <Icon d="M2 2h11v11H2zM7 5v5M4.5 7.5h5" /> },
  { label: 'My RFQs',        href: '/business/my-rfqs',     icon: <Icon d="M1 2h13M1 7h13M1 12h8" /> },
  { label: 'Notifications',  href: '/business/notifications', icon: <Icon d="M7 1a4 4 0 014 4v3l1 2H2l1-2V5a4 4 0 014-4zM5 10.5a2 2 0 004 0" /> },
  { label: 'Profile',        href: '/business/profile',     icon: <Icon d="M7 6a3 3 0 100-6 3 3 0 000 6zM1 14c0-3 2.7-5 6-5s6 2 6 5" /> },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard',      href: '/admin/dashboard',  icon: <Icon d="M1 1h5v5H1zM9 1h5v5H9zM1 9h5v5H1zM9 9h5v5H9z" /> },
  { label: 'RFQ Approvals',  href: '/admin/rfqs',       icon: <Icon d="M1 2h13M1 7h13M1 12h8" /> },
  { label: 'Users',          href: '/admin/users',      icon: <Icon d="M7 6a3 3 0 100-6 3 3 0 000 6zM1 14c0-3 2.7-5 6-5s6 2 6 5" /> },
  { label: 'Payments',       href: '/admin/payments',   icon: <Icon d="M1 4h13v8H1zM1 7h13" /> },
  { label: 'Settings',       href: '/admin/settings',   icon: <Icon d="M7 7m-2 0a2 2 0 104 0 2 2 0 10-4 0M7 1v2M7 12v2M1 7h2M12 7h2" /> },
]

export default function PortalLayout({ children, credits }: { children: React.ReactNode; credits?: number }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const role = session?.user?.role

  const nav = role === 'admin' ? adminNav : role === 'business' ? businessNav : vendorNav

  const roleLabel = role === 'admin'
    ? 'Admin'
    : role === 'business'
    ? 'Business'
    : 'Vendor'

  const companyInitials = (session?.user?.name || 'TP').slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-blue-700">IT Bids Portal</div>
          <div className="text-xs text-gray-400 mt-0.5">{roleLabel}: {session?.user?.email?.split('@')[0]}</div>
        </div>

        <nav className="flex-1 py-2">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{roleLabel}</div>
          {nav.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs mx-1 rounded-lg transition-all ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-2">
          {role === 'vendor' && (
            <div className="bg-gray-50 rounded-lg p-2.5">
              <div className="text-[10px] text-gray-400">Credits</div>
              <div className="text-xl font-semibold text-gray-800">{credits ?? '—'}</div>
              <div className="text-[10px] text-gray-400">100 = PKR 1,000</div>
              <Link href="/vendor/credits"
                className="block text-center text-xs bg-blue-600 text-white rounded-md py-1 mt-2">
                + Buy credits
              </Link>
            </div>
          )}
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-left text-xs text-gray-400 hover:text-gray-600 px-1 py-1 flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2v10h3M9 9l3-3-3-3M12 6.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
