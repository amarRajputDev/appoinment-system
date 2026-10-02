'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  User,
  Users,
  Briefcase,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

function navFor(role?: string) {
  const base = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, section: 'Studio' },
    { to: '/book', label: 'New booking', icon: CalendarPlus, section: 'Studio' },
    { to: '/appointments', label: 'Schedule', icon: CalendarDays, section: 'Studio' },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays, section: 'Studio' },
  ]
  if (role === 'admin') {
    base.push(
      { to: '/services', label: 'Services', icon: Briefcase, section: 'Manage' },
      { to: '/providers', label: 'Providers', icon: Users, section: 'Manage' },
      { to: '/users', label: 'Team', icon: Shield, section: 'Manage' },
      { to: '/availability', label: 'Hours', icon: Clock, section: 'Manage' }
    )
  } else if (role === 'provider') {
    base.push(
      { to: '/services', label: 'Services', icon: Briefcase, section: 'Manage' },
      { to: '/availability', label: 'Hours', icon: Clock, section: 'Manage' }
    )
  }
  base.push({ to: '/profile', label: 'Account', icon: User, section: 'You' })
  return base
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="logo-mark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 3v3M17 3v3M4.5 9.5h15M6 6.5h12a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="13.5" r="1" fill="currentColor" />
          <circle cx="15" cy="13.5" r="1" fill="currentColor" />
          <circle cx="9" cy="17" r="1" fill="currentColor" opacity="0.7" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[0.98rem] font-semibold tracking-tight" style={{ color: 'var(--sidebar-text)' }}>
            Tempo
          </div>
          <div className="text-[0.68rem] font-medium tracking-[0.14em] uppercase" style={{ color: 'color-mix(in srgb, var(--sidebar-text) 45%, transparent)' }}>
            Appointment Studio
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = navFor(user?.role)

  const sections = ['Studio', 'Manage', 'You'].filter((s) => links.some((l) => l.section === s))

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="relative min-h-screen">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between px-5 pb-6 pt-6">
          <Logo />
          <button
            className="btn-ghost p-1.5 lg:hidden"
            style={{ color: 'var(--sidebar-text)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {sections.map((section) => (
            <div key={section}>
              <div
                className="mb-2 px-3 text-[0.68rem] font-semibold tracking-[0.16em] uppercase"
                style={{ color: 'color-mix(in srgb, var(--sidebar-text) 38%, transparent)' }}
              >
                {section}
              </div>
              <div className="space-y-1">
                {links
                  .filter((l) => l.section === section)
                  .map((link) => (
                    <Link
                      key={link.to}
                      href={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={clsx('nav-item', pathname === link.to && 'active')}
                    >
                      <link.icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />
                      {link.label}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <ThemeToggle className="border-white/10 bg-white/5 text-white" />
            <span className="text-xs" style={{ color: 'color-mix(in srgb, var(--sidebar-text) 55%, transparent)' }}>
              {theme === 'dark' ? 'Light' : 'Dark'} mode
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-left"
            style={{ color: '#fda4af' }}
          >
            <LogOut className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:pl-[260px]">
        <header
          className="sticky top-0 z-20 flex items-center gap-3 border-b border-[color:var(--line)] px-4 py-3.5 lg:px-8"
          style={{
            background: 'color-mix(in srgb, var(--paper) 82%, transparent)',
            backdropFilter: 'blur(14px) saturate(1.15)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.15)',
          }}
        >
          <button className="btn-ghost p-1.5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-semibold tracking-tight">{user?.name}</div>
            <div className="truncate text-[0.72rem] font-medium tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
              {user?.role} · Tempo Studio
            </div>
          </div>
          <div
            className="hidden items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-1.5 text-xs font-medium sm:flex"
            style={{ color: 'var(--muted)' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </div>
          <ThemeToggle className="lg:hidden" />
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[0.78rem] font-semibold text-white shadow-lg"
            style={{ background: 'linear-gradient(145deg, #ea580c, #9a3412)' }}
            aria-label="Account"
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Link>
        </header>

        <main className="relative z-10 px-4 pb-24 pt-7 lg:px-8 lg:pb-12">{children}</main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 gap-1 border-t border-[color:var(--line)] px-2 py-2 lg:hidden"
          style={{
            background: 'color-mix(in srgb, var(--paper) 92%, transparent)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          {links.slice(0, 5).map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className={clsx(
                'flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.65rem] font-semibold',
                pathname === link.to ? 'text-[color:var(--accent)]' : 'text-[color:var(--muted)]'
              )}
            >
              <link.icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.8} />
              {link.label.split(' ')[0]}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
