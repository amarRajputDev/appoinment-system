import dayjs from 'dayjs'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Appointment, Service, User } from '@/lib/models'
import { requireAuth, jsonError, jsonOk, handleApiError } from '@/lib/auth'
import { isSlotAvailable } from '@/lib/slots'
import { sendBookingEmails } from '@/lib/mailer'

const createSchema = z.object({
  provider: z.string().min(1),
  service: z.string().min(1),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(1000).optional().default(''),
})

function scopeFilter(user: any): Record<string, any> {
  if (user.role === 'admin') return {}
  if (user.role === 'provider') return { provider: user._id }
  return { client: user._id }
}

async function populateAppt(query: any) {
  return query
    .populate('client', 'name email phone role')
    .populate('provider', 'name email phone role')
    .populate('service', 'title durationMin price category')
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    const { searchParams } = new URL(request.url)
    const filter = scopeFilter(user)

    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Number(searchParams.get('limit') || 20))
    const provider = searchParams.get('provider')
    const client = searchParams.get('client')

    if (status) filter.status = status
    if (provider && user.role === 'admin') filter.provider = provider
    if (client && user.role === 'admin') filter.client = client
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = dayjs(from).startOf('day').toDate()
      if (to) filter.date.$lte = dayjs(to).endOf('day').toDate()
    }
    if (search) {
      const regex = { $regex: search, $options: 'i' }
      filter.$or = [{ notes: regex }, { startTime: regex }, { endTime: regex }]
    }

    await connectDB()
    const [items, total] = await Promise.all([
      populateAppt(
        Appointment.find(filter)
          .sort({ date: -1, startTime: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
      ),
      Appointment.countDocuments(filter),
    ])

    return jsonOk({
      appointments: items,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return jsonError('provider, service, date and startTime are required')

    const { provider, service, date, startTime, notes } = parsed.data
    if (user.role === 'client' && String(provider) === String(user._id)) {
      return jsonError('You cannot book an appointment with yourself')
    }

    await connectDB()
    const serviceDoc = await Service.findById(service)
    if (!serviceDoc || !serviceDoc.isActive) return jsonError('Service not found or inactive', 404)
    if (String(serviceDoc.provider) !== String(provider)) {
      return jsonError('Service does not belong to the selected provider')
    }

    const duration = serviceDoc.durationMin
    const [h, m] = String(startTime).split(':').map(Number)
    const endMin = (h || 0) * 60 + (m || 0) + duration
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

    const day = dayjs(date).startOf('day')
    if (!day.isValid()) return jsonError('Invalid date')

    const available = await isSlotAvailable({
      providerId: String(provider),
      date: day.toDate(),
      startTime,
      endTime,
    })
    if (!available) {
      return jsonError('This time slot is not available. Please choose another slot.', 409)
    }

    let appointment: any
    try {
      appointment = await Appointment.create({
        client: user._id,
        provider,
        service: serviceDoc._id,
        date: day.toDate(),
        startTime,
        endTime,
        notes: notes || '',
        status: user.role === 'admin' ? 'confirmed' : 'pending',
      })
    } catch (err: any) {
      if (err.code === 11000) {
        return jsonError('This time slot was just booked. Please pick another slot.', 409)
      }
      throw err
    }

    const populated = await populateAppt(Appointment.findById(appointment._id))
    try {
      const providerUser = await User.findById(provider)
      await sendBookingEmails({
        appointment,
        client: user,
        provider: providerUser,
        service: serviceDoc,
      })
    } catch (mailErr) {
      console.error('[appointments] email failed:', mailErr)
    }

    return jsonOk({ appointment: populated }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
