'use client'
import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { CalendarPlus, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import Badge from '@/components/Badge'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { TableSkeleton } from '@/components/Skeleton'

export default function AppointmentsPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null)
  const [newDate, setNewDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [newTime, setNewTime] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams({ page: String(page), limit: '10' })
    if (status) qs.set('status', status)
    if (search) qs.set('search', search)
    api
      .get(`/api/appointments?${qs}`)
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [status, search, page])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async () => {
    try {
      await api.patch(`/api/appointments/${cancelTarget._id}?mode=status`, {
        status: 'cancelled',
        cancelReason,
      })
      toast.success('Appointment cancelled')
      setCancelTarget(null)
      setCancelReason('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const setStatusAction = async (id: string, next: string) => {
    try {
      await api.patch(`/api/appointments/${id}?mode=status`, { status: next })
      toast.success('Status updated')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const reschedule = async () => {
    try {
      await api.patch(`/api/appointments/${rescheduleTarget._id}?mode=reschedule`, {
        date: newDate,
        startTime: newTime,
      })
      toast.success('Appointment rescheduled')
      setRescheduleTarget(null)
      setNewTime('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const downloadIcs = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}?format=ics`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to download')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appointment-${id}.ics`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const appointments = data?.appointments || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        description="Manage bookings, status changes, and calendar exports."
        actions={
          <Link href="/book" className="btn-primary">
            <CalendarPlus className="h-4 w-4" /> New booking
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input
            className="input input-icon"
            placeholder="Search…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <select
            className="input input-icon"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No show</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="Try different filters or book a new appointment."
        />
      ) : (
        <>
          <div className="panel hidden overflow-x-auto p-0 md:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>When</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a: any) => (
                  <tr key={a._id}>
                    <td>
                      <div className="font-semibold tracking-tight">{a.service?.title}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>
                        ${a.service?.price ?? '—'} · {a.service?.durationMin ?? '—'} min
                      </div>
                    </td>
                    <td>{a.provider?.name}</td>
                    <td>
                      <div className="font-medium tabular-nums">
                        {dayjs(a.date).format('MMM D, YYYY')}
                      </div>
                      <div className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                        {a.startTime}–{a.endTime}
                      </div>
                    </td>
                    <td>
                      <Badge status={a.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'confirmed'].includes(a.status) && (
                          <>
                            <button
                              className="btn-secondary px-2.5 py-1 text-xs"
                              onClick={() => {
                                setRescheduleTarget(a)
                                setNewDate(dayjs(a.date).format('YYYY-MM-DD'))
                                setNewTime(a.startTime)
                              }}
                            >
                              Reschedule
                            </button>
                            <button
                              className="btn-danger px-2.5 py-1 text-xs"
                              onClick={() => setCancelTarget(a)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {a.status === 'confirmed' && (
                          <button
                            className="btn-primary px-2.5 py-1 text-xs"
                            onClick={() => setStatusAction(a._id, 'completed')}
                          >
                            Complete
                          </button>
                        )}
                        <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => downloadIcs(a._id)}>
                          ICS
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {appointments.map((a: any) => (
              <Card key={a._id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold tracking-tight">{a.service?.title}</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>{a.provider?.name}</div>
                  </div>
                  <Badge status={a.status} />
                </div>
                <div className="mt-3 text-sm tabular-nums">
                  {dayjs(a.date).format('MMM D, YYYY')} · {a.startTime}–{a.endTime}
                </div>
                {['pending', 'confirmed'].includes(a.status) && (
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn-secondary flex-1 text-xs"
                      onClick={() => {
                        setRescheduleTarget(a)
                        setNewDate(dayjs(a.date).format('YYYY-MM-DD'))
                        setNewTime(a.startTime)
                      }}
                    >
                      Reschedule
                    </button>
                    <button className="btn-danger flex-1 text-xs" onClick={() => setCancelTarget(a)}>
                      Cancel
                    </button>
                  </div>
                )}
                {a.status === 'confirmed' && (
                  <button
                    className="btn-primary mt-2 w-full text-xs"
                    onClick={() => setStatusAction(a._id, 'completed')}
                  >
                    Mark completed
                  </button>
                )}
                <button className="btn-secondary mt-2 w-full text-xs" onClick={() => downloadIcs(a._id)}>
                  Download ICS
                </button>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--muted)' }}>
              Page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              <button
                className="btn-secondary px-3 py-1.5"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <button
                className="btn-secondary px-3 py-1.5"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <Modal open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} title="Cancel appointment">
        <p className="mb-3 text-sm" style={{ color: 'var(--muted)' }}>
          Cancel {cancelTarget?.service?.title} on{' '}
          {cancelTarget ? dayjs(cancelTarget.date).format('MMM D, YYYY') : ''}?
        </p>
        <textarea
          className="input min-h-[80px]"
          placeholder="Reason (optional)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setCancelTarget(null)}>
            Keep it
          </button>
          <button className="btn-danger" onClick={cancel}>
            Cancel appointment
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(rescheduleTarget)} onClose={() => setRescheduleTarget(null)} title="Reschedule">
        <div className="space-y-3">
          <div>
            <label className="label">New date</label>
            <input
              type="date"
              className="input"
              value={newDate}
              min={dayjs().format('YYYY-MM-DD')}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">New start time (HH:MM)</label>
            <input className="input" placeholder="10:30" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setRescheduleTarget(null)}>
            Close
          </button>
          <button className="btn-primary" disabled={!newTime} onClick={reschedule}>
            Save changes
          </button>
        </div>
      </Modal>
    </div>
  )
}
