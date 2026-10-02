import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { jsonError, jsonOk, handleApiError } from '@/lib/auth'

const schema = z.object({ password: z.string().min(6).max(72) })

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return jsonError('Password must be at least 6 characters')
    await connectDB()
    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetToken: hashed,
      resetTokenExpires: { $gt: new Date() },
    }).select('+password')
    if (!user) return jsonError('Reset link is invalid or expired', 400)
    user.password = parsed.data.password
    user.resetToken = undefined
    user.resetTokenExpires = undefined
    await user.save()
    return jsonOk({ message: 'Password updated. You can now log in.' })
  } catch (err) {
    return handleApiError(err)
  }
}
