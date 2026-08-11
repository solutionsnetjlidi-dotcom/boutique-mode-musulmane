import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { logAudit } from '@/lib/audit'

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Mot de passe : 6 caractères minimum'),
})
type LoginForm = z.infer<typeof loginSchema>

/** Section 67 : Supabase Auth — pas de faux login, pas de mot de passe hardcodé. */
export default function AdminLogin() {
  const { session, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname?: string } } }
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  // Déjà connecté avec un rôle staff → dashboard
  if (!loading && session && role !== 'client') {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : 'Connexion impossible. Réessayez.',
      )
      return
    }

    await logAudit('login')
    navigate(location.state?.from?.pathname ?? '/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBag className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-display text-3xl tracking-wide">Espace Administrateur</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Boutique Mode Musulmane Féminine Premium
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm"
          noValidate
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@votremarque.com"
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && <p role="alert" className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            {errors.password && <p role="alert" className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary py-3 text-sm font-medium tracking-wide text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>

          <a href="/" className="block text-center text-xs text-muted-foreground transition hover:text-foreground">
            ← Retour à la boutique
          </a>
        </form>
      </div>
    </div>
  )
}