import { useCallback, useEffect, useState } from 'react'
import { Plus, Ticket, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const emptyForm = {
  code: '', type: 'percentage', value: '10', minimum_order_amount: '',
  maximum_discount_amount: '', start_at: '', end_at: '', usage_limit: '', usage_limit_per_customer: '',
}

/** Section 92 : coupons — jamais exposés aux visiteuses, validés côté serveur. */
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Record<string, unknown>[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(() => {
    supabase.from('coupons').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setCoupons((data ?? []) as Record<string, unknown>[]))
  }, [])
  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.code.trim() || !Number(form.value)) { toast('Code et valeur obligatoires.'); return }
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minimum_order_amount: form.minimum_order_amount ? Number(form.minimum_order_amount) : null,
      maximum_discount_amount: form.maximum_discount_amount ? Number(form.maximum_discount_amount) : null,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      usage_limit_per_customer: form.usage_limit_per_customer ? Number(form.usage_limit_per_customer) : null,
      is_active: true,
    }
    const { error } = await supabase.from('coupons').insert(payload)
    if (error) { toast(error.message); return }
    await logAudit('create', 'coupons', undefined, { code: payload.code })
    toast('Coupon créé ✓ — validation 100 % serveur (section 92)')
    setOpen(false); setForm(emptyForm); load()
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl">
            <Ticket className="h-6 w-6 text-primary" aria-hidden /> Coupons
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Jamais exposés aux visiteuses ; vérifiés par le serveur au checkout.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Nouveau coupon</Button>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Remise</th>
              <th className="px-4 py-3">Minimum</th>
              <th className="px-4 py-3">Utilisations</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(coupons ?? []).map((c) => (
              <tr key={String(c.id)} className="transition hover:bg-muted/40">
                <td className="px-4 py-3 font-mono font-semibold">{String(c.code)}</td>
                <td className="px-4 py-3">{c.type === 'percentage' ? `-${String(c.value)}%` : `-${String(c.value)} DT`}</td>
                <td className="px-4 py-3">{c.minimum_order_amount ? `${String(c.minimum_order_amount)} DT` : '—'}</td>
                <td className="px-4 py-3">{String(c.usage_count)}{c.usage_limit ? ` / ${String(c.usage_limit)}` : ''}</td>
                <td className="px-4 py-3">
                  <Switch checked={Boolean(c.is_active)} onCheckedChange={async (v) => {
                    await supabase.from('coupons').update({ is_active: v }).eq('id', String(c.id))
                    load()
                  }} aria-label={`Activer ${String(c.code)}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Supprimer ${String(c.code)} ?`)) return
                      await supabase.from('coupons').delete().eq('id', String(c.id))
                      await logAudit('delete', 'coupons', String(c.id), { code: String(c.code) })
                      load()
                    }}
                    className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
            {coupons?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Aucun coupon.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau coupon</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="BIENVENUE10" />
              </div>
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed_amount">Montant fixe (DT)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valeur</Label>
                <Input type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
              </div>
              <div>
                <Label>Minimum commande (DT)</Label>
                <Input type="number" min="0" value={form.minimum_order_amount} onChange={(e) => setForm((f) => ({ ...f, minimum_order_amount: e.target.value }))} />
              </div>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Limite totale</Label>
                <Input type="number" min="0" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} />
              </div>
              <div>
                <Label>Limite / cliente</Label>
                <Input type="number" min="0" value={form.usage_limit_per_customer} onChange={(e) => setForm((f) => ({ ...f, usage_limit_per_customer: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full" onClick={save}>Créer le coupon</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}