'use client'
import { Mail, Phone, User2 } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/Badge'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { TableSkeleton } from '@/components/Skeleton'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/users?role=provider&limit=50')
      .then((d) => setProviders(d.users || []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Providers"
        description="Doctors, stylists, and consultants who deliver services on the platform."
      />

      {loading ? (
        <TableSkeleton rows={4} />
      ) : providers.length === 0 ? (
        <EmptyState title="No providers yet" description="Registered providers appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Card key={p._id} hover className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white"
                  style={{ background: 'linear-gradient(145deg, #ea580c, #9a3412)' }}
                >
                  <User2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display font-semibold tracking-tight">{p.name}</div>
                  <Badge status="provider">provider</Badge>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                  <Mail className="h-4 w-4 opacity-60" /> {p.email}
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                  <Phone className="h-4 w-4 opacity-60" /> {p.phone || '—'}
                </div>
              </div>
              <Link href={`/availability?provider=${p._id}`} className="btn-secondary mt-4 w-full text-sm">
                View availability
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
