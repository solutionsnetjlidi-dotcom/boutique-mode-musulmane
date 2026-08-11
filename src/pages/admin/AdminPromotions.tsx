import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PromotionRow } from '@/types/database.types'

const emptyForm = {
  name: '', type: 'percentage', value: '10', scope_type: 'global',
  product_id: '', category_id: '', collection_id: '', start_at: '', end_at: '', usage_limit: '',
}

/** Section 91 : promotions — appliquées côté serveur au checkout. */
export default function AdminPromotions() {
  const [promos, setPromos] = useState<PromotionRow[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [targets, setTargets] = useState<{ products: { id: string; slug: string }[]; categories: { id: string; slug: string }[]; collections: { id: string; slug: string }[] }>({ products: [], categories: [], collections: [] })

  const load = useCallback(() => {
    supabase.from('promotions').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPromos((data ?? []) as PromotionRow[]))
  }, [])

  useEffect(() => {
    load()
    Promise.all([
      supabase.from('products').select('id, slug'),
      supabase.from('categories').select('id, slug'),
      supabase.from('collections').select('id, slug'),
    ]).then(([p, c, col]) => setTargets({
      products: (p.data ?? []) as { id: string; slug: string }[],
      categories: (c.data ?? []) as { id: string; slug: string }[],
      collections: (col.data ?? []) as { id: string; slug: string }[],
    }))
  }, [load])

  const save = async () => {
    if (!form.name.trim() || !Number(form.value)) { toast('Nom et valeur obligatoires.'); return }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      value: Number(form.value),
      scope_type: form.scope_type,
      product_id: form.scope_type === 'product' ? form.product_id || null : null,
      category_id: form.scope_type === 'category' ? form.category_id || null : null,
      collection_id: form.scope_type === 'collection' ? form.collection_id || null : null,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      is_active: true,
    }
    const { error } = await supabase.from('promotions').insert(payload)
    if (error) { toast(error.message); return }
    await logAudit('create', 'promotions', undefined, { name: payload.name })
    toast('Promotion créée ✓ — recalculée côté serveur à chaque commande')
    setOpen(false); setForm(emptyForm); load()
  }

  const remove = async (p: PromotionRow) => {
    if (!window.confirm(`Supprimer « ${p.name} » ?`)) return
    await supabase.from('promotions').delete().eq('id', p.id)
    await logAudit('delete', 'promotions', p.id, { name: p.name })
    load()
  }

  const scopeLabel = (p: PromotionRow) =>
    p.scope_type === 'global' ? 'Tout le site' : p.scope_type

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Promotions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Appliquées automatiquement côté serveur lors du checkout (section 91).</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Nouvelle promotion</Button>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Remise</th>
              <th className="px-4 py-3">Portée</th>
              <th className="px-4 py-3">Période</th>
              <th className="px-4 py-3">Utilisations</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(promos ?? []).map((p) => (
              <tr key={p.id} className="transition hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-semibold">{p.type === 'percentage' ? `-${p.value}%` : `-${p.value} DT`}</td>
                <td className="px-4 py-3 text-xs">{scopeLabel(p)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {p.start_at ? new Date(p.start_at).toLocaleDateString('fr-TN') : '—'} → {p.end_at ? new Date(p.end_at).toLocaleDateString('fr-TN') : '∞'}
                </td>
                <td className="px-4 py-3 text-xs">{p.usage_count}{p.usage_limit ? ` / ${p.usage_limit}` : ''}</td>
                <td className="px-4 py-3">
                  <Switch checked={p.is_active} onCheckedChange={async (v) => {
                    await supabase.from('promotions').update({ is_active: v }).eq('id', p.id)
                    load()
                  }} aria-label={`Activer ${p.name}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(p)} className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
            {promos?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucune promotion.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle promotion</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Soldes d'été" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed_amount">Montant fixe (DT)</option>
                </select>
              </div>
              <div>
                <Label>Valeur</Label>
                <Input type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Portée</Label>
              <select value={form.scope_type} onChange={(e) => setForm((f) => ({ ...f, scope_type: e.target.value }))}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
                <option value="global">Tout le site</option>
                <option value="product">Un produit</option>
                <option value="category">Une catégorie</option>
                <option value="collection">Une collection</option>
              </select>
            </div>
            {form.scope_type === 'product' && (
              <select value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
                <option value="">Choisir un produit…</option>
                {targets.products.map((t) => <option key={t.id} value={t.id}>{t.slug}</option>)}
              </select>
            )}
            {form.scope_type === 'category' && (
              <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
                <option value="">Choisir une catégorie…</option>
                {targets.categories.map((t) => <option key={t.id} value={t.id}>{t.slug}</option>)}
              </select>
            )}
            {form.scope_type === 'collection' && (
              <select value={form.collection_id} onChange={(e) => setForm((f) => ({ ...f, collection_id: e.target.value }))}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
                <option value="">Choisir une collection…</option>
                {targets.collections.map((t) => <option key={t.id} value={t.id}>{t.slug}</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Début</Label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} />
              </div>
              <div>
                <Label>Fin</Label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Limite d'utilisations (vide = illimité)</Label>
              <Input type="number" min="0" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={save}>Créer la promotion</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}