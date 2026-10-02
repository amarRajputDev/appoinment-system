import dayjs from 'dayjs'
import { Availability, Appointment } from './models'

function toMinutes(hhmm: string) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function toHHMM(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd
}

export async function getAvailability(providerId: string) {
  let availability = await Availability.findOne({ provider: providerId })
  if (!availability) {
    availability = await Availability.create({
      provider: providerId,
      weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        start: '09:00',
        end: '17:00',
        enabled: day !== 0 && day !== 6,
      })),
      breaks: [{ start: '12:00', end: '13:00' }],
      daysOff: [],
      slotDurationMin: 30,
    })
  }
  return availability
}

export async function generateSlots({
  providerId,
  date,
  serviceDurationMin = 30,
  slotDurationMin,
}: {
  providerId: string
  date: string | Date
  serviceDurationMin?: number
  slotDurationMin?: number
}) {
  const target = dayjs(date).startOf('day')
  if (!target.isValid()) return []

  const availability = await getAvailability(providerId)
  const day = target.day()
  const weekly = (availability.weekly || []).find((w: any) => w.day === day)
  if (!weekly || !weekly.enabled) return []

  const isDayOff = (availability.daysOff || []).some(
    (d: Date) => dayjs(d).format('YYYY-MM-DD') === target.format('YYYY-MM-DD')
  )
  if (isDayOff) return []

  const duration = Number(slotDurationMin || serviceDurationMin || availability.slotDurationMin || 30)
  const startMin = toMinutes(weekly.start)
  const endMin = toMinutes(weekly.end)
  const breaks = (availability.breaks || []).map((b: any) => ({
    start: toMinutes(b.start),
    end: toMinutes(b.end),
  }))

  const existing = await Appointment.find({
    provider: providerId,
    date: { $gte: target.toDate(), $lt: target.add(1, 'day').toDate() },
    status: { $in: ['pending', 'confirmed'] },
  }).select('startTime endTime')

  const busy = existing.map((a: any) => ({
    start: toMinutes(a.startTime),
    end: toMinutes(a.endTime),
  }))

  const now = dayjs()
  const slots: { startTime: string; endTime: string }[] = []

  for (let t = startMin; t + duration <= endMin; t += duration) {
    const slotEnd = t + duration
    const startStr = toHHMM(t)
    const endStr = toHHMM(slotEnd)

    const inBreak = breaks.some((b: { start: number; end: number }) => overlaps(t, slotEnd, b.start, b.end))
    if (inBreak) continue
    const isBusy = busy.some((b: { start: number; end: number }) => overlaps(t, slotEnd, b.start, b.end))
    if (isBusy) continue

    const slotStart = target.hour(Math.floor(t / 60)).minute(t % 60)
    if (slotStart.isBefore(now)) continue
    slots.push({ startTime: startStr, endTime: endStr })
  }

  return slots
}

export async function isSlotAvailable({
  providerId,
  date,
  startTime,
  endTime,
}: {
  providerId: string
  date: string | Date
  startTime: string
  endTime: string
}) {
  const availability = await getAvailability(providerId)
  const target = dayjs(date)
  const day = target.day()
  const weekly = (availability.weekly || []).find((w: any) => w.day === day)
  if (!weekly || !weekly.enabled) return false

  const isDayOff = (availability.daysOff || []).some(
    (d: Date) => dayjs(d).format('YYYY-MM-DD') === target.format('YYYY-MM-DD')
  )
  if (isDayOff) return false

  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  if (start < toMinutes(weekly.start) || end > toMinutes(weekly.end)) return false

  const breaks = (availability.breaks || []).map((b: any) => ({
    start: toMinutes(b.start),
    end: toMinutes(b.end),
  }))
  if (breaks.some((b: { start: number; end: number }) => overlaps(start, end, b.start, b.end))) {
    return false
  }

  const existing = await Appointment.find({
    provider: providerId,
    date: { $gte: target.startOf('day').toDate(), $lt: target.add(1, 'day').toDate() },
    status: { $in: ['pending', 'confirmed'] },
  })

  return !existing.some((a: any) =>
    overlaps(start, end, toMinutes(a.startTime), toMinutes(a.endTime))
  )
}
