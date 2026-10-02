import { clearAuthCookie, jsonOk } from '@/lib/auth'

export async function POST() {
  await clearAuthCookie()
  return jsonOk({ message: 'Logged out' })
}
