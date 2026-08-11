import { useEffect, useState } from 'react'
import { MessageCircle, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { TrilingualFields, emptyTri, triFromJson, triToJson } from '@/components/admin/TrilingualFields'
import type { TriValue } from '@/components/admin/TrilingualFields'

const PLACEHOLDERS = ['{ORDER_NUMBER}', '{PRODUCTS}', '{TOTAL}', '{ZONE}', '{ADDRESS}']

/** Section 49 : WhatsApp Manager — numéro, activation, template (section 103). */
export default function AdminWhatsApp() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [number, setNumber] = useState('')
  const [templates, setTemplates] = useState<TriValue>(emptyTri())

  useEffect(() => {
    supabase.from('site_settings').select('key, value')
      .in('key', ['whatsapp_enabled', 'whatsapp_number', 'whatsapp_template'])
      .then(({ data }) => {
        const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
        setEnabled(map.whatsapp_enabled === true || map.whatsapp_enabled === 'true')
        setNumber(typeof map.whatsapp_number === 'string' ? map.whatsapp_number : '')
        setTemplates(triFromJson(map.whatsapp_template))
        setLoading(false)
      })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all([
        supabase.from('site_settings').update({ value: JSON.stringify(enabled) }).eq('key', 'whatsapp_enabled'),
        supabase.from('site_settings').update({ value: JSON.stringify(number) }).eq('key', 'whatsapp_number'),
        supabase.from('site_settings').update({ value: JSON.stringify(triToJson(templates)) }).eq('key', 'whatsapp_template'),
      ])
      await logAudit('settings_change', 'site_settings', undefined, { whatsapp_enabled: enabled, whatsapp_number: number })
      toast('Paramètres WhatsApp enregistrés ✓')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-3 font-display text-3xl">
          <MessageCircle className="h-6 w-6 text-primary" aria-hidden /> WhatsApp Manager
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Le numéro et le template sont utilisés par tout le site (bouton d'aide, fiches produit,
          confirmation de commande) — sans modification de code (section 103).
        </p>
      </header>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium">Fonction WhatsApp activée</p>
            <p className="text-xs text-muted-foreground">Désactivée, tous les boutons WhatsApp disparaissent du site.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Activer WhatsApp" />
        </div>

        <div>
          <Label htmlFor="wa-number">Numéro WhatsApp de la boutique</Label>
          <Input
            id="wa-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+216 20 000 000"
          />
          <p className="mt-1 text-xs text-muted-foreground">Format international avec indicatif pays.</p>
        </div>

        <TrilingualFields
          label="Template de confirmation de commande"
          value={templates}
          onChange={setTemplates}
          textarea
          rows={6}
        />

        <div className="rounded-xl bg-muted/60 p-4 text-xs">
          <p className="mb-1.5 font-semibold">Placeholders disponibles :</p>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map((p) => (
              <code key={p} className="rounded bg-card px-2 py-1 font-mono">{p}</code>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} size="lg" className="w-full">
          <Save className="h-4 w-4" aria-hidden /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}