import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Availability } from '@/lib/models'
import { requireAuth, jsonError, jsonOk, handleApiError } from '@/lib/auth'

const setSchema = z.object({
  provider: z.string().optional(),
  weekly: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
        enabled: z.boolean().default(true),
      })
    )
    .optional(),
  breaks: z
    .array(
      z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .optional(),
  daysOff: z.array(z.coerce.date()).optional(),
  slotDurationMin: z.coerce.number().int().min(5).max(240).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    if (!['admin', 'provider'].includes(user.role)) return jsonError('Not allowed', 403)
    const body = await request.json()
    const parsed = setSchema.safeParse(body)
    if (!parsed.success) return jsonError('Invalid availability payload')

    const providerId = user.role === 'provider' ? String(user._id) : parsed.data.provider
    if (!providerId) return jsonError('provider is required')
    if (user.role === 'provider' && String(providerId) !== String(user._id)) {
      return jsonError('Not allowed', 403)
    }

    await connectDB()
    const update: any = { provider: providerId }
    if (parsed.data.weekly) update.weekly = parsed.data.weekly
    if (parsed.data.breaks) update.breaks = parsed.data.breaks
    if (parsed.data.daysOff) update.daysOff = parsed.data.daysOff
    if (parsed.data.slotDurationMin) update.slotDurationMin = parsed.data.slotDurationMin

    const availability = await Availability.findOneAndUpdate(
      { provider: providerId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    )
    return jsonOk({ availability })
  } catch (err) {
    return handleApiError(err)
  }
}
