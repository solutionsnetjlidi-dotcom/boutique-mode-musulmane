import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, MessageCircle, Minus, Plus, ShoppingBag, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/shop/Breadcrumb'
import ProductGallery from '@/components/product/ProductGallery'
import SizeGuideDialog from '@/components/product/SizeGuideDialog'
import ReviewsBlock, { RatingStars } from '@/components/product/ReviewsBlock'
import { CrossSellLook, ProductRow, buildLook } from '@/components/product/RelatedProducts'
import { ProductBadges } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/common/Toaster'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { loadCatalogData } from '@/services/shop'
import type { CatalogProduct } from '@/services/shop'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { isWishlisted, toggleWishlist } from '@/lib/wishlist'
import { useSeo, JsonLd } from '@/lib/seo'
import { cn } from '@/lib/utils'
import type { ReviewRow, VariantRow } from '@/types/database.types'

type Tab = 'description' | 'details' | 'shipping'

/** Sections 32-39 : fiche produit premium + SEO/JSON-LD (section 79). */
export default function ProductPage() {
  const { slug = '' } = useParams()
  const { lang } = useLanguage()
  const { addItem } = useCart()
  const settings = useSiteSettings()
  const whatsappNumber = settingString(settings, 'whatsapp_number')

  const [product, setProduct] = useState<CatalogProduct | null | undefined>(undefined)
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [tab, setTab] = useState<Tab>('description')
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [wished, setWished] = useState(false)

  const loadReviews = useCallback(async (productId: string) => {
    const { data } = await supabase
      .from('reviews').select('*')
      .eq('product_id', productId).eq('is_approved', true)
      .order('created_at', { ascending: false })
    setReviews((data ?? []) as ReviewRow[])
  }, [])

  useEffect(() => {
    setProduct(undefined); setTab('description'); setQty(1); setColor(null); setSize(null)

    loadCatalogData()
      .then((cat) => {
        setCatalog(cat.products)
        const p = cat.products.find((x) => x.slug === slug) ?? null
        setProduct(p)
        if (p) {
          setWished(isWishlisted(p.id))
          void loadReviews(p.id)
        }
      })
      .catch(() => setProduct(null))
  }, [slug, loadReviews])

  const variants = product?.product_variants ?? []
  const colors = useMemo(() => {
    const map = new Map<string, string>()
    variants.forEach((v) => {
      const a = v.attributes as Record<string, string>
      if (a.color && !map.has(a.color)) map.set(a.color, a.hex ?? '#CCC')
    })
    return [...map.entries()]
  }, [variants])

  const sizes = useMemo(() => {
    const set = new Set<string>()
    variants.forEach((v) => {
      const a = v.attributes as Record<string, string>
      if (a.size && a.size !== 'Taille unique') set.add(a.size)
    })
    return [...set]
  }, [variants])

  const selected: VariantRow | null = useMemo(() => {
    if (variants.length <= 1) return variants[0] ?? null
    return variants.find((v) => {
      const a = v.attributes as Record<string, string>
      return (colors.length === 0 || a.color === color) && (sizes.length === 0 || a.size === size)
    }) ?? null
  }, [variants, colors.length, sizes.length, color, size])

  const needsSelection = (colors.length > 1 && !color) || (sizes.length > 0 && !size)
  const price = selected?.price ?? product?.base_price ?? 0
  const stock = selected ? selected.stock : product?.stock ?? 0
  const lowStock = product ? stock > 0 && stock <= product.low_stock_threshold : false
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const realReviews = reviews.filter((r) => !r.is_demo)

  /* Sections 37-39 : associés / cross-sell / upsell */
  const look = useMemo(() => (product ? buildLook(product, catalog) : []), [product, catalog])
  const related = useMemo(() => {
    if (!product) return []
    return catalog
      .filter((p) => p.id !== product.id && p.stock > 0 &&
        (p.categories?.slug === product.categories?.slug ||
          (product.collection_id != null && p.collection_id === product.collection_id)))
      .sort((a, b) => b.sold_count - a.sold_count)
      .slice(0, 4)
  }, [product, catalog])
  const upsell = useMemo(() =>
    catalog.filter((p) => p.id !== product?.id && p.is_premium && p.stock > 0).slice(0, 4),
  [catalog, product])

  useSeo({
    title: product ? `${translate(product.name_translations, lang)} | Mode Musulmane Premium` : undefined,
    description: product ? translate(product.short_description_translations, lang) : undefined,
    ogImage: product?.main_image_url ?? undefined,
  })

  if (product === undefined) {
    return (
      <div className="container grid gap-8 py-10 lg:grid-cols-2" aria-busy="true">
        <Skeleton className="aspect-[3/4] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (product === null) {
    return (
      <p className="container py-24 text-center text-sm text-muted-foreground">
        {translate({ fr: 'Produit introuvable.', en: 'Product not found.', ar: 'المنتج غير موجود.' }, lang)}
      </p>
    )
  }

  const name = translate(product.name_translations, lang)

  const handleAdd = (navigateTo?: string) => {
    if (needsSelection) {
      toast(translate({ fr: 'Veuillez choisir une couleur / taille', en: 'Please pick a color / size', ar: 'يرجى اختيار اللون / المقاس' }, lang))
      return
    }
    if (!addItem(product, selected, qty)) {
      toast(translate({ fr: 'Stock insuffisant', en: 'Not enough stock', ar: 'المخزون غير كافٍ' }, lang))
      return
    }
    if (navigateTo) window.location.href = navigateTo
  }

  const selectedAttrs = selected
    ? Object.entries(selected.attributes as Record<string, string>).filter(([k]) => k !== 'hex').map(([k, v]) => `${k}: ${v}`).join(', ')
    : ''
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Bonjour, je souhaite commander : ${name}${selectedAttrs ? ` (${selectedAttrs})` : ''} — ${formatPrice(price)}`,
      )}`
    : null

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate({ fr: 'Boutique', en: 'Shop', ar: 'المتجر' }, lang), to: '/shop' },
        ...(product.categories ? [{ label: translate(product.categories.name_translations, lang), to: `/category/${product.categories.slug}` }] : []),
        { label: name },
      ]} />

      <div className="container grid gap-10 py-8 lg:grid-cols-2">
        {/* Galerie (section 33) */}
        <div className="relative">
          <ProductBadges product={product} />
          <ProductGallery product={product} variantImage={selected?.image_url} />
        </div>

        {/* Informations (section 32) */}
        <div>
          {product.categories && (
            <Link to={`/category/${product.categories.slug}`} className="text-xs uppercase tracking-[0.2em] text-primary">
              {translate(product.categories.name_translations, lang)}
            </Link>
          )}
          <h1 className="mt-1 font-display text-3xl md:text-4xl">{name}</h1>

          {reviews.length > 0 && (
            <a href="#avis" className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
              <RatingStars rating={avgRating} /> ({reviews.length})
            </a>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold price-ltr">{formatPrice(price)}</span>
            {product.compare_at_price && (
              <>
                <span className="text-base text-muted-foreground line-through price-ltr">{formatPrice(product.compare_at_price)}</span>
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  -{Math.round((1 - price / product.compare_at_price) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Section 35 : stock calculé depuis la variante réelle */}
          <p className={cn('mt-3 text-sm font-medium',
            stock <= 0 ? 'text-red-500' : lowStock ? 'text-amber-600' : 'text-emerald-600')}
            aria-live="polite"
          >
            {stock <= 0
              ? translate({ fr: 'Rupture de stock', en: 'Out of stock', ar: 'نفد المخزون' }, lang)
              : lowStock
                ? translate({ fr: `Stock faible — plus que ${stock}`, en: `Low stock — only ${stock} left`, ar: `مخزون محدود — بقي ${stock} فقط` }, lang)
                : translate({ fr: 'En stock', en: 'In stock', ar: 'متوفر' }, lang)}
          </p>

          {product.sku && (
            <p className="mt-1 text-xs text-muted-foreground">SKU : {selected?.sku ?? product.sku}</p>
          )}

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {translate(product.short_description_translations, lang)}
          </p>

          {/* Couleurs (section 34) */}
          {colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
                {translate({ fr: 'Couleur', en: 'Color', ar: 'اللون' }, lang)} {color ? `— ${color}` : ''}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {colors.map(([cName, hex]) => (
                  <button
                    key={cName}
                    onClick={() => setColor(cName)}
                    aria-pressed={color === cName}
                    aria-label={cName}
                    title={cName}
                    className={cn('h-9 w-9 rounded-full ring-2 ring-offset-2 transition',
                      color === cName ? 'ring-primary' : 'ring-transparent hover:ring-border')}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tailles + guide (section 36) */}
          {sizes.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {translate({ fr: 'Taille', en: 'Size', ar: 'المقاس' }, lang)}
                </p>
                <SizeGuideDialog product={product} />
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={cn('min-w-11 rounded-lg border px-4 py-2.5 text-sm transition',
                      size === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantité + wishlist */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button onClick={() => setQty((v) => Math.max(1, v - 1))} className="p-3"
                aria-label={translate({ fr: 'Diminuer', en: 'Decrease', ar: 'إنقاص' }, lang)}>
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="w-10 text-center text-sm font-medium" aria-live="polite">{qty}</span>
              <button onClick={() => setQty((v) => Math.min(Math.max(stock, 1), v + 1))} className="p-3"
                aria-label={translate({ fr: 'Augmenter', en: 'Increase', ar: 'زيادة' }, lang)}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <button
              onClick={() => setWished(toggleWishlist(product.id))}
              aria-pressed={wished}
              aria-label={wished
                ? translate({ fr: 'Retirer de la wishlist', en: 'Remove from wishlist', ar: 'إزالة من الأمنيات' }, lang)
                : translate({ fr: 'Ajouter à la wishlist', en: 'Add to wishlist', ar: 'إضافة إلى الأمنيات' }, lang)}
              className="rounded-full border border-border p-3 transition hover:border-primary"
            >
              <Heart className={cn('h-4 w-4', wished && 'fill-primary text-primary')} aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <Button size="lg" onClick={() => handleAdd()} disabled={stock <= 0}>
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {translate({ fr: 'Ajouter au panier', en: 'Add to cart', ar: 'أضيفي إلى السلة' }, lang)}
            </Button>
            <Button size="lg" variant="dark" onClick={() => handleAdd('/cart')} disabled={stock <= 0}>
              <Zap className="h-4 w-4" aria-hidden />
              {translate({ fr: 'Acheter maintenant', en: 'Buy now', ar: 'اشترِ الآن' }, lang)}
            </Button>
            {whatsappHref && (
              <Button size="lg" variant="outline" asChild>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {translate({ fr: 'Commander via WhatsApp', en: 'Order via WhatsApp', ar: 'اطلبي عبر واتساب' }, lang)}
                </a>
              </Button>
            )}
          </div>

          {/* Onglets description / détails / livraison */}
          <div className="mt-8">
            <div className="flex gap-6 border-b border-border text-sm" role="tablist">
              {([
                ['description', { fr: 'Description', en: 'Description', ar: 'الوصف' }],
                ['details', { fr: 'Détails', en: 'Details', ar: 'التفاصيل' }],
                ['shipping', { fr: 'Livraison & Retours', en: 'Shipping & Returns', ar: 'التوصيل والإرجاع' }],
              ] as [Tab, { fr: string; en: string; ar: string }][]).map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn('border-b-2 pb-3 transition',
                    tab === key ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
                >
                  {translate(label, lang)}
                </button>
              ))}
            </div>
            <div className="pt-4 text-sm leading-relaxed text-muted-foreground">
              {tab === 'description' && translate(product.description_translations, lang)}
              {tab === 'details' && (
                <ul className="space-y-1.5">
                  {product.material && (
                    <li>{translate({ fr: 'Matière', en: 'Material', ar: 'الخامة' }, lang)} : {product.material}</li>
                  )}
                  <li>SKU : {selected?.sku ?? product.sku ?? '—'}</li>
                  {product.tags.length > 0 && <li>Tags : {product.tags.join(', ')}</li>}
                  {product.collections && (
                    <li>{translate({ fr: 'Collection', en: 'Collection', ar: 'التشكيلة' }, lang)} : {translate(product.collections.name_translations, lang)}</li>
                  )}
                </ul>
              )}
              {tab === 'shipping' && translate({
                fr: 'Expédition sous 24 à 48h, livraison partout en Tunisie en 2 à 4 jours ouvrés. Retours acceptés sous 7 jours (produit non porté, étiquettes d\'origine). Paiement à la livraison avec confirmation WhatsApp.',
                en: 'Shipped within 24-48h, delivery all over Tunisia in 2-4 working days. Returns accepted within 7 days (unworn, original tags). Cash on delivery with WhatsApp confirmation.',
                ar: 'الشحن خلال 24-48 ساعة والتوصيل لكامل تونس خلال 2-4 أيام عمل. الإرجاع مقبول خلال 7 أيام (منتج غير مرتدى مع البطاقات). الدفع عند الاستلام مع تأكيد عبر واتساب.',
              }, lang)}
            </div>
          </div>
        </div>
      </div>

      {/* Sections associées (37-39) */}
      <CrossSellLook product={product} look={look} />
      <ReviewsBlock productId={product.id} reviews={reviews} onReviewAdded={() => void loadReviews(product.id)} />
      <ProductRow
        title={translate({ fr: 'Vous pourriez aussi aimer', en: 'You may also like', ar: 'قد يعجبك أيضاً' }, lang)}
        products={related}
      />
      <ProductRow
        title={translate({ fr: 'Produits similaires', en: 'Similar products', ar: 'منتجات مشابهة' }, lang)}
        products={upsell}
      />

      {/* Section 79 : JSON-LD Product + Offer (+ AggregateRating uniquement avis réels) */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        image: product.main_image_url ?? undefined,
        description: translate(product.short_description_translations, lang),
        sku: product.sku ?? undefined,
        offers: {
          '@type': 'Offer',
          price,
          priceCurrency: 'TND',
          availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        ...(realReviews.length > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Math.round(avgRating * 10) / 10,
                reviewCount: realReviews.length,
              },
            }
          : {}),
      }} />
    </>
  )
}