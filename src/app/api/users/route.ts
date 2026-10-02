import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { requireRole, jsonError, jsonOk, handleApiError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireRole(request, ['admin'])
    if (error) return error
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = Number(searchParams.get('page') || 1)
    const limit = Math.min(100, Number(searchParams.get('limit') || 20))

    const filter: any = {}
    if (role) filter.role = role
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    await connectDB()
    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((Math.max(1, page) - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ])

    return jsonOk({
      users: items.map((u: any) => u.toSafeJSON()),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
