'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import Badge from '@/components/Badge'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'
import { PageSkeleton } from '@/components/Skeleton'

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => dayjs().startOf('month'))
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selected, setSelected] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const reqIdRef = useRef(0)

  const rangeKey =
    view === 'month'
      ? `${cursor.format('YYYY-MM')}|month`
      : `${cursor.startOf('week').format('YYYY-MM-DD')}|week`

  const fromStr =
    view === 'month' ? cursor.startOf('month').format('YYYY-MM-DD') : cursor.startOf('week').format('YYYY-MM-DD')
  const toStr =
    view === 'month' ? cursor.endOf('month').format('YYYY-MM-DD') : cursor.endOf('week').format('YYYY-MM-DD')

  useEffect(() => {
    const reqId = ++reqIdRef.current
    const qs = new URLSearchParams({ from: fromStr, to: toStr, limit: '200' })
    api
      .get(`/api/appointments?${qs}`)
      .then((d) => {
        if (reqId !== reqIdRef.current) return
        setAppointments(d.appointments || [])
      })
      .catch((e) => {
        if (reqId !== reqIdRef.current) return
        toast.error(e.message)
      })
      .finally(() => {
        if (reqId !== reqIdRef.current) return
        setLoading(false)
      })
  }, [fromStr, toStr, rangeKey])

  const byDay = useMemo(() => {
    const map = new Map<string, any[]>()
    appointments.forEach((a) => {
      const key = dayjs(a.date).format('YYYY-MM-DD')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    })
    return map
  }, [appointments])

  const monthDays = useMemo(() => {
    const start = cursor.startOf('month')
    const end = cursor.endOf('month')
    const days: (dayjs.Dayjs | null)[] = []
    const lead = start.day()
    for (let i = 0; i < lead; i++) days.push(null)
    let d = start
    while (d.format('YYYY-MM-DD') <= end.format('YYYY-MM-DD')) {
      days.push(d)
      d = d.add(1, 'day')
    }
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [cursor])

  const weekDays = useMemo(() => {
    const start = cursor.startOf('week')
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
  }, [cursor])

  const selectedItems = selected ? byDay.get(selected) || [] : []
  const todayKey = dayjs().format('YYYY-MM-DD')
  const isFetching = loading && appointments.length === 0

  if (isFetching) return <PageSkeleton />

  return (
    <div className={`space-y-6 transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
      <PageHeader
        eyebrow="Timeline"
        title="Calendar"
        description={
          view === 'month'
            ? cursor.format('MMMM YYYY')
            : `${weekDays[0].format('MMM D')} – ${weekDays[6].format('MMM D, YYYY')}`
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]">
              {(['month', 'week'] as const).map((v) => (
                <button
                  key={v}
                  className={`px-3.5 py-2 text-sm font-semibold capitalize transition ${
                    view === v ? 'text-white' : ''
                  }`}
                  style={
                    view === v
                      ? {
                          background: 'linear-gradient(135deg, #ea580c, #9a3412)',
                          boxShadow: '0 8px 18px -8px rgba(234,88,12,0.5)',
                        }
                      : { color: 'var(--muted)' }
                  }
                  onClick={() => {
                    if (view === v) return
                    setView(v)
                    setSelected(null)
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              className="btn-secondary p-2"
              onClick={() => setCursor((c) => c.subtract(1, view === 'month' ? 'month' : 'week'))}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="btn-secondary px-3 py-2"
              onClick={() => setCursor(dayjs().startOf(view === 'month' ? 'month' : 'week'))}
            >
              Today
            </button>
            <button
              className="btn-secondary p-2"
              onClick={() => setCursor((c) => c.add(1, view === 'month' ? 'month' : 'week'))}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div
        className="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-bold tracking-[0.12em] uppercase"
        style={{ color: 'var(--muted)' }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
        {(view === 'month' ? monthDays : weekDays).map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="min-h-[6.5rem]" />
          const key = day.format('YYYY-MM-DD')
          const items = byDay.get(key) || []
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`cal-day ${selected === key ? 'selected' : ''} ${key === todayKey ? 'today' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold">{day.date()}</span>
                {items.length > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                )}
              </div>
              <div className="mt-1.5 space-y-1">
                {items.length === 0 ? (
                  <div className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
                    No visits
                  </div>
                ) : (
                  <>
                    {items.slice(0, 3).map((a) => (
                      <div
                        key={a._id}
                        className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          background:
                            a.status === 'cancelled'
                              ? 'rgba(190,18,60,0.12)'
                              : 'color-mix(in srgb, var(--accent) 14%, transparent)',
                          color: a.status === 'cancelled' ? '#e11d48' : 'var(--accent)',
                        }}
                      >
                        {a.startTime} {a.service?.title}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                        +{items.length - 3} more
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <div className="eyebrow mb-1">Day detail</div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {selected ? dayjs(selected).format('dddd, MMM D') : 'Select a day'}
            </h2>
          </div>
          {selected && (
            <Badge status={selectedItems.length ? 'confirmed' : 'pending'}>
              {selectedItems.length} visit{selectedItems.length === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
        {!selected ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Tap a calendar day to see appointments for that date.
          </p>
        ) : selectedItems.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            No appointments on this day.
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--line)]">
            {selectedItems.map((a) => (
              <li key={a._id} className="flex flex-wrap items-center gap-3 py-3">
                <CalendarDays className="h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold tracking-tight">{a.service?.title}</div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>
                    {a.provider?.name} · {a.startTime}–{a.endTime}
                  </div>
                </div>
                <Badge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
