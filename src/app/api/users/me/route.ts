import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { requireAuth, jsonError, jsonOk, handleApiError } from '@/lib/auth'

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().optional(),
  password: z.string().min(6).max(72).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return jsonError('Invalid profile payload')
    await connectDB()
    const updates: any = { ...parsed.data }
    const updated = await User.findByIdAndUpdate(user._id, updates, {
      new: true,
      runValidators: true,
    })
    return jsonOk({ user: updated.toSafeJSON() })
  } catch (err) {
    return handleApiError(err)
  }
}
