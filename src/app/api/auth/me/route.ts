import { requireAuth, jsonOk } from '@/lib/auth'

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request)
  if (error) return error
  return jsonOk({ user: user.toSafeJSON() })
}
