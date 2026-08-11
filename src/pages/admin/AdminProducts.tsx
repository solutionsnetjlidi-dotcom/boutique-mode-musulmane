import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, ArchiveRestore, Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ProductWithVariants } from '@/types/database.types'

type AdminProduct = ProductWithVariants & {
  categories: { slug: string; name_translations: unknown } | null
}

/** Section 71 : CRUD produits — recherche, filtres, dupliquer, archiver, supprimer. */
export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'low' | 'out'>('all')

  const load = useCallback(() => {
    supabase.from('products')
      .select('*, product_variants(id), categories(slug, name_translations)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts((data ?? []) as unknown as AdminProduct[]))
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = (products ?? []).filter((p) => {
    const q = search.trim().toLowerCase()
    if (q && !translate(p.name_translations, 'fr').toLowerCase().includes(q) && !(p.sku ?? '').toLowerCase().includes(q)) return false
    if (statusFilter === 'active') return p.is_active
    if (statusFilter === 'inactive') return !p.is_active
    if (statusFilter === 'low') return p.stock > 0 && p.stock <= p.low_stock_threshold
    if (statusFilter === 'out') return p.stock <= 0
    return true
  })

  /* Dupliquer (section 71) */
  const duplicate = async (p: AdminProduct) => {
    const suffix = `-copie-${Date.now() % 10000}`
    const name = translate(p.name_translations, 'fr')
    const { data, error } = await supabase.from('products').insert({
      slug: p.slug + suffix,
      sku: p.sku ? `${p.sku}-COPY` : null,
      name_translations: { fr: `${name} (copie)`, en: name, ar: name },
      short_description_translations: p.short_description_translations,
      description_translations: p.description_translations,
      category_id: p.category_id, collection_id: p.collection_id,
      base_price: p.base_price, compare_at_price: p.compare_at_price, cost_price: p.cost_price,
      stock: p.stock, low_stock_threshold: p.low_stock_threshold,
      is_active: false, // la copie démarre désactivée
      is_featured: p.is_featured, is_premium: p.is_premium, is_new: true,
      is_best_seller: false, is_limited: p.is_limited, is_exclusive: p.is_exclusive,
      tags: p.tags, main_image_url: p.main_image_url, hover_image_url: p.hover_image_url,
      meta_title: p.meta_title, meta_description: p.meta_description,
    }).select('id').single()
    if (error || !data) { toast(error?.message ?? 'Erreur'); return }

    const variants = await supabase.from('product_variants').select('*').eq('product_id', p.id)
    if ((variants.data ?? []).length > 0) {
      await supabase.from('product_variants').insert(
        (variants.data ?? []).map((v) => ({
          product_id: data.id, sku: v.sku ? `${v.sku}-COPY` : null,
          attributes: v.attributes, price: v.price, stock: v.stock, image_url: v.image_url,
        })),
      )
    }
    await logAudit('create', 'products', data.id, { action: 'duplicate', from: p.slug })
    toast('Produit dupliqué (désactivé) ✓')
    load()
  }

  const toggleActive = async (p: AdminProduct) => {
    const { error } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    if (error) { toast(error.message); return }
    await logAudit('update', 'products', p.id, { action: p.is_active ? 'archive' : 'restore', slug: p.slug })
    toast(p.is_active ? 'Produit archivé ✓' : 'Produit réactivé ✓')
    load()
  }

  const remove = async (p: AdminProduct) => {
    if (!window.confirm(`Supprimer définitivement « ${translate(p.name_translations, 'fr')} » ?`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) { toast(error.message); return }
    await logAudit('delete', 'products', p.id, { slug: p.slug })
    toast('Produit supprimé ✓')
    load()
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Produits</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} produit(s)</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom ou SKU…"
              className="h-10 w-56 rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none transition focus:border-primary"
              aria-label="Rechercher un produit"
            />
          </div>
          <Button onClick={() => navigate('/admin/products/new')}>
            <Plus className="h-4 w-4" aria-hidden /> Nouveau produit
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {([
          ['all', 'Tous'], ['active', 'Actifs'], ['inactive', 'Archivés'], ['low', 'Stock faible'], ['out', 'Rupture'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition',
              statusFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Badges</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products === null ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-10 w-full" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucun produit.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="transition hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.main_image_url ?? undefined} alt="" className="h-12 rounded-lg bg-muted object-cover" style={{ width: '2.5rem' }} />
                    <div>
                      <p className="font-medium">{translate(p.name_translations, 'fr')}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{p.sku ?? p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {p.categories ? translate(p.categories.name_translations as never, 'fr') : '—'}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold price-ltr">{formatPrice(p.base_price)}</p>
                  {p.compare_at_price && <p className="text-xs text-muted-foreground line-through price-ltr">{formatPrice(p.compare_at_price)}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('font-semibold', p.stock <= 0 ? 'text-red-600' : p.stock <= p.low_stock_threshold ? 'text-amber-600' : '')}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.is_premium && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">Premium</span>}
                    {p.is_new && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">New</span>}
                    {p.is_best_seller && <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Best</span>}
                    {p.is_limited && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700">Ltd</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase',
                    p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                    {p.is_active ? 'Actif' : 'Archivé'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-0.5">
                    <Link to={`/admin/products/${p.id}`} className="rounded-full p-2 transition hover:bg-muted" aria-label="Modifier">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Link>
                    <button onClick={() => duplicate(p)} className="rounded-full p-2 transition hover:bg-muted" aria-label="Dupliquer">
                      <Copy className="h-4 w-4" aria-hidden />
                    </button>
                    <button onClick={() => toggleActive(p)} className="rounded-full p-2 transition hover:bg-muted" aria-label={p.is_active ? 'Archiver' : 'Réactiver'}>
                      {p.is_active ? <Archive className="h-4 w-4" aria-hidden /> : <ArchiveRestore className="h-4 w-4" aria-hidden />}
                    </button>
                    <button onClick={() => remove(p)} className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}