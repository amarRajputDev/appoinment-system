import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { signToken, setAuthCookie, jsonError, jsonOk, handleApiError } from '@/lib/auth'

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  role: z.enum(['provider', 'client']).optional(),
  phone: z.string().max(20).optional().default(''),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'Validation failed')
    }
    const { name, email, password, role, phone } = parsed.data
    await connectDB()
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return jsonError('Email already registered', 409)
    const user = await User.create({ name, email, password, role: role || 'client', phone })
    await setAuthCookie(signToken(String(user._id)))
    return jsonOk({ user: user.toSafeJSON() }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
