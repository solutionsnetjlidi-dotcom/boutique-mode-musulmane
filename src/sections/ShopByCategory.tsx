import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import SectionHeading from '@/sections/SectionHeading'
import type { CategoryRow } from '@/types/database.types'

/** Section 14 : SHOP BY CATEGORY — cartes illustrées administrables. */
export default function ShopByCategory({ categories, title }: { categories: CategoryRow[]; title: string }) {
  const { lang } = useLanguage()
  if (categories.length === 0) return null

  return (
    <section className="container py-14">
      <SectionHeading
        eyebrow={translate({ fr: 'Explorez', en: 'Explore', ar: 'اكتشفي' }, lang)}
        title={title}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            to={`/category/${c.slug}`}
            className="group relative overflow-hidden rounded-2xl"
            aria-label={translate(c.name_translations, lang)}
          >
            <img
              src={c.image_url ?? undefined}
              alt={translate(c.name_translations, lang)}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
              <div>
                <p className="font-display text-lg text-white">{translate(c.name_translations, lang)}</p>
                <p className="text-[11px] uppercase tracking-wider text-white/75 transition group-hover:text-white">
                  {translate({ fr: 'Découvrir', en: 'Discover', ar: 'اكتشفي' }, lang)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-white opacity-0 transition group-hover:opacity-100 rtl:rotate-180" aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}