import { useEffect, useState } from 'react'
import { Save, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TrilingualFields, emptyTri, triFromJson, triToJson } from '@/components/admin/TrilingualFields'
import type { TriValue } from '@/components/admin/TrilingualFields'
import { translate } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { ProductRow } from '@/types/database.types'

type Tab = 'global' | 'products'

/** Section 78 : SEO Manager — réglages globaux + meta par produit. */
export default function AdminSeo() {
  const [tab, setTab] = useState<Tab>('global')
  const [title, setTitle] = useState<TriValue>(emptyTri())
  const [description, setDescription] = useState<TriValue>(emptyTri())
  const [ogImage, setOgImage] = useState('')
  const [products, setProducts] = useState<ProductRow[]>([])
  const [edits, setEdits] = useState<Record<string, { t: string; d: string }>>({})

  useEffect(() => {
    supabase.from('site_settings').select('key, value')
      .in('key', ['seo_default_title', 'seo_default_description', 'seo_og_image'])
      .then(({ data }) => {
        const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
        setTitle(triFromJson(map.seo_default_title))
        setDescription(triFromJson(map.seo_default_description))
        setOgImage(typeof map.seo_og_image === 'string' ? map.seo_og_image : '')
      })
    supabase.from('products').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setProducts((data ?? []) as ProductRow[]))
  }, [])

  const saveGlobal = async () => {
    await Promise.all([
      supabase.from('site_settings').update({ value: JSON.stringify(triToJson(title)) }).eq('key', 'seo_default_title'),
      supabase.from('site_settings').update({ value: JSON.stringify(triToJson(description)) }).eq('key', 'seo_default_description'),
      supabase.from('site_settings').update({ value: JSON.stringify(ogImage) }).eq('key', 'seo_og_image'),
    ])
    await logAudit('settings_change', 'site_settings', undefined, { scope: 'seo' })
    toast('SEO global enregistré ✓')
  }

  const saveProduct = async (p: ProductRow) => {
    const edit = edits[p.id]
    if (!edit) return
    const { error } = await supabase.from('products').update({
      meta_title: { fr: edit.t, en: '', ar: '' },
      meta_description: { fr: edit.d, en: '', ar: '' },
    }).eq('id', p.id)
    if (error) { toast(error.message); return }
    await logAudit('update', 'products', p.id, { scope: 'seo' })
    toast(`SEO de « ${translate(p.name_translations, 'fr')} » enregistré ✓`)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 font-display text-3xl">
          <Search className="h-6 w-6 text-primary" aria-hidden /> SEO Manager
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta title / description + données structurées JSON-LD injectées automatiquement (sections 78-79).
        </p>
      </header>

      <div className="flex gap-2">
        {([['global', 'Réglages globaux'], ['products', 'Par produit']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn('rounded-full px-4 py-2 text-sm font-medium transition',
              tab === k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'global' && (
        <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
          <TrilingualFields label="Meta title par défaut" value={title} onChange={setTitle} />
          <TrilingualFields label="Meta description par défaut" value={description} onChange={setDescription} textarea />
          <div>
            <Label htmlFor="og">Image OG (partage social)</Label>
            <Input id="og" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
          </div>
          <Button onClick={saveGlobal}><Save className="h-4 w-4" aria-hidden /> Enregistrer</Button>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-3">
          {products.map((p) => {
            const current = edits[p.id] ?? {
              t: triFromJson(p.meta_title).fr,
              d: triFromJson(p.meta_description).fr,
            }
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{translate(p.name_translations, 'fr')}</p>
                  <Button size="sm" variant="outline" onClick={() => saveProduct(p)} disabled={!edits[p.id]}>
                    Enregistrer
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Meta title</Label>
                    <Input value={current.t}
                      onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...current, t: e.target.value } }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Meta description</Label>
                    <Textarea rows={2} value={current.d}
                      onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...current, d: e.target.value } }))} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}