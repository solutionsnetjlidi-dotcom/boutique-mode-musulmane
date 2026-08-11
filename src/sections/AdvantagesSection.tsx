import { Gem, MessageCircle, Moon, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import type { Json } from '@/types/database.types'

/** Section 54 : 4 à 6 avantages administrables. */
const ADVANTAGES: { icon: typeof Gem; title: Json; text: Json }[] = [
  {
    icon: Gem,
    title: { fr: 'Qualité sélectionnée', en: 'Curated quality', ar: 'جودة مختارة' },
    text: { fr: 'Des pièces choisies avec soin.', en: 'Pieces carefully selected.', ar: 'قطع مختارة بعناية.' },
  },
  {
    icon: Moon,
    title: { fr: 'Mode modeste', en: 'Modest fashion', ar: 'موضة محتشمة' },
    text: { fr: 'Élégance et pudeur au quotidien.', en: 'Elegance and modesty, every day.', ar: 'أناقة وحشمة كل يوم.' },
  },
  {
    icon: Truck,
    title: { fr: 'Livraison rapide', en: 'Fast delivery', ar: 'توصيل سريع' },
    text: { fr: 'Expédition sous 24 à 48h.', en: 'Shipped within 24-48h.', ar: 'الشحن خلال 24 إلى 48 ساعة.' },
  },
  {
    icon: ShieldCheck,
    title: { fr: 'Commande protégée', en: 'Protected order', ar: 'طلب محمي' },
    text: { fr: 'Paiement à la livraison sécurisé.', en: 'Secure cash on delivery.', ar: 'دفع آمن عند الاستلام.' },
  },
  {
    icon: RotateCcw,
    title: { fr: 'Retours simples', en: 'Easy returns', ar: 'إرجاع سهل' },
    text: { fr: 'Politique claire sous 7 jours.', en: 'Clear 7-day policy.', ar: 'سياسة واضحة خلال 7 أيام.' },
  },
  {
    icon: MessageCircle,
    title: { fr: 'Service client', en: 'Customer care', ar: 'خدمة العملاء' },
    text: { fr: 'Assistance via WhatsApp.', en: 'Support via WhatsApp.', ar: 'مساعدة عبر واتساب.' },
  },
]

export default function AdvantagesSection({ title }: { title: string }) {
  const { lang } = useLanguage()
  return (
    <section className="border-y border-border bg-card py-14">
      <div className="container">
        <h2 className="mb-10 text-center font-display text-3xl">{title}</h2>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {ADVANTAGES.map(({ icon: Icon, title: t, text }) => (
            <div key={translate(t, lang)} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <p className="text-sm font-semibold">{translate(t, lang)}</p>
              <p className="text-xs text-muted-foreground">{translate(text, lang)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}