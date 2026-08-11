import { useState } from 'react'
import { Check, Eye, Paintbrush, Power } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { translate } from '@/lib/translations'
import type { ThemeRow } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

/** Section 59 : Theme Manager — 10 thèmes, changement sans modifier le code (103). */
export default function AdminThemes() {
  const { themes, activeTheme, loading, applyTheme, setDefaultTheme, toggleThemeActive } = useTheme()
  const { isAdmin } = useAuth()
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSetDefault = async (theme: ThemeRow) => {
    setBusySlug(theme.slug)
    setFeedback(null)
    try {
      await setDefaultTheme(theme)
      setFeedback({
        type: 'success',
        text: `« ${translate(theme.name_translations, 'fr')} » est maintenant le thème par défaut du site.`,
      })
    } catch {
      setFeedback({ type: 'error', text: 'Impossible de définir ce thème par défaut.' })
    } finally {
      setBusySlug(null)
    }
  }

  const handleToggleActive = async (theme: ThemeRow) => {
    setBusySlug(theme.slug)
    setFeedback(null)
    try {
      await toggleThemeActive(theme)
    } catch {
      setFeedback({ type: 'error', text: 'Impossible de modifier ce thème.' })
    } finally {
      setBusySlug(null)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
      </div>
    )
  }

  const activeCount = themes.filter((t) => t.is_active).length

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 font-display text-3xl">
          <Paintbrush className="h-6 w-6 text-primary" aria-hidden /> Theme Manager
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          10 thèmes premium — le changement de thème met à jour tout le site sans modifier le code (sections 59 & 103).
        </p>
      </header>

      {feedback && (
        <div role="status" className={feedback.type === 'success' ? 'rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700' : 'rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600'}>
          {feedback.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => {
          const colors = (theme.colors ?? {}) as Record<string, string>
          const busy = busySlug === theme.slug
          const isPreviewed = activeTheme?.id === theme.id
          const lastActive = theme.is_active && activeCount === 1

          return (
            <article key={theme.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
              <div className="relative flex h-32 items-center justify-center gap-3" style={{ backgroundColor: `hsl(${colors.background})` }}>
                <span className="h-12 w-12 rounded-full shadow ring-1 ring-black/10" style={{ backgroundColor: `hsl(${colors.primary})` }} />
                <span className="h-9 w-9 rounded-full shadow ring-1 ring-black/10" style={{ backgroundColor: `hsl(${colors.accent})` }} />
                <span className="h-7 w-7 rounded-full shadow ring-1 ring-black/10" style={{ backgroundColor: `hsl(${colors.badge})` }} />
                <span className="h-5 w-5 rounded-full shadow ring-1 ring-black/10" style={{ backgroundColor: `hsl(${colors.foreground})` }} />
                <span
                  className="absolute bottom-3 rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest"
                  style={{ backgroundColor: `hsl(${colors.primary})`, color: `hsl(${colors.primaryForeground})` }}
                >
                  Aperçu
                </span>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg leading-tight">{translate(theme.name_translations, 'fr')}</h2>
                    <p className="text-xs text-muted-foreground">{theme.slug}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {theme.is_default && <Badge variant="primary">Défaut</Badge>}
                    {!theme.is_active && <Badge variant="muted">Désactivé</Badge>}
                    {isPreviewed && !theme.is_default && <Badge variant="outline">Prévisualisé</Badge>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => applyTheme(theme)}>
                    <Eye className="h-3.5 w-3.5" aria-hidden /> Prévisualiser
                  </Button>
                  {isAdmin && (
                    <>
                      <Button size="sm" onClick={() => handleSetDefault(theme)} disabled={busy || theme.is_default}>
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        {theme.is_default ? 'Thème par défaut' : 'Définir par défaut'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(theme)}
                        disabled={busy || lastActive}
                        title={lastActive ? 'Impossible de désactiver le dernier thème actif' : theme.is_active ? 'Désactiver ce thème' : 'Activer ce thème'}
                        aria-label={theme.is_active ? `Désactiver ${translate(theme.name_translations, 'fr')}` : `Activer ${translate(theme.name_translations, 'fr')}`}
                      >
                        <Power className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}