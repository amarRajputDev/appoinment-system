'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('admin@demo.com')
  const [password, setPassword] = useState('Admin@123')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`)
      router.replace(searchParams.get('from') || '/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-aside-grid" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 3v3M17 3v3M4.5 9.5h15M6 6.5h12a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="9" cy="13.5" r="1" fill="currentColor" />
              <circle cx="15" cy="13.5" r="1" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Tempo</div>
            <div className="text-[0.65rem] tracking-[0.18em] uppercase opacity-55">Appointment Studio</div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-4 text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: '#fdba74' }}>
            Welcome back
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Your schedule,
            <br />
            back in rhythm.
          </h1>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Sign in to manage bookings, availability, and client visits —
            all in one calm workspace.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            {['Live slot protection', 'Role-based workspaces', 'Calendar & ICS export'].map((t) => (
              <div key={t} className="flex items-center gap-2.5 opacity-80">
                <span className="h-1.5 w-1.5 rounded-full bg-[#fb923c]" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs opacity-45">
          © {new Date().getFullYear()} Tempo Studio
        </div>
      </aside>

      <div className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <div className="eyebrow mb-2">Sign in</div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Enter the studio</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Use your Tempo credentials to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                <input
                  id="email"
                  className="input input-icon"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                <input
                  id="password"
                  className="input input-icon"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="font-medium text-[color:var(--accent)] hover:underline">
              Forgot password?
            </Link>
            <Link href="/register" className="font-medium text-[color:var(--accent)] hover:underline">
              Create account
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-dashed border-[color:var(--line)] bg-[color:var(--accent-soft)] p-4">
            <div className="text-[0.68rem] font-bold tracking-[0.12em] uppercase" style={{ color: 'var(--accent)' }}>
              Demo access
            </div>
            <div className="mt-1.5 font-mono text-sm" style={{ color: 'var(--ink)' }}>
              admin@demo.com / Admin@123
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              Clients: client1@demo.com / Client@123
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
