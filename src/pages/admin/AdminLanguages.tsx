import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Globe, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { LanguageRow } from '@/types/database.types'

/** Section 61 : activer / désactiver / réordonner / définir défaut — traductions conservées. */
export default function AdminLanguages() {
  const [languages, setLanguages] = useState<LanguageRow[] | null>(null)

  const load = useCallback(() => {
    supabase.from('languages').select('*').order('sort_order')
      .then(({ data }) => setLanguages((data ?? []) as LanguageRow[]))
  }, [])
  useEffect(() => { load() }, [load])

  const activeCount = (languages ?? []).filter((l) => l.is_active).length

  const toggleActive = async (l: LanguageRow) => {
    if (l.is_default && l.is_active) {
      toast('Définissez d\'abord une autre langue par défaut.')
      return
    }
    if (l.is_active && activeCount <= 1) {
      toast('Impossible de désactiver la dernière langue active.')
      return
    }
    const { error } = await supabase.from('languages').update({ is_active: !l.is_active }).eq('code', l.code)
    if (error) { toast(error.message); return }
    await logAudit('language_change', 'languages', undefined, { code: l.code, action: l.is_active ? 'disable' : 'enable' })
    toast(l.is_active
      ? `${l.code.toUpperCase()} désactivée — le bouton a disparu du site public ✓`
      : `${l.code.toUpperCase()} activée ✓`)
    load()
  }

  const setDefault = async (l: LanguageRow) => {
    if (!l.is_active) { toast('Activez d\'abord cette langue.'); return }
    await supabase.from('languages').update({ is_default: false }).eq('is_default', true)
    const { error } = await supabase.from('languages').update({ is_default: true }).eq('code', l.code)
    if (error) { toast(error.message); return }
    await logAudit('language_change', 'languages', undefined, { code: l.code, action: 'set_default' })
    toast(`${l.native_name} est maintenant la langue par défaut ✓`)
    load()
  }

  const move = async (index: number, dir: -1 | 1) => {
    if (!languages) return
    const current = languages[index]
    const target = languages[index + dir]
    if (!current || !target) return
    await Promise.all([
      supabase.from('languages').update({ sort_order: target.sort_order }).eq('code', current.code),
      supabase.from('languages').update({ sort_order: current.sort_order }).eq('code', target.code),
    ])
    await logAudit('language_change', 'languages', undefined, { action: 'reorder' })
    load()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-3 font-display text-3xl">
          <Globe className="h-6 w-6 text-primary" aria-hidden /> Langues
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Section 61 : une langue désactivée disparaît du site, ses traductions sont conservées.
        </p>
      </header>

      {languages === null ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : (
        <div className="space-y-3">
          {languages.map((l, i) => (
            <div key={l.code} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                  aria-label={`Monter ${l.name}`}
                >
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === languages.length - 1}
                  className="rounded p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                  aria-label={`Descendre ${l.name}`}
                >
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="flex-1">
                <p className="flex items-center gap-2 font-medium">
                  <span aria-hidden>{l.flag}</span> {l.native_name}
                  <span className="text-xs text-muted-foreground">({l.name})</span>
                </p>
                <div className="mt-1 flex gap-1.5">
                  <Badge variant="outline">{l.code.toUpperCase()}</Badge>
                  {l.is_rtl && <Badge variant="muted">RTL</Badge>}
                  {l.is_default && <Badge variant="primary">Défaut</Badge>}
                </div>
              </div>

              <Button
                size="sm"
                variant={l.is_default ? 'secondary' : 'outline'}
                onClick={() => setDefault(l)}
                disabled={l.is_default}
                title="Définir comme langue par défaut"
              >
                <Star className="h-3.5 w-3.5" aria-hidden />
                {l.is_default ? 'Par défaut' : 'Défaut'}
              </Button>

              <div className="flex items-center gap-2">
                <span className={l.is_active ? 'text-xs font-medium text-emerald-600' : 'text-xs text-muted-foreground'}>
                  {l.is_active ? 'ON' : 'OFF'}
                </span>
                <Switch
                  checked={l.is_active}
                  onCheckedChange={() => toggleActive(l)}
                  aria-label={`Activer ${l.name}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">Exemple (section 61) :</p>
        <p className="mt-1">
          FR <strong>ON</strong> · EN <strong>ON</strong> · AR <strong>OFF</strong> → le bouton AR disparaît
          immédiatement du site public (après rechargement). Les contenus arabes restent en base et
          seront restaurés tel quel à la réactivation.
        </p>
      </div>
    </div>
  )
}