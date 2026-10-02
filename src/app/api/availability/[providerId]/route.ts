import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAvailability } from '@/lib/slots'
import { requireAuth, jsonOk, handleApiError } from '@/lib/auth'

export async function GET(request: NextRequest, context: { params: Promise<{ providerId: string }> }) {
  try {
    const { error } = await requireAuth(request)
    if (error) return error
    const { providerId } = await context.params
    await connectDB()
    const availability = await getAvailability(providerId)
    return jsonOk({ availability })
  } catch (err) {
    return handleApiError(err)
  }
}
