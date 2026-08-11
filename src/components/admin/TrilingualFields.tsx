import type { Json } from '@/types/database.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** Section 77 : aucun texte important n'est hardcodé → champs FR/EN/AR partout. */
export interface TriValue { fr: string; en: string; ar: string }

export const emptyTri = (): TriValue => ({ fr: '', en: '', ar: '' })

export const triFromJson = (j: Json | null | undefined): TriValue => {
  const o = (j && typeof j === 'object' && !Array.isArray(j) ? j : {}) as Record<string, unknown>
  return {
    fr: typeof o.fr === 'string' ? o.fr : '',
    en: typeof o.en === 'string' ? o.en : '',
    ar: typeof o.ar === 'string' ? o.ar : '',
  }
}

export const triToJson = (t: TriValue): Json => ({ fr: t.fr, en: t.en, ar: t.ar })

export function TrilingualFields({
  label, value, onChange, textarea = false, rows = 2,
}: {
  label: string
  value: TriValue
  onChange: (v: TriValue) => void
  textarea?: boolean
  rows?: number
}) {
  const Field = textarea ? Textarea : Input
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid gap-2 md:grid-cols-3">
        {(['fr', 'en', 'ar'] as const).map((lang) => (
          <div key={lang}>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {lang.toUpperCase()}
            </span>
            <Field
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              value={value[lang] ?? ''}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
              {...(textarea ? { rows } : {})}
            />
          </div>
        ))}
      </div>
    </div>
  )
}