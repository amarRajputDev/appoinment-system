'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'
import { PageSkeleton } from '@/components/Skeleton'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const defaultWeekly = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  start: '09:00',
  end: '17:00',
  enabled: day !== 0 && day !== 6,
}))

export default function AvailabilityPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const isAdmin = user?.role === 'admin'
  const [providerId, setProviderId] = useState(searchParams.get('provider') || user?._id || '')
  const [providers, setProviders] = useState<any[]>([])
  const [weekly, setWeekly] = useState(defaultWeekly)
  const [breaks, setBreaks] = useState([{ start: '12:00', end: '13:00' }])
  const [daysOff, setDaysOff] = useState<string[]>([])
  const [newOff, setNewOff] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?._id && !searchParams.get('provider')) setProviderId(user._id)
  }, [user, searchParams])

  useEffect(() => {
    if (!isAdmin) return
    api
      .get('/api/users?role=provider&limit=100')
      .then((d) => setProviders(d.users || []))
      .catch(() => {})
  }, [isAdmin])

  useEffect(() => {
    if (!providerId) return
    setLoading(true)
    api
      .get(`/api/availability/${providerId}`)
      .then((d) => {
        const a = d.availability
        if (a?.weekly?.length) setWeekly(a.weekly)
        if (a?.breaks) setBreaks(a.breaks)
        if (a?.daysOff) setDaysOff(a.daysOff.map((x: string) => x.slice(0, 10)))
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [providerId])

  const save = async () => {
    try {
      await api.put('/api/availability', { provider: providerId, weekly, breaks, daysOff })
      toast.success('Availability saved')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const updateDay = (day: number, patch: any) => {
    setWeekly((w) => w.map((item) => (item.day === day ? { ...item, ...patch } : item)))
  }

  if (!providerId) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hours"
        title="Availability"
        description="Working hours, breaks, and days off that drive live slot generation."
        actions={<button className="btn-primary" onClick={save}>Save availability</button>}
      />

      {isAdmin && (
        <Card>
          <label className="label">Provider</label>
          <select className="input" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
            {providers.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </Card>
      )}

      {loading ? (
        <PageSkeleton />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {DAYS.map((label, idx) => {
              const day = weekly.find((w) => w.day === idx) || defaultWeekly[idx]
              return (
                <Card key={label}>
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold">{label}</label>
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) => updateDay(idx, { enabled: e.target.checked })}
                      className="h-4 w-4 accent-[color:var(--accent)]"
                    />
                  </div>
                  <div className={`mt-3 grid grid-cols-2 gap-3 ${day.enabled ? '' : 'pointer-events-none opacity-40'}`}>
                    <div>
                      <label className="label">Start</label>
                      <input type="time" className="input" value={day.start} onChange={(e) => updateDay(idx, { start: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">End</label>
                      <input type="time" className="input" value={day.end} onChange={(e) => updateDay(idx, { end: e.target.value })} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Breaks</h2>
              <button className="btn-secondary text-xs" onClick={() => setBreaks((b) => [...b, { start: '12:00', end: '13:00' }])}>
                <Plus className="h-3.5 w-3.5" /> Add break
              </button>
            </div>
            <div className="space-y-2">
              {breaks.map((b, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    className="input w-32"
                    value={b.start}
                    onChange={(e) => setBreaks((list) => list.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                  />
                  <span style={{ color: 'var(--muted)' }}>to</span>
                  <input
                    type="time"
                    className="input w-32"
                    value={b.end}
                    onChange={(e) => setBreaks((list) => list.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                  />
                  <button className="btn-danger p-2" onClick={() => setBreaks((list) => list.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {breaks.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No breaks configured.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Days off</h2>
            <div className="flex flex-wrap gap-2">
              {daysOff.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-500">
                  {d}
                  <button onClick={() => setDaysOff((list) => list.filter((x) => x !== d))} aria-label="Remove day off">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input type="date" className="input w-auto" value={newOff} onChange={(e) => setNewOff(e.target.value)} />
              <button
                className="btn-secondary"
                onClick={() => {
                  if (!daysOff.includes(newOff)) setDaysOff((list) => [...list, newOff])
                }}
              >
                <Plus className="h-4 w-4" /> Add day off
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
