import dayjs from 'dayjs'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Appointment, Service } from '@/lib/models'
import { requireAuth, jsonError, jsonOk, handleApiError } from '@/lib/auth'
import { isSlotAvailable } from '@/lib/slots'
import { sendStatusEmail } from '@/lib/mailer'
import { buildIcs } from '@/lib/ics'

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
  cancelReason: z.string().max(500).optional(),
})

const rescheduleSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
})

async function populateAppt(id: any) {
  return Appointment.findById(id)
    .populate('client', 'name email phone role')
    .populate('provider', 'name email phone role')
    .populate('service', 'title durationMin price category')
}

function canAccess(user: any, appointment: any) {
  if (user.role === 'admin') return true
  return (
    String(appointment.client?._id || appointment.client) === String(user._id) ||
    String(appointment.provider?._id || appointment.provider) === String(user._id)
  )
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    const { id } = await context.params
    await connectDB()
    const appointment = await populateAppt(id)
    if (!appointment) return jsonError('Appointment not found', 404)
    if (!canAccess(user, appointment)) return jsonError('Not allowed', 403)

    if (new URL(request.url).searchParams.get('format') === 'ics') {
      const ics = buildIcs({
        appointment,
        client: appointment.client,
        provider: appointment.provider,
        service: appointment.service,
      })
      return new Response(ics, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="appointment-${id}.ics"`,
        },
      })
    }

    return jsonOk({ appointment })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'status'
    const body = await request.json()

    await connectDB()
    const appointment = await Appointment.findById(id)
    if (!appointment) return jsonError('Appointment not found', 404)
    if (!canAccess(user, appointment)) return jsonError('Not allowed', 403)

    const isClient = String(appointment.client) === String(user._id)
    const isProvider = String(appointment.provider) === String(user._id)

    if (mode === 'status') {
      const parsed = statusSchema.safeParse(body)
      if (!parsed.success) return jsonError('Invalid status')
      const { status, cancelReason } = parsed.data

      if (user.role === 'client') {
        if (!isClient) return jsonError('Not allowed', 403)
        if (status !== 'cancelled') return jsonError('Clients can only cancel appointments', 403)
      }

      appointment.status = status
      if (status === 'cancelled') appointment.cancelReason = cancelReason || 'Cancelled'
      await appointment.save()

      const populated = await populateAppt(id)
      if (['confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) {
        const labels: Record<string, string> = {
          confirmed: 'confirmed',
          cancelled: 'cancelled',
          completed: 'completed',
          no_show: 'marked as no-show',
        }
        await sendStatusEmail({
          appointment,
          client: populated.client,
          provider: populated.provider,
          service: populated.service,
          statusLabel: labels[status],
        })
      }
      return jsonOk({ appointment: populated })
    }

    if (mode === 'reschedule') {
      const parsed = rescheduleSchema.safeParse(body)
      if (!parsed.success) return jsonError('date and startTime are required')
      const { date, startTime } = parsed.data

      const serviceDoc = await Service.findById(appointment.service)
      const duration = serviceDoc?.durationMin || 30
      const [h, m] = String(startTime).split(':').map(Number)
      const endMin = (h || 0) * 60 + (m || 0) + duration
      const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
      const newDate = dayjs(date).startOf('day')
      if (!newDate.isValid()) return jsonError('Invalid date')

      const available = await isSlotAvailable({
        providerId: String(appointment.provider),
        date: newDate.toDate(),
        startTime,
        endTime,
      })
      if (!available) {
        return jsonError('The new time slot is not available. Please pick another slot.', 409)
      }

      appointment.date = newDate.toDate()
      appointment.startTime = startTime
      appointment.endTime = endTime
      appointment.status = user.role === 'client' ? 'pending' : appointment.status
      appointment.reminderSent = false
      await appointment.save()

      const populated = await populateAppt(id)
      await sendStatusEmail({
        appointment,
        client: populated.client,
        provider: populated.provider,
        service: populated.service,
        statusLabel: 'rescheduled',
      })
      return jsonOk({ appointment: populated })
    }

    return jsonError('Unknown mode')
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    const { id } = await context.params
    await connectDB()
    const appointment = await Appointment.findById(id)
    if (!appointment) return jsonError('Appointment not found', 404)
    if (!canAccess(user, appointment)) return jsonError('Not allowed', 403)
    await appointment.deleteOne()
    return jsonOk({ message: 'Appointment deleted' })
  } catch (err) {
    return handleApiError(err)
  }
}
