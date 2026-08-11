import { Link, useNavigate } from 'react-router-dom'
import { Heart, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Breadcrumb from '@/components/shop/Breadcrumb'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingNumber } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { toggleWishlist } from '@/lib/wishlist'
import { toast } from '@/components/common/Toaster'

/** Section 41 : page panier. */
export default function CartPage() {
  const { items, count, subtotal, setQuantity, removeItem } = useCart()
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const settings = useSiteSettings()
  const threshold = settingNumber(settings, 'free_shipping_threshold', 150)
  const remaining = Math.max(threshold - subtotal, 0)

  const saveForLater = (productId: string, key: string) => {
    toggleWishlist(productId)
    removeItem(key)
    toast(translate({ fr: 'Article déplacé vers la wishlist', en: 'Moved to wishlist', ar: 'نُقل إلى قائمة الأمنيات' }, lang))
  }

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate({ fr: 'Panier', en: 'Cart', ar: 'السلة' }, lang) },
      ]} />

      <div className="container py-8">
        <h1 className="mb-8 font-display text-3xl md:text-4xl">
          {translate({ fr: 'Mon Panier', en: 'My Cart', ar: 'سلتي' }, lang)}
          {count > 0 && <span className="ml-3 text-base font-normal text-muted-foreground">({count})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" aria-hidden />
            <p className="font-display text-xl">
              {translate({ fr: 'Votre panier est vide', en: 'Your cart is empty', ar: 'سلتك فارغة' }, lang)}
            </p>
            <Button asChild>
              <Link to="/shop">{translate({ fr: 'Découvrir la boutique', en: 'Browse the shop', ar: 'اكتشفي المتجر' }, lang)}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Lignes panier */}
            <div className="divide-y divide-border rounded-2xl border border-border bg-card">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4 p-5">
                  <Link to={`/product/${item.slug}`}>
                    <img src={item.image ?? undefined} alt="" className="h-28 rounded-xl bg-muted object-cover" style={{ width: '5.5rem' }} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/product/${item.slug}`} className="font-medium transition hover:text-primary">
                          {translate(item.name_translations, lang)}
                        </Link>
                        {Object.entries(item.attributes).filter(([k]) => k !== 'hex').map(([k, v]) => (
                          <p key={k} className="mt-0.5 text-xs capitalize text-muted-foreground">{k} : {v}</p>
                        ))}
                        <p className="mt-1 text-sm font-semibold price-ltr">{formatPrice(item.unit_price)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.key)}
                        className="rounded-full p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                        aria-label={translate({ fr: 'Supprimer', en: 'Remove', ar: 'حذف' }, lang)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center rounded-full border border-border">
                        <button onClick={() => setQuantity(item.key, item.quantity - 1)} className="p-2.5"
                          aria-label={translate({ fr: 'Diminuer', en: 'Decrease', ar: 'إنقاص' }, lang)}>
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <span className="w-9 text-center text-sm font-medium" aria-live="polite">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.max_stock}
                          className="p-2.5 disabled:opacity-40"
                          aria-label={translate({ fr: 'Augmenter', en: 'Increase', ar: 'زيادة' }, lang)}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        {item.quantity >= item.max_stock && (
                          <span className="text-xs text-amber-600">
                            {translate({ fr: 'Stock maximum atteint', en: 'Max stock reached', ar: 'الحد الأقصى للمخزون' }, lang)}
                          </span>
                        )}
                        <button
                          onClick={() => saveForLater(item.product_id, item.key)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2 transition hover:text-primary"
                        >
                          <Heart className="h-3.5 w-3.5" aria-hidden />
                          {translate({ fr: 'Garder pour plus tard', en: 'Save for later', ar: 'احفظيه لاحقاً' }, lang)}
                        </button>
                        <p className="text-base font-semibold price-ltr">{formatPrice(item.unit_price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif */}
            <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
              <p className="font-display text-xl">{translate({ fr: 'Récapitulatif', en: 'Summary', ar: 'الملخص' }, lang)}</p>

              {threshold > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    {remaining > 0
                      ? translate({
                          fr: `Il vous manque ${formatPrice(remaining)} pour bénéficier de la livraison gratuite.`,
                          en: `Add ${formatPrice(remaining)} more to get free shipping.`,
                          ar: `أضيفي ${formatPrice(remaining)} للحصول على توصيل مجاني.`,
                        }, lang)
                      : translate({ fr: '🎉 Vous bénéficiez de la livraison gratuite !', en: '🎉 You get free shipping!', ar: '🎉 حصلتِ على التوصيل المجاني!' }, lang)}
                  </p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((subtotal / threshold) * 100, 100)}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">{translate({ fr: 'Sous-total', en: 'Subtotal', ar: 'المجموع الفرعي' }, lang)}</span>
                <span className="text-xl font-semibold price-ltr">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {translate({
                  fr: 'Livraison et remises calculées à l\'étape suivante.',
                  en: 'Shipping and discounts calculated at the next step.',
                  ar: 'تُحتسب التوصيل والخصومات في الخطوة التالية.',
                }, lang)}
              </p>

              <Button size="lg" variant="dark" className="w-full" onClick={() => navigate('/checkout')}>
                {translate({ fr: 'Passer la commande', en: 'Proceed to checkout', ar: 'إتمام الطلب' }, lang)}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/shop">{translate({ fr: 'Continuer mes achats', en: 'Continue shopping', ar: 'مواصلة التسوق' }, lang)}</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </>
  )
}