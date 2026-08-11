import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import SectionHeading from '@/sections/SectionHeading'
import type { CollectionRow } from '@/types/database.types'

/** Section 15 : blocs éditoriaux collections (Premium, Ramadan, Eid, Prière, Cadeaux…). */
export default function CollectionsGrid({ collections, title }: { collections: CollectionRow[]; title: string }) {
  const { lang } = useLanguage()
  const items = collections.slice(0, 5)
  if (items.length === 0) return null
  const [first, ...rest] = items

  return (
    <section className="bg-muted/40 py-14">
      <div className="container">
        <SectionHeading
          eyebrow={translate({ fr: 'Éditorial', en: 'Editorial', ar: 'تحرير' }, lang)}
          title={title}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {/* Grande carte */}
          <Link to={`/collection/${first.slug}`} className="group relative overflow-hidden rounded-2xl md:row-span-2">
            <img
              src={first.image_url ?? undefined}
              alt={translate(first.name_translations, lang)}
              loading="lazy"
              className="h-full min-h-[320px] w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-0 p-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/75">
                {translate({ fr: 'Collection', en: 'Collection', ar: 'تشكيلة' }, lang)}
              </p>
              <p className="mt-1 font-display text-2xl text-white md:text-3xl">{translate(first.name_translations, lang)}</p>
              <p className="mt-1 max-w-sm text-sm text-white/80">{translate(first.description_translations, lang)}</p>
            </div>
          </Link>

          {rest.slice(0, 4).map((c) => (
            <Link key={c.id} to={`/collection/${c.slug}`} className="group relative overflow-hidden rounded-2xl">
              <img
                src={c.image_url ?? undefined}
                alt={translate(c.name_translations, lang)}
                loading="lazy"
                className="h-48 w-full object-cover transition duration-500 group-hover:scale-105 md:h-full md:min-h-[152px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 p-4">
                <p className="font-display text-xl text-white">{translate(c.name_translations, lang)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}