import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, Truck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrilingualFields, emptyTri, triFromJson, triToJson } from '@/components/admin/TrilingualFields'
import type { TriValue } from '@/components/admin/TrilingualFields'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import type { ServiceZoneRow } from '@/types/database.types'

const emptyForm = {
  name: emptyTri() as TriValue, delay: emptyTri() as TriValue,
  cities: '', shipping_fee: '7', free_shipping_threshold: '150',
}

/** Section 48 : zones de livraison — frais, seuils de gratuité, délais. */
export default function AdminShipping() {
  const [zones, setZones] = useState<ServiceZoneRow[] | null>(null)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(() => {
    supabase.from('service_zones').select('*').order('sort_order')
      .then(({ data }) => setZones((data ?? []) as ServiceZoneRow[]))
  }, [])
  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name.fr.trim()) { toast('Nom FR obligatoire.'); return }
    const payload = {
      name_translations: triToJson(form.name),
      estimated_delay_translations: triToJson(form.delay),
      country: 'TN',
      cities: form.cities.split(',').map((c) => c.trim()).filter(Boolean),
      shipping_fee: Number(form.shipping_fee) || 0,
      free_shipping_threshold: form.free_shipping_threshold ? Number(form.free_shipping_threshold) : null,
    }
    const { error } = editingId
      ? await supabase.from('service_zones').update(payload).eq('id', editingId)
      : await supabase.from('service_zones').insert({ ...payload, sort_order: (zones?.length ?? 0) + 1 })
    if (error) { toast(error.message); return }
    await logAudit(editingId ? 'update' : 'create', 'service_zones', editingId ?? undefined, {})
    toast('Zone enregistrée ✓')
    setOpen(false); load()
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl">
            <Truck className="h-6 w-6 text-primary" aria-hidden /> Zones de livraison
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Frais, seuils de gratuité et délais par zone (section 48).</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setOpen(true) }}>
          <Plus className="h-4 w-4" aria-hidden /> Nouvelle zone
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {(zones ?? []).map((z) => (
          <div key={z.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg">{translate(z.name_translations, 'fr')}</p>
                <p className="text-xs text-muted-foreground">{translate(z.estimated_delay_translations, 'fr')}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingId(z.id)
                    setForm({
                      name: triFromJson(z.name_translations), delay: triFromJson(z.estimated_delay_translations),
                      cities: (z.cities ?? []).join(', '), shipping_fee: String(z.shipping_fee),
                      free_shipping_threshold: z.free_shipping_threshold != null ? String(z.free_shipping_threshold) : '',
                    })
                    setOpen(true)
                  }}
                  className="rounded-full p-2 transition hover:bg-muted" aria-label="Modifier"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Supprimer cette zone ?')) return
                    await supabase.from('service_zones').delete().eq('id', z.id)
                    load()
                  }}
                  className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm price-ltr">
              Frais : <strong>{formatPrice(z.shipping_fee)}</strong>
              {z.free_shipping_threshold != null && <> · Gratuite dès <strong>{formatPrice(z.free_shipping_threshold)}</strong></>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{(z.cities ?? []).join(', ')}</p>
            <div className="mt-3 flex items-center gap-2">
              <Switch
                checked={z.is_active}
                onCheckedChange={async (v) => {
                  await supabase.from('service_zones').update({ is_active: v }).eq('id', z.id)
                  load()
                }}
                aria-label={`Activer ${translate(z.name_translations, 'fr')}`}
              />
              <span className="text-xs text-muted-foreground">{z.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editingId ? 'Modifier la zone' : 'Nouvelle zone'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <TrilingualFields label="Nom de la zone" value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
            <TrilingualFields label="Délai estimé" value={form.delay} onChange={(delay) => setForm((f) => ({ ...f, delay }))} />
            <div>
              <Label>Villes (séparées par des virgules)</Label>
              <Input value={form.cities} onChange={(e) => setForm((f) => ({ ...f, cities: e.target.value }))} placeholder="Tunis, Ariana, Ben Arous" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frais (DT)</Label>
                <Input type="number" min="0" value={form.shipping_fee} onChange={(e) => setForm((f) => ({ ...f, shipping_fee: e.target.value }))} />
              </div>
              <div>
                <Label>Seuil gratuité (DT, vide = jamais)</Label>
                <Input type="number" min="0" value={form.free_shipping_threshold} onChange={(e) => setForm((f) => ({ ...f, free_shipping_threshold: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full" onClick={save}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}