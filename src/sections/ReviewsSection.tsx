import { Star } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import SectionHeading from '@/sections/SectionHeading'
import type { ReviewRow } from '@/types/database.types'

/**
 * Section 51 : avis clientes.
 * Les avis de démonstration sont clairement identifiés (badge "Démo").
 * Ne jamais présenter de faux avis comme réels.
 */
export default function ReviewsSection({ reviews, title }: { reviews: ReviewRow[]; title: string }) {
  const { lang } = useLanguage()
  if (reviews.length === 0) return null

  return (
    <section className="container py-14">
      <SectionHeading
        eyebrow={translate({ fr: 'Social proof', en: 'Social proof', ar: 'آراء عميلاتنا' }, lang)}
        title={title}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.slice(0, 6).map((r) => (
          <figure key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-1" aria-label={`Note : ${r.rating} sur 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={i < r.rating ? 'h-4 w-4 fill-[#C9A961] text-[#C9A961]' : 'h-4 w-4 text-border'}
                  aria-hidden
                />
              ))}
            </div>
            {r.title && <p className="font-display text-lg">{r.title}</p>}
            <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">{r.comment}</blockquote>
            <figcaption className="flex items-center justify-between text-xs">
              <span className="font-medium">{r.author_name}</span>
              <span className="flex items-center gap-1.5">
                {r.is_verified_purchase && (
                  <span className="text-emerald-600">
                    {translate({ fr: 'Achat vérifié', en: 'Verified purchase', ar: 'شراء موثق' }, lang)}
                  </span>
                )}
                {r.is_demo && (
                  <span
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                    title={translate({ fr: 'Donnée de démonstration', en: 'Demo data', ar: 'بيانات تجريبية' }, lang)}
                  >
                    Démo
                  </span>
                )}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        {translate({
          fr: 'Les avis affichés sont des données de démonstration clairement identifiées.',
          en: 'Displayed reviews are clearly identified demo data.',
          ar: 'الآراء المعروضة هي بيانات تجريبية محددة بوضوح.',
        }, lang)}
      </p>
    </section>
  )
}