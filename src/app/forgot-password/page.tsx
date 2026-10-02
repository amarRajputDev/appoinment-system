'use client'
import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent if the email exists')
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
            <div className="text-[0.65rem] tracking-[0.18em] uppercase opacity-55">Account recovery</div>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Get back to
            <br />
            your studio.
          </h1>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            We&apos;ll send a secure reset link to the email on file.
          </p>
        </div>
        <div className="relative z-10 text-xs opacity-45">© {new Date().getFullYear()} Tempo Studio</div>
      </aside>

      <div className="relative flex items-center justify-center px-4 py-10 sm:px-10 sm:py-12">
        <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">
          <div className="eyebrow mb-2">Recover access</div>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Forgot password</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Enter your account email to receive a reset link.
          </p>

          {sent ? (
            <div className="panel mt-6 border-emerald-600/30 p-5 sm:mt-8 sm:p-6">
              <div className="eyebrow mb-2" style={{ color: 'var(--teal)' }}>Check inbox</div>
              <p className="text-sm leading-relaxed">
                If an account exists for that email, a reset link is on its way.
                Without SMTP configured, the link also appears in server logs.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-5 sm:mt-8">
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
                  />
                </div>
              </div>
              <button className="btn-primary w-full py-3" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

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
