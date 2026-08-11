import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrilingualFields, emptyTri, triFromJson, triToJson } from '@/components/admin/TrilingualFields'
import type { TriValue } from '@/components/admin/TrilingualFields'
import { translate } from '@/lib/translations'
import type { CollectionRow } from '@/types/database.types'

interface Form {
  slug: string; name: TriValue; description: TriValue
  image_url: string; banner_url: string; sort_order: string; is_active: boolean
}
const emptyForm = (): Form => ({ slug: '', name: emptyTri(), description: emptyTri(), image_url: '', banner_url: '', sort_order: '0', is_active: true })

/** Section 15 : CRUD collections. */
export default function AdminCollections() {
  const [collections, setCollections] = useState<CollectionRow[] | null>(null)
  const [form, setForm] = useState<Form>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    supabase.from('collections').select('*').order('sort_order')
      .then(({ data }) => setCollections((data ?? []) as CollectionRow[]))
  }, [])
  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(emptyForm()); setEditingId(null); setOpen(true) }
  const openEdit = (c: CollectionRow) => {
    setForm({
      slug: c.slug, name: triFromJson(c.name_translations), description: triFromJson(c.description_translations),
      image_url: c.image_url ?? '', banner_url: c.banner_url ?? '', sort_order: String(c.sort_order), is_active: c.is_active,
    })
    setEditingId(c.id)
    setOpen(true)
  }

  const save = async () => {
    if (!form.slug.trim() || !form.name.fr.trim()) { toast('Slug et nom FR obligatoires.'); return }
    setSaving(true)
    try {
      const payload = {
        slug: form.slug.trim(),
        name_translations: triToJson(form.name),
        description_translations: triToJson(form.description),
        image_url: form.image_url.trim() || null,
        banner_url: form.banner_url.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      }
      const { error } = editingId
        ? await supabase.from('collections').update(payload).eq('id', editingId)
        : await supabase.from('collections').insert(payload)
      if (error) throw error
      await logAudit(editingId ? 'update' : 'create', 'collections', editingId ?? undefined, { slug: payload.slug })
      toast(editingId ? 'Collection modifiée ✓' : 'Collection créée ✓')
      setOpen(false)
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c: CollectionRow) => {
    if (!window.confirm(`Supprimer « ${translate(c.name_translations, 'fr')} » ?`)) return
    const { error } = await supabase.from('collections').delete().eq('id', c.id)
    if (error) { toast(error.message); return }
    await logAudit('delete', 'collections', c.id, { slug: c.slug })
    toast('Collection supprimée ✓')
    load()
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">{collections?.length ?? '…'} collection(s)</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden /> Nouvelle collection</Button>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Ordre</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {collections === null ? (
              <tr><td colSpan={6} className="px-4 py-4"><Skeleton className="h-8 w-full" /></td></tr>
            ) : collections.map((c) => (
              <tr key={c.id} className="transition hover:bg-muted/40">
                <td className="px-4 py-3">
                  <img src={c.image_url ?? undefined} alt="" className="h-12 rounded-lg bg-muted object-cover" style={{ width: '4rem' }} />
                </td>
                <td className="px-4 py-3 font-medium">{translate(c.name_translations, 'fr')}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">{c.sort_order}</td>
                <td className="px-4 py-3">
                  <span className={c.is_active ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-700' : 'rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground'}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="rounded-full p-2 transition hover:bg-muted" aria-label="Modifier">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button onClick={() => remove(c)} className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier la collection' : 'Nouvelle collection'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <TrilingualFields label="Nom" value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
            <TrilingualFields label="Description" value={form.description} onChange={(description) => setForm((f) => ({ ...f, description }))} textarea />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="col-slug">Slug (URL)</Label>
                <Input id="col-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="ramadan" />
              </div>
              <div>
                <Label htmlFor="col-order">Ordre</Label>
                <Input id="col-order" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="col-img">Image</Label>
                <Input id="col-img" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="col-banner">Bannière</Label>
                <Input id="col-banner" value={form.banner_url} onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <span className="text-sm">Collection active</span>
              <Switch checked={form.is_active} onCheckedChange={(is_active) => setForm((f) => ({ ...f, is_active }))} aria-label="Collection active" />
            </div>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}