'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Search, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import Badge from '@/components/Badge'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { TableSkeleton } from '@/components/Skeleton'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    const qs = new URLSearchParams({ page: String(page), limit: '15' })
    if (search) qs.set('search', search)
    if (role) qs.set('role', role)
    api
      .get(`/api/users?${qs}`)
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [search, role, page])

  const updateUser = async (id: string, payload: any) => {
    try {
      await api.patch(`/api/users/${id}`, payload)
      toast.success('User updated')
      api.get(`/api/users?${new URLSearchParams({ page: String(page), limit: '15', ...(search ? { search } : {}), ...(role ? { role } : {}) })}`).then(setData)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const deleteUser = async () => {
    try {
      await api.delete(`/api/users/${deleteTarget._id}`)
      toast.success('User deleted')
      setDeleteTarget(null)
      api.get(`/api/users?${new URLSearchParams({ page: String(page), limit: '15', ...(search ? { search } : {}), ...(role ? { role } : {}) })}`).then(setData)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Administer accounts, roles, and access across Tempo."
      />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input
            className="input input-icon"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          className="input min-w-[130px] sm:w-auto"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
        >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="provider">Provider</option>
            <option value="client">Client</option>
          </select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : !data?.users?.length ? (
        <EmptyState title="No users found" description="Adjust search or filters." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u: any) => (
                <tr key={u._id}>
                  <td className="font-semibold tracking-tight">{u.name}</td>
                  <td>{u.email}</td>
                  <td><Badge status={u.role} /></td>
                  <td><Badge status={u.isActive ? 'active' : 'inactive'} /></td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="input w-auto py-1 text-xs"
                        value={u.role}
                        onChange={(e) => updateUser(u._id, { role: e.target.value })}
                      >
                        <option value="admin">admin</option>
                        <option value="provider">provider</option>
                        <option value="client">client</option>
                      </select>
                      <button
                        className="btn-secondary px-2 py-1 text-xs"
                        onClick={() => updateUser(u._id, { isActive: !u.isActive })}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-danger px-2 py-1 text-xs" onClick={() => setDeleteTarget(u)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span style={{ color: 'var(--muted)' }}>Page {data?.page || 1} of {data?.pages || 1}</span>
        <div className="flex gap-2">
          <button className="btn-secondary px-3 py-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <button className="btn-secondary px-3 py-1.5" disabled={page >= (data?.pages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete user">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Permanently delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={deleteUser}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
