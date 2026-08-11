import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/contexts/AuthContext'

/**
 * Sections 68-69 : protection des routes admin.
 * - Sans session → /admin/login
 * - Avec session mais rôle non autorisé → accès refusé
 */
export default function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode
  roles?: UserRole[]
}) {
  const { session, role, loading, roleLoading } = useAuth()
  const location = useLocation()

  if (loading || (session && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="animate-pulse font-display text-lg tracking-[0.3em] text-primary">
          CHARGEMENT…
        </p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="font-display text-3xl">Accès refusé</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Votre rôle « {role} » ne permet pas d'accéder à cette page.
          Cette tentative est journalisée.
        </p>
        <a
          href="/admin"
          className="rounded-full bg-primary px-6 py-2.5 text-sm text-primary-foreground transition hover:opacity-90"
        >
          Retour au dashboard
        </a>
      </div>
    )
  }

  return <>{children}</>
}