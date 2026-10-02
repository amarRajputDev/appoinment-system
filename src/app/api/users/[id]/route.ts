import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { requireRole, jsonError, jsonOk, handleApiError } from '@/lib/auth'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireRole(request, ['admin'])
    if (error) return error
    const { id } = await context.params
    const body = await request.json()
    const updates: any = {}
    if (body.name) updates.name = body.name
    if (body.role) updates.role = body.role
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive
    if (body.phone !== undefined) updates.phone = body.phone

    await connectDB()
    const updated = await User.findByIdAndUpdate(id, updates, { new: true })
    if (!updated) return jsonError('User not found', 404)
    return jsonOk({ user: updated.toSafeJSON() })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireRole(request, ['admin'])
    if (error) return error
    const { id } = await context.params
    if (String(id) === String(user._id)) return jsonError('You cannot delete your own account')
    await connectDB()
    const deleted = await User.findByIdAndDelete(id)
    if (!deleted) return jsonError('User not found', 404)
    return jsonOk({ message: 'User deleted' })
  } catch (err) {
    return handleApiError(err)
  }
}
