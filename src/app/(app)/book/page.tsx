'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { CalendarDays, CheckCircle2, Clock, Sparkles, User2 } from 'lucide-react'
import { api } from '@/lib/api'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'
import { TableSkeleton } from '@/components/Skeleton'

const steps = ['Service', 'Provider', 'Date & slot', 'Confirm']

function StepBar({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <div className="panel flex flex-wrap items-center gap-2 p-2.5">
      {steps.map((s, i) => {
        const state = i < step ? 'done' : i === step ? 'current' : 'todo'
        return (
          <button
            key={s}
            type="button"
            onClick={() => onJump(i)}
            disabled={i > step}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              state === 'current'
                ? 'text-white shadow-lg'
                : state === 'done'
                ? 'text-[color:var(--teal)]'
                : 'text-[color:var(--muted)]'
            }`}
            style={
              state === 'current'
                ? {
                    background: 'linear-gradient(135deg, #ea580c, #9a3412)',
                    boxShadow: '0 10px 22px -10px rgba(234,88,12,0.55)',
                  }
                : undefined
            }
          >
            <span
              className={`step-dot ${state === 'done' ? 'done' : ''} ${state === 'current' ? 'current' : ''}`}
            />
            <span className="text-[0.78rem] tracking-wide">{i + 1}. {s}</span>
            {state === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
        )
      })}
    </div>
  )
}

export default function BookAppointmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [services, setServices] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [serviceId, setServiceId] = useState('')
  const [providerId, setProviderId] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [startTime, setStartTime] = useState('')
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState<any[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .get('/api/services?limit=100')
      .then((d) => {
        setServices(d.services || [])
        const map = new Map<string, any>()
        ;(d.services || []).forEach((s: any) => {
          if (s.provider) map.set(s.provider._id, s.provider)
        })
        setProviders([...map.values()])
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const selectedService = services.find((s) => s._id === serviceId)
  const selectedProvider = providers.find((p) => p._id === providerId)

  useEffect(() => {
    if (!providerId || !date) return
    setSlotsLoading(true)
    setStartTime('')
    const qs = new URLSearchParams({ date, ...(serviceId ? { serviceId } : {}) })
    api
      .get(`/api/availability/${providerId}/slots?${qs}`)
      .then((d) => setSlots(d.slots || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setSlotsLoading(false))
  }, [providerId, date, serviceId])

  const canNext =
    (step === 0 && serviceId) ||
    (step === 1 && providerId) ||
    (step === 2 && startTime) ||
    step === 3

  const submit = async () => {
    setSubmitting(true)
    try {
      await api.post('/api/appointments', {
        provider: providerId,
        service: serviceId,
        date,
        startTime,
        notes,
      })
      toast.success('Appointment requested')
      router.push('/appointments')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Book"
        title="Reserve a visit"
        description="Choose a service, pick your professional, and lock in an open slot."
      />

      <StepBar step={step} onJump={setStep} />

      <Card className="p-5 sm:p-7">
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-[color:var(--accent)]" /> Select a service
            </div>
            {loading ? (
              <TableSkeleton rows={4} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => {
                      setServiceId(s._id)
                      setProviderId(s.provider?._id || '')
                      setStartTime('')
                    }}
                    className={`panel panel-hover p-4 text-left transition ${
                      serviceId === s._id ? 'border-[color:var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]' : ''
                    }`}
                    style={serviceId === s._id ? { borderColor: 'var(--accent)' } : undefined}
                  >
                    <div className="font-display font-semibold tracking-tight">{s.title}</div>
                    <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                      {s.category} · {s.durationMin} min
                    </div>
                    <div className="font-display mt-3 text-lg font-semibold text-[color:var(--accent)]">
                      ${s.price}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User2 className="h-4 w-4 text-[color:var(--accent)]" /> Choose a professional
            </div>
            {providers.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => {
                  setProviderId(p._id)
                  setStartTime('')
                }}
                className={`panel panel-hover flex w-full items-center gap-3 p-4 text-left ${
                  providerId === p._id ? 'border-[color:var(--accent)]' : ''
                }`}
                style={providerId === p._id ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' } : undefined}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                  style={{ background: 'linear-gradient(145deg, #ea580c, #9a3412)' }}
                >
                  <User2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>{p.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                min={dayjs().format('YYYY-MM-DD')}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-[color:var(--accent)]" /> Available slots
              </div>
              {slotsLoading ? (
                <TableSkeleton rows={3} />
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  No free slots for this date. Try another day.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => setStartTime(slot.startTime)}
                      className={`slot-chip ${startTime === slot.startTime ? 'selected' : ''}`}
                    >
                      {slot.startTime} – {slot.endTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input min-h-[88px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-[color:var(--accent)]" /> Review booking
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { k: 'Service', v: selectedService?.title },
                { k: 'Duration', v: `${selectedService?.durationMin ?? '—'} min` },
                { k: 'Price', v: `$${selectedService?.price ?? '—'}` },
                { k: 'Provider', v: selectedProvider?.name },
                { k: 'When', v: `${dayjs(date).format('MMM D, YYYY')} · ${startTime}` },
                { k: 'Status', v: 'Pending until confirmed' },
              ].map((row) => (
                <div key={row.k} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--paper)] p-3.5">
                  <div className="text-[0.68rem] font-bold tracking-[0.1em] uppercase" style={{ color: 'var(--muted)' }}>
                    {row.k}
                  </div>
                  <div className="mt-1 font-semibold">{row.v}</div>
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Your appointment will start as <strong>pending</strong> until the provider confirms it.
            </p>
          </div>
        )}

        <div className="mt-7 flex justify-between gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          {step < 3 ? (
            <button type="button" className="btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={submitting} onClick={submit}>
              {submitting ? 'Booking…' : 'Confirm booking'}
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
