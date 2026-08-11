import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Banknote, Check, ChevronLeft, CreditCard, MapPin, PenLine, Truck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/common/Toaster'
import { cn } from '@/lib/utils'
import type { ServiceZoneRow } from '@/types/database.types'

/** Section 83 : validation Zod (téléphone, email, adresse). */
const infoSchema = z.object({
  first_name: z.string().min(2, 'Prénom : 2 caractères minimum'),
  last_name: z.string().min(2, 'Nom : 2 caractères minimum'),
  phone: z.string().min(8, 'Numéro invalide').regex(/^[0-9+\s()-]{8,}$/, 'Numéro invalide'),
  whatsapp: z.string().regex(/^$|^[0-9+\s()-]{8,}$/, 'Numéro WhatsApp invalide'),
  email: z.union([z.literal(''), z.string().email('Email invalide')]),
  country: z.string().min(2, 'Pays obligatoire'),
  city: z.string().min(2, 'Ville obligatoire'),
  address: z.string().min(5, 'Adresse trop courte'),
  address_complement: z.string(),
  comment: z.string().max(500, '500 caractères maximum'),
})
type InfoForm = z.infer<typeof infoSchema>

interface OrderResult {
  order_id: string; order_number: string; subtotal: number; discount: number
  shipping: number; total: number; zone: string; whatsapp_message: string
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Section 43 : checkout réel en 3 étapes. Section 44 : prix recalculés par la RPC serveur. */
export default function Checkout() {
  const { items, subtotal, clearCart, count } = useCart()
  const { profile } = useAuth()
  const { lang } = useLanguage()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [zones, setZones] = useState<ServiceZoneRow[]>([])
  const [zoneId, setZoneId] = useState<string | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; discount: number; label: string } | null>(null)
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, getValues, setValue, formState: { errors } } = useForm<InfoForm>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      first_name: profile?.first_name ?? '', last_name: profile?.last_name ?? '',
      phone: profile?.phone ?? '', whatsapp: profile?.whatsapp ?? '', email: profile?.email ?? '',
      country: 'Tunisie', city: profile?.city ?? '', address: profile?.address ?? '',
      address_complement: profile?.address_complement ?? '', comment: '',
    },
  })

  useEffect(() => {
    if (profile) {
      setValue('first_name', profile.first_name ?? ''); setValue('last_name', profile.last_name ?? '')
      setValue('phone', profile.phone ?? ''); setValue('whatsapp', profile.whatsapp ?? '')
      setValue('city', profile.city ?? ''); setValue('address', profile.address ?? '')
      setValue('address_complement', profile.address_complement ?? '')
    }
  }, [profile, setValue])

  useEffect(() => {
    supabase.from('service_zones').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => {
        setZones((data ?? []) as ServiceZoneRow[])
        setZoneId((z) => z ?? (data?.[0] as ServiceZoneRow | undefined)?.id ?? null)
      })
  }, [])

  useEffect(() => {
    if (count === 0) navigate('/cart', { replace: true })
  }, [count, navigate])

  const selectedZone = zones.find((z) => z.id === zoneId) ?? null
  const discount = coupon?.discount ?? 0
  const freeShipping = selectedZone?.free_shipping_threshold != null
    && (subtotal - discount) >= selectedZone.free_shipping_threshold
  const shipping = !selectedZone ? 0 : freeShipping ? 0 : selectedZone.shipping_fee
  const total = Math.max(subtotal - discount, 0) + shipping

  const autoSelectZone = () => {
    const city = normalize(getValues('city'))
    if (!city) return
    const match = zones.find((z) => (z.cities ?? []).some((c) => normalize(c).includes(city) || city.includes(normalize(c))))
    if (match) setZoneId(match.id)
  }

  /* Section 92 : validation coupon côté serveur */
  const applyCoupon = async () => {
    setCouponFeedback(null)
    if (!couponInput.trim()) return
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: couponInput.trim(), p_subtotal: subtotal,
    })
    if (error) { setCouponFeedback('Vérification impossible.'); return }
    const res = data as { valid: boolean; discount?: number; label?: string; message?: string }
    if (res.valid && res.discount != null) {
      setCoupon({ code: couponInput.trim().toUpperCase(), discount: res.discount, label: res.label ?? '' })
      setCouponFeedback(null)
    } else {
      setCoupon(null)
      setCouponFeedback(res.message ?? 'Coupon invalide.')
    }
  }

  /* Section 44 : seuls IDs + quantités envoyés — le serveur recalcule tout */
  const confirmOrder = async () => {
    if (!selectedZone) return
    setSubmitting(true)
    setServerError(null)

    const info = getValues()
    const { data, error } = await supabase.rpc('create_order', {
      p_customer: {
        first_name: info.first_name, last_name: info.last_name,
        phone: info.phone, whatsapp: info.whatsapp || info.phone, email: info.email,
        country: info.country, city: info.city,
        address: info.address, address_complement: info.address_complement,
      },
      p_items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
      p_shipping_zone_id: selectedZone.id,
      p_coupon_code: coupon?.code ?? null,
      p_comment: info.comment || null,
    })

    if (error) {
      setServerError(error.message)
      setSubmitting(false)
      return
    }

    const result = data as OrderResult
    clearCart()
    navigate('/confirmation', { state: result, replace: true })
  }

  const steps = [
    { n: 1, label: translate({ fr: 'Informations', en: 'Information', ar: 'المعلومات' }, lang) },
    { n: 2, label: translate({ fr: 'Livraison', en: 'Shipping', ar: 'التوصيل' }, lang) },
    { n: 3, label: translate({ fr: 'Récapitulatif', en: 'Review', ar: 'الملخص' }, lang) },
  ]

  if (count === 0) return null

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="mb-8 text-center font-display text-3xl md:text-4xl">
        {translate({ fr: 'Finaliser ma commande', en: 'Checkout', ar: 'إتمام الطلب' }, lang)}
      </h1>

      {/* Stepper */}
      <ol className="mb-10 flex items-center justify-center gap-2" aria-label={translate({ fr: 'Étapes de commande', en: 'Checkout steps', ar: 'خطوات الطلب' }, lang)}>
        {steps.map((s, i) => (
          <li key={s.n} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-6 bg-border md:w-12" aria-hidden />}
            <button
              onClick={() => s.n < step && setStep(s.n as 1 | 2)}
              disabled={s.n > step}
              className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition md:px-4 md:text-sm',
                s.n === step ? 'bg-primary text-primary-foreground'
                : s.n < step ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground')}
              aria-current={s.n === step ? 'step' : undefined}
            >
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                s.n === step ? 'bg-primary-foreground/20' : 'bg-card')}>
                {s.n < step ? <Check className="h-3 w-3" aria-hidden /> : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* ÉTAPE 1 — INFORMATIONS */}
      {step === 1 && (
        <form
          onSubmit={handleSubmit(() => { autoSelectZone(); setStep(2) })}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">{translate({ fr: 'Prénom *', en: 'First name *', ar: 'الاسم الأول *' }, lang)}</Label>
              <Input id="first_name" autoComplete="given-name" {...register('first_name')} aria-invalid={!!errors.first_name} />
              {errors.first_name && <p role="alert" className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="last_name">{translate({ fr: 'Nom *', en: 'Last name *', ar: 'اللقب *' }, lang)}</Label>
              <Input id="last_name" autoComplete="family-name" {...register('last_name')} aria-invalid={!!errors.last_name} />
              {errors.last_name && <p role="alert" className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">{translate({ fr: 'Téléphone *', en: 'Phone *', ar: 'الهاتف *' }, lang)}</Label>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="20 000 000" {...register('phone')} aria-invalid={!!errors.phone} />
              {errors.phone && <p role="alert" className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="whatsapp">{translate({ fr: 'WhatsApp', en: 'WhatsApp', ar: 'واتساب' }, lang)}</Label>
              <Input id="whatsapp" type="tel" placeholder={translate({ fr: 'Identique au téléphone si vide', en: 'Same as phone if empty', ar: 'مثل الهاتف إن تُرك فارغاً' }, lang)} {...register('whatsapp')} aria-invalid={!!errors.whatsapp} />
              {errors.whatsapp && <p role="alert" className="mt-1 text-xs text-red-500">{errors.whatsapp.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">{translate({ fr: 'Email (facultatif)', en: 'Email (optional)', ar: 'البريد الإلكتروني (اختياري)' }, lang)}</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} />
              {errors.email && <p role="alert" className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="country">{translate({ fr: 'Pays *', en: 'Country *', ar: 'البلد *' }, lang)}</Label>
              <Input id="country" autoComplete="country-name" {...register('country')} aria-invalid={!!errors.country} />
              {errors.country && <p role="alert" className="mt-1 text-xs text-red-500">{errors.country.message}</p>}
            </div>
            <div>
              <Label htmlFor="city">{translate({ fr: 'Ville *', en: 'City *', ar: 'المدينة *' }, lang)}</Label>
              <Input id="city" autoComplete="address-level2" placeholder="Tunis, Sousse, Sfax…" {...register('city')} aria-invalid={!!errors.city} />
              {errors.city && <p role="alert" className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">{translate({ fr: 'Adresse *', en: 'Address *', ar: 'العنوان *' }, lang)}</Label>
              <Input id="address" autoComplete="street-address" {...register('address')} aria-invalid={!!errors.address} />
              {errors.address && <p role="alert" className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address_complement">{translate({ fr: 'Complément d\'adresse', en: 'Address line 2', ar: 'معلومات إضافية للعنوان' }, lang)}</Label>
              <Input id="address_complement" {...register('address_complement')} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="comment">{translate({ fr: 'Commentaire (facultatif)', en: 'Comment (optional)', ar: 'تعليق (اختياري)' }, lang)}</Label>
              <Textarea id="comment" rows={2} {...register('comment')} />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full">
            {translate({ fr: 'Continuer vers la livraison', en: 'Continue to shipping', ar: 'المتابعة إلى التوصيل' }, lang)}
          </Button>
        </form>
      )}

      {/* ÉTAPE 2 — LIVRAISON (section 48) */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="flex items-center gap-2 font-display text-xl">
              <Truck className="h-5 w-5 text-primary" aria-hidden />
              {translate({ fr: 'Zone de livraison', en: 'Delivery zone', ar: 'منطقة التوصيل' }, lang)}
            </p>
            <div className="space-y-2" role="radiogroup" aria-label={translate({ fr: 'Zone de livraison', en: 'Delivery zone', ar: 'منطقة التوصيل' }, lang)}>
              {zones.map((z) => {
                const free = z.free_shipping_threshold != null && (subtotal - discount) >= z.free_shipping_threshold
                const active = zoneId === z.id
                return (
                  <button
                    key={z.id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setZoneId(z.id)}
                    className={cn('flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition',
                      active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
                  >
                    <span>
                      <span className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-primary" aria-hidden />
                        {translate(z.name_translations, lang)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {translate(z.estimated_delay_translations, lang)} · {(z.cities ?? []).slice(0, 4).join(', ')}{(z.cities ?? []).length > 4 ? '…' : ''}
                      </span>
                    </span>
                    <span className="text-sm font-semibold price-ltr">
                      {free
                        ? <span className="text-emerald-600">{translate({ fr: 'Gratuite', en: 'Free', ar: 'مجاني' }, lang)}</span>
                        : formatPrice(z.shipping_fee)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paiement V1 : COD uniquement (section 50) */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="font-display text-xl">
              {translate({ fr: 'Moyen de paiement', en: 'Payment method', ar: 'طريقة الدفع' }, lang)}
            </p>
            <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary/5 p-4">
              <span className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-primary" aria-hidden />
                <span>
                  <span className="block font-medium">{translate({ fr: 'Paiement à la livraison', en: 'Cash on delivery', ar: 'الدفع عند الاستلام' }, lang)}</span>
                  <span className="text-xs text-muted-foreground">
                    {translate({ fr: 'Confirmation de la commande via WhatsApp avant expédition.', en: 'Order confirmed via WhatsApp before shipping.', ar: 'تأكيد الطلب عبر واتساب قبل الشحن.' }, lang)}
                  </span>
                </span>
              </span>
              <Check className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4 opacity-50">
              <span className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" aria-hidden />
                <span className="font-medium">{translate({ fr: 'Carte bancaire / Stripe', en: 'Card / Stripe', ar: 'بطاقة بنكية' }, lang)}</span>
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-[10px] uppercase tracking-wide">
                {translate({ fr: 'Bientôt disponible', en: 'Coming soon', ar: 'قريباً' }, lang)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
              {translate({ fr: 'Retour', en: 'Back', ar: 'رجوع' }, lang)}
            </Button>
            <Button size="lg" className="flex-1" disabled={!zoneId} onClick={() => setStep(3)}>
              {translate({ fr: 'Voir le récapitulatif', en: 'Review order', ar: 'عرض الملخص' }, lang)}
            </Button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — RÉCAPITULATIF */}
      {step === 3 && selectedZone && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="mb-4 font-display text-xl">{translate({ fr: 'Vos articles', en: 'Your items', ar: 'منتجاتك' }, lang)}</p>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <img src={item.image ?? undefined} alt="" className="h-16 rounded-lg bg-muted object-cover" style={{ width: '3.25rem' }} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{translate(item.name_translations, lang)}</p>
                    <p className="text-xs text-muted-foreground">
                      {Object.entries(item.attributes).filter(([k]) => k !== 'hex').map(([k, v]) => v).join(' · ')} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold price-ltr">{formatPrice(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{translate({ fr: 'Cliente', en: 'Customer', ar: 'العميلة' }, lang)}</p>
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-primary"
                  aria-label={translate({ fr: 'Modifier les informations', en: 'Edit information', ar: 'تعديل المعلومات' }, lang)}>
                  <PenLine className="h-3 w-3" aria-hidden /> {translate({ fr: 'Modifier', en: 'Edit', ar: 'تعديل' }, lang)}
                </button>
              </div>
              <p className="text-sm">{getValues('first_name')} {getValues('last_name')}</p>
              <p className="text-sm text-muted-foreground">{getValues('phone')}</p>
              {getValues('email') && <p className="text-sm text-muted-foreground">{getValues('email')}</p>}
              <p className="mt-1 text-sm text-muted-foreground">
                {getValues('address')}{getValues('address_complement') ? `, ${getValues('address_complement')}` : ''}, {getValues('city')}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{translate({ fr: 'Livraison', en: 'Shipping', ar: 'التوصيل' }, lang)}</p>
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-primary"
                  aria-label={translate({ fr: 'Modifier la livraison', en: 'Edit shipping', ar: 'تعديل التوصيل' }, lang)}>
                  <PenLine className="h-3 w-3" aria-hidden /> {translate({ fr: 'Modifier', en: 'Edit', ar: 'تعديل' }, lang)}
                </button>
              </div>
              <p className="text-sm">{translate(selectedZone.name_translations, lang)}</p>
              <p className="text-sm text-muted-foreground">{translate(selectedZone.estimated_delay_translations, lang)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {translate({ fr: 'Paiement', en: 'Payment', ar: 'الدفع' }, lang)} : {translate({ fr: 'à la livraison', en: 'cash on delivery', ar: 'عند الاستلام' }, lang)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <Label htmlFor="coupon">{translate({ fr: 'Code promo', en: 'Promo code', ar: 'رمز الخصم' }, lang)}</Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="BIENVENUE10"
                className="uppercase"
                disabled={!!coupon}
              />
              {coupon ? (
                <Button variant="outline" onClick={() => { setCoupon(null); setCouponInput('') }}>
                  {translate({ fr: 'Retirer', en: 'Remove', ar: 'إزالة' }, lang)}
                </Button>
              ) : (
                <Button variant="outline" onClick={applyCoupon}>
                  {translate({ fr: 'Appliquer', en: 'Apply', ar: 'تطبيق' }, lang)}
                </Button>
              )}
            </div>
            {couponFeedback && <p role="alert" className="mt-2 text-xs text-red-500">{couponFeedback}</p>}
            {coupon && (
              <p className="mt-2 text-xs text-emerald-600">
                ✓ {coupon.code} ({coupon.label}) {translate({ fr: 'appliqué', en: 'applied', ar: 'مطبق' }, lang)}
              </p>
            )}

            <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{translate({ fr: 'Sous-total', en: 'Subtotal', ar: 'المجموع الفرعي' }, lang)}</dt>
                <dd className="price-ltr">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>{translate({ fr: 'Remise coupon', en: 'Coupon discount', ar: 'خصم القسيمة' }, lang)}</dt>
                  <dd className="price-ltr">-{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{translate({ fr: 'Livraison', en: 'Shipping', ar: 'التوصيل' }, lang)}</dt>
                <dd className="price-ltr">
                  {shipping === 0
                    ? <span className="text-emerald-600">{translate({ fr: 'Gratuite', en: 'Free', ar: 'مجاني' }, lang)}</span>
                    : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>{translate({ fr: 'Total', en: 'Total', ar: 'المجموع' }, lang)}</dt>
                <dd className="price-ltr">{formatPrice(total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {translate({
                fr: 'Prix, stock et remises vérifiés une dernière fois par le serveur au moment de la confirmation.',
                en: 'Prices, stock and discounts are re-verified server-side at confirmation.',
                ar: 'يتم التحقق من الأسعار والمخزون والخصومات مجدداً على الخادم عند التأكيد.',
              }, lang)}
            </p>
          </div>

          {serverError && (
            <div role="alert" className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">{serverError}</div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep(2)} disabled={submitting}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
              {translate({ fr: 'Retour', en: 'Back', ar: 'رجوع' }, lang)}
            </Button>
            <Button size="lg" variant="dark" className="flex-1" onClick={confirmOrder} disabled={submitting}>
              {submitting
                ? translate({ fr: 'Traitement…', en: 'Processing…', ar: 'جارٍ المعالجة…' }, lang)
                : translate({ fr: 'CONFIRMER LA COMMANDE', en: 'CONFIRM ORDER', ar: 'تأكيد الطلب' }, lang)}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}