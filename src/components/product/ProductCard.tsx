import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Heart, ShoppingBag } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { isWishlisted, toggleWishlist } from '@/lib/wishlist'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { toast } from '@/components/common/Toaster'
import { cn } from '@/lib/utils'
import type { ProductWithVariants } from '@/types/database.types'
import QuickView from '@/components/product/QuickView'

/** Section 21 : badges administrables (NEW, Best Seller, Premium, -X%, Rupture…). */
export function ProductBadges({ product }: { product: ProductWithVariants }) {
  const discount = product.compare_at_price
    ? Math.round((1 - product.base_price / product.compare_at_price) * 100)
    : 0
  const badges: { label: string; className: string }[] = []

  if (product.stock <= 0) badges.push({ label: 'Rupture', className: 'bg-neutral-800 text-white' })
  else if (product.is_limited) badges.push({ label: 'Limited Edition', className: 'bg-neutral-900 text-white' })
  if (product.is_exclusive) badges.push({ label: 'Exclusivité', className: 'bg-purple-700 text-white' })
  if (product.is_premium) badges.push({ label: 'Premium', className: 'bg-[#C9A961] text-white' })
  if (product.is_new) badges.push({ label: 'Nouveau', className: 'bg-primary text-primary-foreground' })
  if (product.is_best_seller) badges.push({ label: 'Best Seller', className: 'bg-foreground text-background' })
  if (discount > 0) badges.push({ label: `-${discount}%`, className: 'bg-red-500 text-white' })

  return (
    <div className="absolute start-3 top-3 z-10 flex flex-col items-start gap-1.5">
      {badges.slice(0, 3).map((b) => (
        <span key={b.label} className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider', b.className)}>
          {b.label}
        </span>
      ))}
    </div>
  )
}

export function ColorDots({ product }: { product: ProductWithVariants }) {
  const colors = useMemo(() => {
    const seen = new Map<string, string>()
    for (const v of product.product_variants) {
      const attrs = v.attributes as Record<string, string>
      if (attrs.color && attrs.hex && !seen.has(attrs.color)) seen.set(attrs.color, attrs.hex)
    }
    return [...seen.entries()].slice(0, 5)
  }, [product])

  if (colors.length === 0) return null
  return (
    <div className="flex gap-1.5" aria-label="Couleurs disponibles">
      {colors.map(([name, hex]) => (
        <span key={name} title={name} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: hex }} />
      ))}
    </div>
  )
}

/**
 * Sections 20-23 : carte produit premium.
 * Quick Add : si variantes obligatoires → ouvre le QuickView (jamais d'ajout automatique incorrect).
 */
export default function ProductCard({ product }: { product: ProductWithVariants }) {
  const { lang } = useLanguage()
  const { addItem } = useCart()
  const [wished, setWished] = useState(() => isWishlisted(product.id))
  const [quickViewOpen, setQuickViewOpen] = useState(false)

  const soldOut = product.stock <= 0
  const hasRequiredVariants = product.product_variants.length > 1

  const handleQuickAdd = () => {
    if (soldOut) return
    if (hasRequiredVariants) {
      setQuickViewOpen(true)
      return
    }
    const ok = addItem(product, product.product_variants[0] ?? null, 1)
    toast(ok
      ? translate({ fr: 'Produit ajouté au panier ✓', en: 'Added to cart ✓', ar: 'أُضيف إلى السلة ✓' }, lang)
      : translate({ fr: 'Stock insuffisant', en: 'Not enough stock', ar: 'المخزون غير كافٍ' }, lang))
  }

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <ProductBadges product={product} />

        {/* Wishlist */}
        <button
          onClick={() => setWished(toggleWishlist(product.id))}
          className="absolute end-3 top-3 z-10 rounded-full bg-card/90 p-2 shadow-sm backdrop-blur transition hover:scale-110"
          aria-label={wished
            ? translate({ fr: 'Retirer de la wishlist', en: 'Remove from wishlist', ar: 'إزالة من الأمنيات' }, lang)
            : translate({ fr: 'Ajouter à la wishlist', en: 'Add to wishlist', ar: 'إضافة إلى الأمنيات' }, lang)}
          aria-pressed={wished}
        >
          <Heart className={cn('h-4 w-4 transition', wished ? 'fill-primary text-primary' : 'text-foreground')} aria-hidden />
        </button>

        <Link to={`/product/${product.slug}`} aria-label={translate(product.name_translations, lang)}>
          <div className="aspect-[3/4] w-full overflow-hidden">
            <img
              src={product.main_image_url ?? undefined}
              alt={translate(product.name_translations, lang)}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-0"
            />
          </div>
          {product.hover_image_url && (
            <img
              src={product.hover_image_url}
              alt=""
              loading="lazy"
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Actions hover (desktop) — toujours visibles sur mobile (section 109) */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex translate-y-2 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          <button
            onClick={() => setQuickViewOpen(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-card/95 py-2.5 text-xs font-medium shadow-sm backdrop-blur transition hover:bg-card"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden /> Quick View
          </button>
          <button
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            {soldOut
              ? translate({ fr: 'Épuisé', en: 'Sold out', ar: 'نفد' }, lang)
              : 'Quick Add'}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 px-1">
        <Link to={`/product/${product.slug}`} className="line-clamp-1 text-sm font-medium transition hover:text-primary">
          {translate(product.name_translations, lang)}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold price-ltr">{formatPrice(product.base_price)}</span>
          {product.compare_at_price && (
            <span className="text-xs text-muted-foreground line-through price-ltr">{formatPrice(product.compare_at_price)}</span>
          )}
        </div>
        <ColorDots product={product} />
      </div>

      <QuickView product={product} open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </article>
  )
}