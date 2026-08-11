import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingNumber } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'

/**
 * Section 42 : drawer panier.
 * S'ouvre automatiquement après chaque ajout (événement cart:item-added du CartContext).
 */
export default function MiniCart() {
  const { items, count, subtotal, setQuantity, removeItem } = useCart()
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const settings = useSiteSettings()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onAdd = () => setOpen(true)
    window.addEventListener('cart:item-added', onAdd)
    return () => window.removeEventListener('cart:item-added', onAdd)
  }, [])

  const threshold = settingNumber(settings, 'free_shipping_threshold', 150)
  const remaining = Math.max(threshold - subtotal, 0)
  const progress = threshold > 0 ? Math.min((subtotal / threshold) * 100, 100) : 100

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" aria-hidden />
            {translate({ fr: 'Panier', en: 'Cart', ar: 'السلة' }, lang)} ({count})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {translate({ fr: 'Votre panier est vide.', en: 'Your cart is empty.', ar: 'سلتك فارغة.' }, lang)}
            </p>
            <Button variant="outline" onClick={() => go('/shop')}>
              {translate({ fr: 'Découvrir la boutique', en: 'Browse the shop', ar: 'اكتشفي المتجر' }, lang)}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <div key={item.key} className="flex gap-3">
                  <img src={item.image ?? undefined} alt="" className="h-20 rounded-lg bg-muted object-cover" style={{ width: '4rem' }} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{translate(item.name_translations, lang)}</p>
                    {Object.entries(item.attributes).filter(([k]) => k !== 'hex').map(([k, v]) => (
                      <p key={k} className="text-xs capitalize text-muted-foreground">{k} : {v}</p>
                    ))}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border">
                        <button onClick={() => setQuantity(item.key, item.quantity - 1)} className="p-1.5"
                          aria-label={translate({ fr: 'Diminuer', en: 'Decrease', ar: 'إنقاص' }, lang)}>
                          <Minus className="h-3 w-3" aria-hidden />
                        </button>
                        <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.max_stock}
                          className="p-1.5 disabled:opacity-40"
                          aria-label={translate({ fr: 'Augmenter', en: 'Increase', ar: 'زيادة' }, lang)}
                        >
                          <Plus className="h-3 w-3" aria-hidden />
                        </button>
                      </div>
                      <p className="text-sm font-semibold price-ltr">{formatPrice(item.unit_price * item.quantity)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    className="self-start rounded-full p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                    aria-label={translate({ fr: 'Supprimer', en: 'Remove', ar: 'حذف' }, lang)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>

            <SheetFooter className="space-y-3 border-t border-border px-6 py-4">
              {/* Section 41 : seuil livraison gratuite */}
              {threshold > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    {remaining > 0
                      ? translate(
                          {
                            fr: `Il vous manque ${formatPrice(remaining)} pour la livraison gratuite`,
                            en: `Add ${formatPrice(remaining)} more for free shipping`,
                            ar: `أضيفي ${formatPrice(remaining)} للحصول على توصيل مجاني`,
                          },
                          lang,
                        )
                      : translate(
                          { fr: '🎉 Livraison gratuite débloquée !', en: '🎉 Free shipping unlocked!', ar: '🎉 حصلتِ على التوصيل المجاني!' },
                          lang,
                        )}
                  </p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {translate({ fr: 'Sous-total', en: 'Subtotal', ar: 'المجموع الفرعي' }, lang)}
                </span>
                <span className="text-lg font-semibold price-ltr">{formatPrice(subtotal)}</span>
              </div>

              <div className="grid gap-2">
                <Button variant="dark" onClick={() => go('/checkout')}>
                  {translate({ fr: 'Commander', en: 'Checkout', ar: 'إتمام الطلب' }, lang)}
                </Button>
                <Button variant="outline" onClick={() => go('/cart')}>
                  {translate({ fr: 'Voir le panier', en: 'View cart', ar: 'عرض السلة' }, lang)}
                </Button>
                <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  {translate({ fr: 'Continuer mes achats', en: 'Continue shopping', ar: 'مواصلة التسوق' }, lang)}
                </button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}