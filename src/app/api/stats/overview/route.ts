import dayjs from 'dayjs'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { Appointment, Service, User } from '@/lib/models'
import { requireAuth, jsonOk, handleApiError } from '@/lib/auth'

function scopeFilter(user: any) {
  if (user.role === 'admin') return {}
  if (user.role === 'provider') return { provider: user._id }
  return { client: user._id }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error
    const filter = scopeFilter(user)
    const todayStart = dayjs().startOf('day').toDate()
    const todayEnd = dayjs().endOf('day').toDate()
    const last30 = dayjs().subtract(30, 'day').startOf('day').toDate()

    await connectDB()
    const [totalAppointments, todayCount, byStatus, revenueAgg, chartAgg] = await Promise.all([
      Appointment.countDocuments(filter),
      Appointment.countDocuments({ ...filter, date: { $gte: todayStart, $lte: todayEnd } }),
      Appointment.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Appointment.aggregate([
        {
          $match: { ...filter, status: { $in: ['completed', 'confirmed'] }, date: { $gte: todayStart } },
        },
        {
          $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'svc' },
        },
        { $unwind: { path: '$svc', preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, revenue: { $sum: { $ifNull: ['$svc.price', 0] } } } },
      ]),
      Appointment.aggregate([
        { $match: { ...filter, date: { $gte: last30 } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
    ])

    const statusMap: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    }
    byStatus.forEach((s: any) => {
      if (s._id in statusMap) statusMap[s._id] = s.count
    })

    const chart = []
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
      const pending = chartAgg.find((c: any) => c._id.date === d && c._id.status === 'pending')?.count || 0
      const confirmed = chartAgg.find((c: any) => c._id.date === d && c._id.status === 'confirmed')?.count || 0
      const completed = chartAgg.find((c: any) => c._id.date === d && c._id.status === 'completed')?.count || 0
      const cancelled = chartAgg.find((c: any) => c._id.date === d && c._id.status === 'cancelled')?.count || 0
      chart.push({
        date: d,
        pending,
        confirmed,
        completed,
        cancelled,
        total: pending + confirmed + completed + cancelled,
      })
    }

    let extras: Record<string, number> = {}
    if (user.role === 'admin') {
      const [providers, clients, services] = await Promise.all([
        User.countDocuments({ role: 'provider' }),
        User.countDocuments({ role: 'client' }),
        Service.countDocuments({ isActive: true }),
      ])
      extras = { providers, clients, services }
    }

    return jsonOk({
      totalAppointments,
      todayCount,
      byStatus: statusMap,
      revenue: revenueAgg[0]?.revenue || 0,
      chart,
      ...extras,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
