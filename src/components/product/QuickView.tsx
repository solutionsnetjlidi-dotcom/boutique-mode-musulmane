import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Zap } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { toast } from '@/components/common/Toaster'
import { cn } from '@/lib/utils'
import type { ProductWithVariants, VariantRow } from '@/types/database.types'

/** Section 22 : modal Quick View (galerie, variantes, stock, quantité, ajouter / acheter). */
export default function QuickView({
  product, open, onClose,
}: {
  product: ProductWithVariants
  open: boolean
  onClose: () => void
}) {
  const { lang } = useLanguage()
  const { addItem } = useCart()
  const variants = product.product_variants

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

  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (open) {
      setColor(colors.length === 1 ? colors[0][0] : null)
      setSize(null)
      setQty(1)
    }
  }, [open, colors, sizes.length])

  const selected: VariantRow | null = useMemo(() => {
    if (variants.length <= 1) return variants[0] ?? null
    return variants.find((v) => {
      const a = v.attributes as Record<string, string>
      const colorOk = colors.length === 0 || a.color === color
      const sizeOk = sizes.length === 0 || a.size === size
      return colorOk && sizeOk
    }) ?? null
  }, [variants, colors.length, sizes.length, color, size])

  const needsSelection = (colors.length > 1 && !color) || (sizes.length > 0 && !size)
  const stock = selected ? selected.stock : product.stock
  const price = selected?.price ?? product.base_price
  const gallery = [product.main_image_url, product.hover_image_url].filter(Boolean) as string[]

  const handleAdd = (thenNavigate?: string) => {
    if (needsSelection) {
      toast(translate({ fr: 'Veuillez choisir une couleur / taille', en: 'Please pick a color / size', ar: 'يرجى اختيار اللون / المقاس' }, lang))
      return
    }
    const ok = addItem(product, selected, qty)
    if (!ok) {
      toast(translate({ fr: 'Stock insuffisant', en: 'Not enough stock', ar: 'المخزون غير كافٍ' }, lang))
      return
    }
    onClose()
    if (thenNavigate) window.location.href = thenNavigate
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Galerie */}
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl bg-muted">
              <img
                src={(selected?.image_url ?? product.main_image_url) ?? undefined}
                alt={translate(product.name_translations, lang)}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2">
                {gallery.map((src) => (
                  <img key={src} src={src} alt="" className="h-16 rounded-lg border border-border object-cover" style={{ width: '3.5rem' }} />
                ))}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex flex-col">
            <h2 className="font-display text-2xl">{translate(product.name_translations, lang)}</h2>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-semibold price-ltr">{formatPrice(price)}</span>
              {product.compare_at_price && (
                <span className="text-sm text-muted-foreground line-through price-ltr">{formatPrice(product.compare_at_price)}</span>
              )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {translate(product.short_description_translations, lang)}
            </p>

            {/* Section 35 : stock calculé depuis la variante réelle */}
            <p className={cn('mt-3 text-xs font-medium', stock > 0 ? 'text-emerald-600' : 'text-red-500')} aria-live="polite">
              {stock <= 0
                ? translate({ fr: 'Rupture de stock', en: 'Out of stock', ar: 'نفد المخزون' }, lang)
                : stock <= product.low_stock_threshold
                  ? translate({ fr: `Stock faible — plus que ${stock}`, en: `Low stock — only ${stock} left`, ar: `مخزون محدود — بقي ${stock} فقط` }, lang)
                  : translate({ fr: 'En stock', en: 'In stock', ar: 'متوفر' }, lang)}
            </p>

            {colors.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  {translate({ fr: 'Couleur', en: 'Color', ar: 'اللون' }, lang)} {color ? `— ${color}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map(([cName, hex]) => (
                    <button
                      key={cName}
                      onClick={() => setColor(cName)}
                      className={cn('h-8 w-8 rounded-full ring-2 ring-offset-2 transition', color === cName ? 'ring-primary' : 'ring-transparent hover:ring-border')}
                      style={{ backgroundColor: hex }}
                      aria-label={cName}
                      aria-pressed={color === cName}
                    />
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  {translate({ fr: 'Taille', en: 'Size', ar: 'المقاس' }, lang)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn('min-w-10 rounded-lg border px-3 py-2 text-sm transition', size === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
                      aria-pressed={size === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5"
                  aria-label={translate({ fr: 'Diminuer', en: 'Decrease', ar: 'إنقاص' }, lang)}>
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="w-10 text-center text-sm font-medium" aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1))} className="p-2.5"
                  aria-label={translate({ fr: 'Augmenter', en: 'Increase', ar: 'زيادة' }, lang)}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => handleAdd()} disabled={stock <= 0}>
                <ShoppingBag className="h-4 w-4" aria-hidden />
                {translate({ fr: 'Ajouter au panier', en: 'Add to cart', ar: 'أضيفي إلى السلة' }, lang)}
              </Button>
              <Button variant="dark" onClick={() => handleAdd('/cart')} disabled={stock <= 0}>
                <Zap className="h-4 w-4" aria-hidden />
                {translate({ fr: 'Acheter maintenant', en: 'Buy now', ar: 'اشترِ الآن' }, lang)}
              </Button>
              <Button variant="link" asChild className="mx-auto">
                <Link to={`/product/${product.slug}`} onClick={onClose}>
                  {translate({ fr: 'Voir le produit complet →', en: 'View full product →', ar: 'عرض المنتج كاملاً ←' }, lang)}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}