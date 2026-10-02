import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { Service, User } from '@/lib/models'
import { requireAuth, jsonError, jsonOk, handleApiError } from '@/lib/auth'
import { generateSlots } from '@/lib/slots'
import { getAvailability } from '@/lib/slots'

export async function GET(request: NextRequest, context: { params: Promise<{ providerId: string }> }) {
  try {
    const { error } = await requireAuth(request)
    if (error) return error
    const { providerId } = await context.params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    if (!date) return jsonError('date query param is required (YYYY-MM-DD)')

    await connectDB()
    let serviceDurationMin = 30
    if (serviceId) {
      const service = await Service.findById(serviceId)
      if (service) serviceDurationMin = service.durationMin
    }
    const availability = await getAvailability(providerId)
    const slots = await generateSlots({
      providerId,
      date,
      serviceDurationMin,
      slotDurationMin: availability.slotDurationMin,
    })
    return jsonOk({ slots, date })
  } catch (err) {
    return handleApiError(err)
  }
}
