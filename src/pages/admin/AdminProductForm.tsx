import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { TrilingualFields, emptyTri, triFromJson, triToJson } from '@/components/admin/TrilingualFields'
import type { TriValue } from '@/components/admin/TrilingualFields'
import type { CategoryRow, CollectionRow, VariantRow } from '@/types/database.types'

interface VariantForm {
  id?: string
  color: string; hex: string; size: string
  sku: string; price: string; stock: string; image_url: string
}
const emptyVariant = (): VariantForm => ({ color: '', hex: '#D8B4A0', size: '', sku: '', price: '', stock: '0', image_url: '' })

const BADGE_FIELDS = [
  ['is_active', 'Actif (visible sur le site)'],
  ['is_featured', 'Tendance (Trending)'],
  ['is_premium', 'Premium'],
  ['is_new', 'Nouveau'],
  ['is_best_seller', 'Best Seller'],
  ['is_limited', 'Édition limitée'],
  ['is_exclusive', 'Exclusivité'],
] as const

/** Sections 71-72 : création / édition produit + variantes dynamiques. */
export default function AdminProductForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [collections, setCollections] = useState<CollectionRow[]>([])

  const [slug, setSlug] = useState('')
  const [sku, setSku] = useState('')
  const [name, setName] = useState<TriValue>(emptyTri())
  const [shortDesc, setShortDesc] = useState<TriValue>(emptyTri())
  const [desc, setDesc] = useState<TriValue>(emptyTri())
  const [categoryId, setCategoryId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [stock, setStock] = useState('0')
  const [lowStock, setLowStock] = useState('5')
  const [badges, setBadges] = useState<Record<string, boolean>>({ is_active: true, is_new: true })
  const [mainImage, setMainImage] = useState('')
  const [hoverImage, setHoverImage] = useState('')
  const [tags, setTags] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [variants, setVariants] = useState<VariantForm[]>([])
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('collections').select('*').order('sort_order'),
    ]).then(([c, col]) => {
      setCategories((c.data ?? []) as CategoryRow[])
      setCollections((col.data ?? []) as CollectionRow[])
    })
  }, [])

  useEffect(() => {
    if (isNew) return
    supabase.from('products').select('*, product_variants(*)').eq('id', id).maybeSingle()
      .then(({ data }) => {
        if (!data) { toast('Produit introuvable.'); navigate('/admin/products'); return }
        const p = data as Record<string, never> & {
          slug: string; sku: string | null; name_translations: never; short_description_translations: never
          description_translations: never; category_id: string | null; collection_id: string | null
          base_price: number; compare_at_price: number | null; cost_price: number | null
          stock: number; low_stock_threshold: number; is_active: boolean; is_featured: boolean
          is_premium: boolean; is_new: boolean; is_best_seller: boolean; is_limited: boolean
          is_exclusive: boolean; main_image_url: string | null; hover_image_url: string | null
          tags: string[]; meta_title: never; meta_description: never; product_variants: VariantRow[]
        }
        setSlug(p.slug); setSku(p.sku ?? '')
        setName(triFromJson(p.name_translations))
        setShortDesc(triFromJson(p.short_description_translations))
        setDesc(triFromJson(p.description_translations))
        setCategoryId(p.category_id ?? ''); setCollectionId(p.collection_id ?? '')
        setBasePrice(String(p.base_price))
        setComparePrice(p.compare_at_price != null ? String(p.compare_at_price) : '')
        setCostPrice(p.cost_price != null ? String(p.cost_price) : '')
        setStock(String(p.stock)); setLowStock(String(p.low_stock_threshold))
        setBadges({
          is_active: p.is_active, is_featured: p.is_featured, is_premium: p.is_premium,
          is_new: p.is_new, is_best_seller: p.is_best_seller, is_limited: p.is_limited, is_exclusive: p.is_exclusive,
        })
        setMainImage(p.main_image_url ?? ''); setHoverImage(p.hover_image_url ?? '')
        setTags((p.tags ?? []).join(', '))
        setMetaTitle(triFromJson(p.meta_title).fr)
        setMetaDescription(triFromJson(p.meta_description).fr)
        setVariants(p.product_variants.map((v) => {
          const a = v.attributes as Record<string, string>
          return {
            id: v.id, color: a.color ?? '', hex: a.hex ?? '#D8B4A0', size: a.size ?? '',
            sku: v.sku ?? '', price: v.price != null ? String(v.price) : '',
            stock: String(v.stock), image_url: v.image_url ?? '',
          }
        }))
        setLoading(false)
      })
  }, [id, isNew, navigate])

  const updateVariant = (index: number, patch: Partial<VariantForm>) => {
    setVariants((vs) => vs.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  const removeVariant = (index: number) => {
    const v = variants[index]
    if (v?.id) setRemovedVariantIds((ids) => [...ids, v.id as string])
    setVariants((vs) => vs.filter((_, i) => i !== index))
  }

  const save = async () => {
    if (!isAdmin) { toast('RBAC : seuls les admins peuvent créer/modifier des produits.'); return }
    if (!name.fr.trim() || !slug.trim()) { toast('Nom FR et slug obligatoires.'); return }
    const price = Number(basePrice)
    if (!Number.isFinite(price) || price < 0) { toast('Prix de base invalide.'); return }

    setSaving(true)
    try {
      const payload = {
        slug: slug.trim(),
        sku: sku.trim() || null,
        name_translations: triToJson(name),
        short_description_translations: triToJson(shortDesc),
        description_translations: triToJson(desc),
        category_id: categoryId || null,
        collection_id: collectionId || null,
        base_price: price,
        compare_at_price: comparePrice ? Number(comparePrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        stock: Number(stock) || 0,
        low_stock_threshold: Number(lowStock) || 5,
        is_active: !!badges.is_active,
        is_featured: !!badges.is_featured,
        is_premium: !!badges.is_premium,
        is_new: !!badges.is_new,
        is_best_seller: !!badges.is_best_seller,
        is_limited: !!badges.is_limited,
        is_exclusive: !!badges.is_exclusive,
        main_image_url: mainImage.trim() || null,
        hover_image_url: hoverImage.trim() || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        meta_title: { fr: metaTitle, en: '', ar: '' },
        meta_description: { fr: metaDescription, en: '', ar: '' },
      }

      let productId = id as string
      if (isNew) {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single()
        if (error) throw error
        productId = data.id
        await logAudit('create', 'products', productId, { slug: payload.slug })
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
        await logAudit('update', 'products', id, { slug: payload.slug })
      }

      /* Section 72 : synchronisation des variantes (insert / update / delete) */
      if (removedVariantIds.length > 0) {
        const { error } = await supabase.from('product_variants').delete().in('id', removedVariantIds)
        if (error) throw error
      }
      const valid = variants.filter((v) => v.color.trim() || v.size.trim())
      await Promise.all(valid.map((v) => {
        const row = {
          product_id: productId,
          sku: v.sku.trim() || null,
          attributes: {
            ...(v.color.trim() ? { color: v.color.trim(), hex: v.hex } : {}),
            ...(v.size.trim() ? { size: v.size.trim() } : {}),
          },
          price: v.price ? Number(v.price) : null,
          stock: Number(v.stock) || 0,
          image_url: v.image_url.trim() || null,
        }
        return v.id
          ? supabase.from('product_variants').update(row).eq('id', v.id).then((r) => { if (r.error) throw r.error })
          : supabase.from('product_variants').insert(row).then((r) => { if (r.error) throw r.error })
      }))

      toast(isNew ? 'Produit créé ✓' : 'Produit enregistré ✓')
      navigate('/admin/products')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /> Retour aux produits
        </Link>
        <h1 className="font-display text-3xl">{isNew ? 'Nouveau produit' : 'Modifier le produit'}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Colonne principale */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-lg">Informations générales</p>
            <TrilingualFields label="Nom du produit *" value={name} onChange={setName} />
            <TrilingualFields label="Description courte" value={shortDesc} onChange={setShortDesc} textarea />
            <TrilingualFields label="Description complète" value={desc} onChange={setDesc} textarea rows={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-slug">Slug (URL) *</Label>
                <Input id="p-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="abaya-noor" />
              </div>
              <div>
                <Label htmlFor="p-sku">SKU</Label>
                <Input id="p-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="ABAYA-NOOR" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-cat">Catégorie</Label>
                <select id="p-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                  <option value="">— Aucune —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.slug}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="p-col">Collection</Label>
                <select id="p-col" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                  <option value="">— Aucune —</option>
                  {collections.map((c) => <option key={c.id} value={c.id}>{c.slug}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="p-tags">Tags (séparés par des virgules — section 90)</Label>
              <Input id="p-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Premium, Bestseller, Ramadan" />
            </div>
          </div>

          {/* Section 72 : variantes dynamiques */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg">Variantes (section 72)</p>
              <Button size="sm" variant="outline" onClick={() => setVariants((vs) => [...vs, emptyVariant()])}>
                <Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter
              </Button>
            </div>
            {variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune variante — le produit est vendu tel quel (taille/couleur uniques).
              </p>
            ) : (
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={v.id ?? `new-${i}`} className="grid grid-cols-2 items-end gap-2 rounded-xl border border-border p-3 md:grid-cols-[1fr_70px_100px_1fr_80px_70px_1fr_auto]">
                    <div>
                      <Label className="text-[10px]">Couleur</Label>
                      <Input value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })} placeholder="Nude" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Hex</Label>
                      <input type="color" value={v.hex} onChange={(e) => updateVariant(i, { hex: e.target.value })}
                        className="h-11 w-full cursor-pointer rounded-lg border border-border bg-background p-1" aria-label="Couleur hex" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Taille</Label>
                      <Input value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })} placeholder="M" />
                    </div>
                    <div>
                      <Label className="text-[10px]">SKU variante</Label>
                      <Input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-[10px]">Prix (DT)</Label>
                      <Input type="number" min="0" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} placeholder="vide = prix produit" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Stock</Label>
                      <Input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(i, { stock: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-[10px]">Image (URL)</Label>
                      <Input value={v.image_url} onChange={(e) => updateVariant(i, { image_url: e.target.value })} />
                    </div>
                    <button onClick={() => removeVariant(i)} className="mb-2 rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer la variante">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO (section 78) */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-lg">SEO</p>
            <div>
              <Label htmlFor="p-mt">Meta title</Label>
              <Input id="p-mt" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p-md">Meta description</Label>
              <Textarea id="p-md" rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-lg">Prix (DT)</p>
            <div>
              <Label htmlFor="p-price">Prix de base *</Label>
              <Input id="p-price" type="number" min="0" step="0.5" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p-compare">Ancien prix (promotion)</Label>
              <Input id="p-compare" type="number" min="0" step="0.5" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p-cost">Coût (interne)</Label>
              <Input id="p-cost" type="number" min="0" step="0.5" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-lg">Stock</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="p-stock">Stock</Label>
                <Input id="p-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-low">Seuil alerte</Label>
                <Input id="p-low" type="number" min="0" value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-lg">Badges & statut</p>
            {BADGE_FIELDS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-sm">{label}</span>
                <Switch checked={!!badges[key]} onCheckedChange={(v) => setBadges((b) => ({ ...b, [key]: v }))} aria-label={label} />
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-lg">Images</p>
            <div>
              <Label htmlFor="p-img1">Image principale (URL)</Label>
              <Input id="p-img1" value={mainImage} onChange={(e) => setMainImage(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p-img2">Image hover (URL)</Label>
              <Input id="p-img2" value={hoverImage} onChange={(e) => setHoverImage(e.target.value)} />
            </div>
            {mainImage && <img src={mainImage} alt="Aperçu" className="aspect-[3/4] w-full rounded-xl object-cover" />}
          </div>

          <Button size="lg" className="w-full" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" aria-hidden />
            {saving ? 'Enregistrement…' : isNew ? 'Créer le produit' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}