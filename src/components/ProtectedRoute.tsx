'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { PageSkeleton } from './Skeleton'

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading) return <div className="p-8"><PageSkeleton /></div>
  if (!user) return null
  if (roles && !roles.includes(user.role)) {
    router.replace('/dashboard')
    return null
  }
  return <>{children}</>
}
