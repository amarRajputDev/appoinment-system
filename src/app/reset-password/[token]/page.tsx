'use client'
import { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/api/auth/reset-password/${token}`, { password })
      toast.success('Password updated')
      router.replace('/login')
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
            <div className="text-[0.65rem] tracking-[0.18em] uppercase opacity-55">Secure reset</div>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            New key,
            <br />
            same rhythm.
          </h1>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Choose a strong password to restore access to your workspace.
          </p>
        </div>
        <div className="relative z-10 text-xs opacity-45">© {new Date().getFullYear()} Tempo Studio</div>
      </aside>

      <div className="relative flex items-center justify-center px-4 py-10 sm:px-10 sm:py-12">
        <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">
          <div className="eyebrow mb-2">Reset password</div>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Set a new password</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Minimum 6 characters. Keep it private.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-5 sm:mt-8">
            <div>
              <label className="label" htmlFor="password">New password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                <input
                  id="password"
                  className="input input-icon"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <button className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>

          <p className="mt-6 text-sm">
            <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-[color:var(--accent)] hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
