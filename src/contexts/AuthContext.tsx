import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import type { ProfilesRow } from '@/types/database.types'

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'client'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: ProfilesRow | null
  role: UserRole
  loading: boolean       // chargement initial de session
  roleLoading: boolean   // chargement du rôle après connexion
  isAdmin: boolean       // super_admin | admin
  isManager: boolean     // super_admin | admin | manager
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfilesRow | null>(null)
  const [role, setRole] = useState<UserRole>('client')
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)

  const loadUserData = useCallback(async (userId: string) => {
    setRoleLoading(true)
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      ])
      setProfile(profileRes.data)
      setRole(((roleRes.data?.role as UserRole) ?? 'client'))
    } finally {
      setRoleLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Session initiale
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) await loadUserData(data.session.user.id)
      if (mounted) setLoading(false)
    })

    // Écoute des changements (connexion, déconnexion, expiration token)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        void loadUserData(newSession.user.id)
      } else {
        setProfile(null)
        setRole('client')
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadUserData])

  /** Section 70 : supabase.auth.signOut() + nettoyage session + invalidation données */
  const signOut = useCallback(async () => {
    await logAudit('logout')
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setRole('client')
    // Les futurs contextes (panier, wishlist) écouteront cet événement pour se purger
    window.dispatchEvent(new CustomEvent('app:signout'))
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    role,
    loading,
    roleLoading,
    isAdmin: role === 'super_admin' || role === 'admin',
    isManager: role === 'super_admin' || role === 'admin' || role === 'manager',
    signOut,
  }), [session, profile, role, loading, roleLoading, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>')
  return ctx
}