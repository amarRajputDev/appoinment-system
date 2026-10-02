'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, Phone, Save, User2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import Badge from '@/components/Badge'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const { theme, toggle } = useTheme()
  const [form, setForm] = useState({ name: '', phone: '', password: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', password: '' })
  }, [user])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = { name: form.name, phone: form.phone }
      if (form.password) payload.password = form.password
      const data = await api.patch('/api/users/me', payload)
      setUser(data.user)
      setForm((f) => ({ ...f, password: '' }))
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your personal details, contact info, and password."
      />

      <Card className="p-5 sm:p-6 lg:p-7">
        <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-7 sm:gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg sm:h-16 sm:w-16"
            style={{ background: 'linear-gradient(145deg, #ea580c, #9a3412)' }}
          >
            <User2 className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">{user?.name}</div>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Badge status={user?.role} />
              <Badge status={user?.isActive ? 'active' : 'inactive'} />
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={save}>
          <div>
            <label className="label">Name</label>
            <div className="relative">
              <User2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <input className="input input-icon" value={form.name} onChange={set('name')} required minLength={2} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <input className="input input-icon" value={user?.email || ''} disabled />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <input className="input input-icon" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div>
            <label className="label">New password (optional)</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Leave blank to keep current"
            />
          </div>
          <button className="btn-primary" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </Card>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <div className="font-semibold tracking-tight">Appearance</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Currently on {theme} mode
          </div>
        </div>
        <button className="btn-secondary shrink-0" onClick={toggle}>
          Switch to {theme === 'dark' ? 'light' : 'dark'}
        </button>
      </Card>
    </div>
  )
}
