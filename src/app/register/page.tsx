'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowRight, Mail, Phone, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client', phone: '' })
  const [loading, setLoading] = useState(false)
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Welcome to Tempo')
      router.replace('/dashboard')
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
            </svg>
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Tempo</div>
            <div className="text-[0.65rem] tracking-[0.18em] uppercase opacity-55">Appointment Studio</div>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <div className="mb-4 text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: '#fdba74' }}>
            Join the studio
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Start booking
            <br />
            with intention.
          </h1>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Create an account as a client or provider. Admins can be assigned from the team workspace.
          </p>
        </div>
        <div className="relative z-10 text-xs opacity-45">© {new Date().getFullYear()} Tempo Studio</div>
      </aside>

      <div className="relative flex items-center justify-center px-4 py-10 sm:px-10 sm:py-12">
        <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">
          <div className="mb-6 sm:mb-8">
            <div className="eyebrow mb-2">Create account</div>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Open your workspace</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Takes less than a minute.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                <input className="input input-icon" value={form.name} onChange={set('name')} required minLength={2} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                  <input className="input input-icon" type="email" value={form.email} onChange={set('email')} required />
                </div>
              </div>
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                  <input className="input input-icon" value={form.phone} onChange={set('phone')} />
                </div>
              </div>
            </div>
            <div>
              <label className="label">I am a…</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="client">Client — book appointments</option>
                <option value="provider">Provider — offer services</option>
              </select>
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>
            <button className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-5 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[color:var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
