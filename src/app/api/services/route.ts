import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Service, User } from '@/lib/models'
import { requireAuth, jsonError, jsonOk, handleApiError } from '@/lib/auth'

const schema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional().default(''),
  durationMin: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0),
  category: z.string().max(60).optional().default('General'),
  provider: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = Number(searchParams.get('page') || 1)
    const limit = Math.min(100, Number(searchParams.get('limit') || 50))
    const all = searchParams.get('all')

    const filter: any = {}
    if (!all || user.role === 'client') filter.isActive = true
    if (provider) filter.provider = provider
    if (category) filter.category = category
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    await connectDB()
    const [items, total] = await Promise.all([
      Service.find(filter)
        .populate('provider', 'name email role')
        .sort({ createdAt: -1 })
        .skip((Math.max(1, page) - 1) * limit)
        .limit(limit),
      Service.countDocuments(filter),
    ])

    return jsonOk({
      services: items,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    if (!['admin', 'provider'].includes(user.role)) return jsonError('Not allowed', 403)

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'Invalid service')

    let providerId = parsed.data.provider
    if (!providerId) {
      if (user.role === 'provider') providerId = String(user._id)
      else return jsonError('provider is required')
    }
    if (user.role === 'provider' && String(providerId) !== String(user._id)) {
      return jsonError('Providers can only create their own services', 403)
    }

    await connectDB()
    const providerUser = await User.findById(providerId)
    if (!providerUser || providerUser.role !== 'provider') {
      return jsonError('Provider not found')
    }

    const service = await Service.create({ ...parsed.data, provider: providerId })
    return jsonOk({ service }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
