'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Badge from '@/components/Badge'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { TableSkeleton } from '@/components/Skeleton'

const emptyForm = {
  title: '',
  description: '',
  durationMin: 30,
  price: 50,
  category: 'General',
  provider: '',
}

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const canManage = user?.role === 'admin' || user?.role === 'provider'

  const load = () => {
    setLoading(true)
    api
      .get(`/api/services?limit=100${canManage ? '&all=1' : ''}`)
      .then((d) => setServices(d.services || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage])

  const save = async () => {
    try {
      const payload = {
        ...form,
        durationMin: Number(form.durationMin),
        price: Number(form.price),
      }
      if (payload.id) await api.patch(`/api/services/${payload.id}`, payload)
      else await api.post('/api/services', payload)
      toast.success('Service saved')
      setEditing(null)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const remove = async () => {
    try {
      await api.delete(`/api/services/${deleteTarget._id}`)
      toast.success(user?.role === 'admin' ? 'Service deleted' : 'Service deactivated')
      setDeleteTarget(null)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Services"
        description="Define what clients can book — duration, price, category, and owner."
        actions={
          canManage && (
            <button
              className="btn-primary"
              onClick={() => {
                setForm({ ...emptyForm, provider: user?.role === 'provider' ? user._id : '' })
                setEditing('new')
              }}
            >
              <Plus className="h-4 w-4" /> New service
            </button>
          )
        }
      />

      {loading ? (
        <TableSkeleton rows={6} />
      ) : services.length === 0 ? (
        <EmptyState title="No services yet" description="Add a service to start booking appointments." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s._id} hover className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                    {s.category} · {s.durationMin} min
                  </div>
                </div>
                <Badge status={s.isActive ? 'active' : 'inactive'} />
              </div>
              {s.description && (
                <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{s.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-lg font-bold text-[color:var(--accent)]">${s.price}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{s.provider?.name}</div>
              </div>
              {canManage && (
                <div className="mt-4 flex gap-2">
                  <button
                    className="btn-secondary flex-1 text-xs"
                    onClick={() => {
                      setForm({
                        id: s._id,
                        title: s.title,
                        description: s.description || '',
                        durationMin: s.durationMin,
                        price: s.price,
                        category: s.category,
                        provider: s.provider?._id || s.provider,
                      })
                      setEditing(s._id)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button className="btn-danger flex-1 text-xs" onClick={() => setDeleteTarget(s)}>
                    <Trash2 className="h-3.5 w-3.5" /> {user?.role === 'admin' ? 'Delete' : 'Deactivate'}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'New service' : 'Edit service'}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duration (min)</label>
              <input className="input" type="number" min="5" value={form.durationMin} onChange={set('durationMin')} required />
            </div>
            <div>
              <label className="label">Price</label>
              <input className="input" type="number" min="0" step="1" value={form.price} onChange={set('price')} required />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" value={form.category} onChange={set('category')} />
          </div>
          {user?.role === 'admin' && (
            <div>
              <label className="label">Provider id</label>
              <input className="input" value={form.provider} onChange={set('provider')} placeholder="Provider id" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Confirm removal">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {user?.role === 'admin'
            ? `Permanently delete "${deleteTarget?.title}"?`
            : `Deactivate "${deleteTarget?.title}"? It will disappear from booking.`}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={remove}>Confirm</button>
        </div>
      </Modal>
    </div>
  )
}
