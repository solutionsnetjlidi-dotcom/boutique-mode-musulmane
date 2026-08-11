import { Link } from 'react-router-dom'
import { useCatalogData } from '@/hooks/useCatalog'
import Breadcrumb from '@/components/shop/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'

/** Section 15 : index de toutes les collections. */
export default function CollectionsIndex() {
  const { data, loading } = useCatalogData()
  const { lang } = useLanguage()

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate({ fr: 'Collections', en: 'Collections', ar: 'التشكيلات' }, lang) },
      ]} />
      <div className="container py-8">
        <h1 className="mb-8 font-display text-3xl md:text-4xl">
          {translate({ fr: 'Nos Collections', en: 'Our Collections', ar: 'تشكيلاتنا' }, lang)}
        </h1>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(data?.collections ?? []).map((c) => (
              <Link key={c.id} to={`/collection/${c.slug}`} className="group relative overflow-hidden rounded-2xl">
                <img
                  src={c.image_url ?? undefined}
                  alt={translate(c.name_translations, lang)}
                  loading="lazy"
                  className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <p className="font-display text-2xl text-white">{translate(c.name_translations, lang)}</p>
                  <p className="mt-1 text-sm text-white/80">{translate(c.description_translations, lang)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}