import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { signToken, setAuthCookie, jsonError, jsonOk, handleApiError } from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return jsonError('Invalid credentials payload')
    const { email, password } = parsed.data
    await connectDB()
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return jsonError('Invalid email or password', 401)
    }
    if (!user.isActive) return jsonError('Account is deactivated', 403)
    await setAuthCookie(signToken(String(user._id)))
    return jsonOk({ user: user.toSafeJSON() })
  } catch (err) {
    return handleApiError(err)
  }
}
