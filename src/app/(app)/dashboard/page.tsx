'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  DollarSign,
  Flame,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import PageHeader from '@/components/PageHeader'
import { PageSkeleton } from '@/components/Skeleton'

const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24',
  confirmed: '#2dd4bf',
  completed: '#34d399',
  cancelled: '#fb7185',
  no_show: '#a8a29e',
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent: string
  hint?: string
}) {
  return (
    <Card className="stat-card panel-hover" hover>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.72rem] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--muted)' }}>
            {label}
          </div>
          <div className="font-display mt-2 text-[1.95rem] font-semibold leading-none tracking-tight tabular-nums">
            {value}
          </div>
          {hint && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
              <Clock3 className="h-3 w-3" /> {hint}
            </div>
          )}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
          style={{ background: accent, boxShadow: `0 10px 22px -10px ${accent}` }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/api/stats/overview')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton />
  if (error) return <div className="panel p-6 text-rose-500">{error}</div>

  const donut = Object.entries(data.byStatus || {}).map(([name, value]) => ({ name, value }))
  const chart = (data.chart || []).map((d: any) => ({ ...d, label: d.date.slice(5) }))
  const isAdmin = user?.role === 'admin'

  const cards = isAdmin
    ? [
        {
          label: 'Appointments',
          value: data.totalAppointments ?? 0,
          icon: CalendarDays,
          accent: 'linear-gradient(145deg, #ea580c, #9a3412)',
          hint: 'All time',
        },
        {
          label: 'Today',
          value: data.todayCount ?? 0,
          icon: Flame,
          accent: 'linear-gradient(145deg, #0f766e, #115e59)',
          hint: 'On the books',
        },
        {
          label: 'Providers',
          value: data.providers ?? 0,
          icon: Users,
          accent: 'linear-gradient(145deg, #b45309, #92400e)',
          hint: 'Active team',
        },
        {
          label: 'Services',
          value: data.services ?? 0,
          icon: DollarSign,
          accent: 'linear-gradient(145deg, #475569, #1e293b)',
          hint: 'Catalog',
        },
      ]
    : [
        {
          label: 'Appointments',
          value: data.totalAppointments ?? 0,
          icon: CalendarDays,
          accent: 'linear-gradient(145deg, #ea580c, #9a3412)',
          hint: 'All time',
        },
        {
          label: 'Today',
          value: data.todayCount ?? 0,
          icon: Flame,
          accent: 'linear-gradient(145deg, #0f766e, #115e59)',
          hint: 'Scheduled',
        },
        {
          label: 'Revenue',
          value: `$${data.revenue ?? 0}`,
          icon: TrendingUp,
          accent: 'linear-gradient(145deg, #b45309, #92400e)',
          hint: 'Confirmed + done',
        },
        {
          label: 'Completed',
          value: data.byStatus?.completed ?? 0,
          icon: DollarSign,
          accent: 'linear-gradient(145deg, #475569, #1e293b)',
          hint: 'Finished visits',
        },
      ]

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Studio overview"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description="A clear look at bookings, capacity, and momentum across the last 30 days."
        actions={
          <>
            <Link href="/book" className="btn-primary">
              New appointment
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="eyebrow mb-1">Demand</div>
              <h2 className="font-display text-lg font-semibold tracking-tight">Bookings trend</h2>
            </div>
            <span className="chip shrink-0 border-[color:var(--line)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              30 days
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,113,108,0.2)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '0.75rem',
                    fontSize: 12,
                    color: 'var(--ink)',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#ea580c" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <div className="mb-5">
            <div className="eyebrow mb-1">Composition</div>
            <h2 className="font-display text-lg font-semibold tracking-tight">By status</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} stroke="none">
                  {donut.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ea580c'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '0.75rem',
                    fontSize: 12,
                    color: 'var(--ink)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {donut.map((d) => (
              <Badge key={String(d.name)} status={String(d.name)}>
                {String(d.name)}: {String(d.value)}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
