import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Service } from '@/lib/models'
import { requireAuth, jsonError, jsonOk, handleApiError } from '@/lib/auth'

const schema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  durationMin: z.coerce.number().int().min(5).max(480).optional(),
  price: z.coerce.number().min(0).optional(),
  category: z.string().max(60).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth(request)
    if (error) return error
    const { id } = await context.params
    await connectDB()
    const service = await Service.findById(id).populate('provider', 'name email role')
    if (!service) return jsonError('Service not found', 404)
    return jsonOk({ service })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    if (!['admin', 'provider'].includes(user.role)) return jsonError('Not allowed', 403)
    const { id } = await context.params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return jsonError('Invalid payload')

    await connectDB()
    const service = await Service.findById(id)
    if (!service) return jsonError('Service not found', 404)
    if (user.role === 'provider' && String(service.provider) !== String(user._id)) {
      return jsonError('Not allowed', 403)
    }
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) (service as any)[key] = value
    }
    await service.save()
    return jsonOk({ service })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    if (!['admin', 'provider'].includes(user.role)) return jsonError('Not allowed', 403)
    const { id } = await context.params
    await connectDB()
    const service = await Service.findById(id)
    if (!service) return jsonError('Service not found', 404)
    if (user.role === 'provider' && String(service.provider) !== String(user._id)) {
      return jsonError('Not allowed', 403)
    }
    if (user.role === 'admin') {
      await service.deleteOne()
      return jsonOk({ message: 'Service deleted' })
    }
    service.isActive = false
    await service.save()
    return jsonOk({ message: 'Service deactivated', service })
  } catch (err) {
    return handleApiError(err)
  }
}
