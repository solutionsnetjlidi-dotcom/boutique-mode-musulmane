import { useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { CheckCircle2, MessageCircle, Package, Truck, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'

interface ConfirmationState {
  order_number: string; subtotal: number; discount: number
  shipping: number; total: number; zone: string; whatsapp_message: string
}

/** Section 49 : page de confirmation + message WhatsApp prérempli. */
export default function OrderConfirmation() {
  const location = useLocation()
  const { lang } = useLanguage()
  const settings = useSiteSettings()
  const whatsapp = settingString(settings, 'whatsapp_number')
  const state = location.state as ConfirmationState | null

  useEffect(() => {
    document.title = translate({
      fr: 'Commande confirmée — Mode Musulmane Premium',
      en: 'Order confirmed — Premium Modest Fashion',
      ar: 'تم تأكيد الطلب — أزياء مسلمة فاخرة',
    }, lang)
  }, [lang])

  if (!state) return <Navigate to="/" replace />

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(state.whatsapp_message)}`
    : null

  return (
    <div className="container flex max-w-xl flex-col items-center py-16 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-500" aria-hidden />
      <h1 className="mt-5 font-display text-3xl md:text-4xl">
        {translate({ fr: 'Commande confirmée !', en: 'Order confirmed!', ar: 'تم تأكيد الطلب!' }, lang)}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {translate({
          fr: 'Merci pour votre confiance. Votre commande est en attente de confirmation.',
          en: 'Thank you! Your order is pending confirmation.',
          ar: 'شكراً لثقتك. طلبك بانتظار التأكيد.',
        }, lang)}
      </p>

      <p className="mt-6 rounded-full bg-primary/10 px-6 py-2 font-mono text-lg font-semibold tracking-wider text-primary">
        {state.order_number}
      </p>

      <dl className="mt-8 w-full space-y-2 rounded-2xl border border-border bg-card p-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{translate({ fr: 'Sous-total', en: 'Subtotal', ar: 'المجموع الفرعي' }, lang)}</dt>
          <dd className="price-ltr">{formatPrice(state.subtotal)}</dd>
        </div>
        {state.discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <dt>{translate({ fr: 'Remise', en: 'Discount', ar: 'الخصم' }, lang)}</dt>
            <dd className="price-ltr">-{formatPrice(state.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{translate({ fr: 'Livraison', en: 'Shipping', ar: 'التوصيل' }, lang)} ({state.zone})</dt>
          <dd className="price-ltr">
            {state.shipping === 0 ? translate({ fr: 'Gratuite', en: 'Free', ar: 'مجاني' }, lang) : formatPrice(state.shipping)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
          <dt>{translate({ fr: 'Total', en: 'Total', ar: 'المجموع' }, lang)}</dt>
          <dd className="price-ltr">{formatPrice(state.total)}</dd>
        </div>
      </dl>

      <ol className="mt-8 grid w-full grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
        <li className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4">
          <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
          {translate({ fr: '1. Confirmez sur WhatsApp', en: '1. Confirm on WhatsApp', ar: '1. أكدي عبر واتساب' }, lang)}
        </li>
        <li className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4">
          <Package className="h-5 w-5 text-primary" aria-hidden />
          {translate({ fr: '2. Préparation de votre commande', en: '2. We prepare your order', ar: '2. نحضر طلبك' }, lang)}
        </li>
        <li className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4">
          <Truck className="h-5 w-5 text-primary" aria-hidden />
          {translate({ fr: '3. Livraison + paiement à la réception', en: '3. Delivery + pay on receipt', ar: '3. التوصيل والدفع عند الاستلام' }, lang)}
        </li>
      </ol>

      <div className="mt-8 flex w-full flex-col gap-3">
        {waHref && (
          <Button size="lg" asChild>
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden />
              {translate({ fr: 'Confirmer ma commande sur WhatsApp', en: 'Confirm my order on WhatsApp', ar: 'تأكيد الطلب عبر واتساب' }, lang)}
            </a>
          </Button>
        )}
        <Button size="lg" variant="outline" asChild>
          <Link to="/shop">{translate({ fr: 'Continuer mes achats', en: 'Continue shopping', ar: 'مواصلة التسوق' }, lang)}</Link>
        </Button>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" aria-hidden />
        {translate({
          fr: 'Paiement à la livraison — aucune somme n\'est débitée en ligne.',
          en: 'Cash on delivery — nothing is charged online.',
          ar: 'الدفع عند الاستلام — لا يتم خصم أي مبلغ عبر الإنترنت.',
        }, lang)}
      </p>
    </div>
  )
}