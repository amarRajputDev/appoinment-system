import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { sendPasswordResetEmail } from '@/lib/mailer'
import { jsonError, jsonOk, handleApiError } from '@/lib/auth'

const schema = z.object({ email: z.string().email() })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return jsonError('Valid email is required')
    await connectDB()
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
      user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000)
      await user.save({ validateBeforeSave: false })
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}`
      await sendPasswordResetEmail({ to: user.email, resetUrl, name: user.name })
    }
    return jsonOk({ message: 'If that email exists, a reset link was sent' })
  } catch (err) {
    return handleApiError(err)
  }
}
