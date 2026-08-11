import { Plus, ShoppingBag } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { toast } from '@/components/common/Toaster'
import type { CatalogProduct } from '@/services/shop'

const CLOTHING = ['hijab', 'jilbab', 'abaya', 'khimar', 'robes-modestes', 'tuniques', 'sous-hijab']

/** Section 38 : construction du look (ex. Jilbab + Hijab + Broche + Sac). */
export function buildLook(product: CatalogProduct, catalog: CatalogProduct[]): CatalogProduct[] {
  const cat = product.categories?.slug
  const inStock = (p: CatalogProduct) => p.stock > 0 && p.id !== product.id
  const look: CatalogProduct[] = []
  const pick = (pred: (p: CatalogProduct) => boolean) => {
    const found = catalog.find((p) => inStock(p) && pred(p) && !look.some((l) => l.id === p.id))
    if (found) look.push(found)
  }

  if (cat && CLOTHING.includes(cat)) {
    pick((p) => p.categories?.slug === 'accessoires')
    pick((p) => CLOTHING.includes(p.categories?.slug ?? '') && p.categories?.slug !== cat)
    pick((p) => p.tags.includes('Gift') || p.categories?.slug === 'coffrets-cadeaux')
  } else {
    pick((p) => CLOTHING.includes(p.categories?.slug ?? ''))
    pick((p) => p.categories?.slug === 'accessoires')
  }
  return look.slice(0, 3)
}

/** Section 38 : "Complétez votre look" + bouton "Ajouter le look complet". */
export function CrossSellLook({ product, look }: { product: CatalogProduct; look: CatalogProduct[] }) {
  const { lang } = useLanguage()
  const { addItem } = useCart()
  if (look.length === 0) return null

  const items = [product, ...look]
  const total = items.reduce((sum, p) => sum + p.base_price, 0)

  const addAll = () => {
    let added = 0
    items.forEach((p) => {
      if (addItem(p, p.product_variants[0] ?? null, 1)) added += 1
    })
    toast(added === items.length
      ? translate({ fr: 'Look complet ajouté au panier ✓', en: 'Full look added to cart ✓', ar: 'أُضيفت الإطلالة الكاملة إلى السلة ✓' }, lang)
      : translate({ fr: 'Certains articles sont en rupture.', en: 'Some items are out of stock.', ar: 'بعض المنتجات نفدت.' }, lang))
  }

  return (
    <section className="bg-muted/40 py-14">
      <div className="container">
        <h2 className="mb-8 text-center font-display text-3xl">
          {translate({ fr: 'Complétez votre look', en: 'Complete your look', ar: 'أكملي إطلالتك' }, lang)}
        </h2>
        <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-4 md:flex-row md:items-center">
          {items.map((p, i) => (
            <div key={p.id} className="flex flex-1 items-center gap-4 md:flex-col">
              {i > 0 && <Plus className="hidden shrink-0 text-muted-foreground md:block" aria-hidden />}
              <div className="w-full overflow-hidden rounded-2xl bg-card">
                <img src={p.main_image_url ?? undefined} alt={translate(p.name_translations, lang)} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                <div className="p-3 text-center">
                  <p className="line-clamp-1 text-sm">{translate(p.name_translations, lang)}</p>
                  <p className="text-sm font-semibold price-ltr">{formatPrice(p.base_price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {translate({ fr: 'Total du look :', en: 'Look total:', ar: 'مجموع الإطلالة:' }, lang)}{' '}
            <span className="font-semibold text-foreground price-ltr">{formatPrice(total)}</span>
          </p>
          <Button size="lg" onClick={addAll}>
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {translate({ fr: 'Ajouter le look complet', en: 'Add the full look', ar: 'أضيفي الإطلالة الكاملة' }, lang)}
          </Button>
        </div>
      </div>
    </section>
  )
}

/** Sections 37 & 39 : "Vous pourriez aussi aimer" / "Produits similaires". */
export function ProductRow({ title, products }: { title: string; products: CatalogProduct[] }) {
  if (products.length === 0) return null
  return (
    <section className="container py-12">
      <h2 className="mb-8 text-center font-display text-3xl">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}