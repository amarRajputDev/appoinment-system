import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { connectDB } from './db'
import { User } from './models'

export const COOKIE_NAME = 'token'

export function signToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  })
}

export async function setAuthCookie(token: string) {
  const store = await cookies()
  const isProd = process.env.NODE_ENV === 'production'
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
}

export async function clearAuthCookie() {
  const store = await cookies()
  store.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getRequestUser(request?: Request) {
  let token: string | undefined
  const authHeader = request?.headers?.get('authorization')
  if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7)
  if (!token) {
    const store = await cookies()
    token = store.get(COOKIE_NAME)?.value
  }
  if (!token) return null
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string }
    await connectDB()
    const user = await User.findById(payload.id)
    if (!user || !user.isActive) return null
    return user
  } catch {
    return null
  }
}

export async function requireAuth(request?: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    return { user: null, error: NextResponse.json({ message: 'Authentication required' }, { status: 401 }) }
  }
  return { user, error: null as NextResponse | null }
}

export async function requireRole(request: Request, roles: string[]) {
  const { user, error } = await requireAuth(request)
  if (error) return { user: null, error }
  if (!roles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 }),
    }
  }
  return { user, error: null as NextResponse | null }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status })
}

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function handleApiError(err: unknown) {
  console.error(err)
  const e = err as { code?: number; message?: string; status?: number }
  if (e?.code === 11000) {
    return NextResponse.json(
      { message: 'This time slot is already booked. Please pick another slot.' },
      { status: 409 }
    )
  }
  return NextResponse.json({ message: e?.message || 'Server error' }, { status: e?.status || 500 })
}
