import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '@/components/shop/Breadcrumb'
import CatalogBrowser from '@/components/shop/CatalogBrowser'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchCollectionBySlug } from '@/services/shop'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { useSeo } from '@/lib/seo'
import type { CollectionRow } from '@/types/database.types'

/** Section 31 : page collection /collection/:slug. */
export default function CollectionPage() {
  const { slug = '' } = useParams()
  const { lang } = useLanguage()
  const [collection, setCollection] = useState<CollectionRow | null | undefined>(undefined)

  useEffect(() => {
    setCollection(undefined)
    fetchCollectionBySlug(slug).then(setCollection).catch(() => setCollection(null))
  }, [slug])

  const name = collection ? translate(collection.name_translations, lang) : ''

  useSeo({
    title: collection ? `${name} | Mode Musulmane Premium` : undefined,
    description: collection ? translate(collection.description_translations, lang) : undefined,
    ogImage: collection?.image_url ?? undefined,
  })

  if (collection === undefined) return <Skeleton className="mx-auto mt-10 h-64 w-[90%] rounded-2xl" />
  if (collection === null) {
    return (
      <p className="container py-24 text-center text-sm text-muted-foreground">
        {translate({ fr: 'Collection introuvable.', en: 'Collection not found.', ar: 'التشكيلة غير موجودة.' }, lang)}
      </p>
    )
  }

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate({ fr: 'Collections', en: 'Collections', ar: 'التشكيلات' }, lang), to: '/collections' },
        { label: name },
      ]} />

      <div className="container mt-4">
        <div className="relative overflow-hidden rounded-2xl">
          <img src={collection.image_url ?? undefined} alt={name} className="h-56 w-full object-cover md:h-72" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/75">
              {translate({ fr: 'Collection', en: 'Collection', ar: 'تشكيلة' }, lang)}
            </p>
            <h1 className="mt-1 font-display text-3xl text-white md:text-5xl">{name}</h1>
            <p className="mt-3 max-w-lg text-sm text-white/85">{translate(collection.description_translations, lang)}</p>
          </div>
        </div>
      </div>

      <CatalogBrowser lockedCollection={collection.slug} />
    </>
  )
}