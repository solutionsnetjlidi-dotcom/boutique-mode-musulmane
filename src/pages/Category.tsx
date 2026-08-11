import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '@/components/shop/Breadcrumb'
import CatalogBrowser from '@/components/shop/CatalogBrowser'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchCategoryBySlug } from '@/services/shop'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { useSeo } from '@/lib/seo'
import type { CategoryRow } from '@/types/database.types'

/** Section 30 : page catégorie /category/:slug. */
export default function Category() {
  const { slug = '' } = useParams()
  const { lang } = useLanguage()
  const [category, setCategory] = useState<CategoryRow | null | undefined>(undefined)

  useEffect(() => {
    setCategory(undefined)
    fetchCategoryBySlug(slug).then(setCategory).catch(() => setCategory(null))
  }, [slug])

  const name = category ? translate(category.name_translations, lang) : ''

  useSeo({
    title: category ? `${name} | Mode Musulmane Premium` : undefined,
    description: category ? translate(category.description_translations, lang) : undefined,
    ogImage: category?.image_url ?? undefined,
  })

  if (category === undefined) {
    return <Skeleton className="mx-auto mt-10 h-64 w-[90%] rounded-2xl" />
  }

  if (category === null) {
    return (
      <p className="container py-24 text-center text-sm text-muted-foreground">
        {translate({ fr: 'Catégorie introuvable.', en: 'Category not found.', ar: 'الفئة غير موجودة.' }, lang)}
      </p>
    )
  }

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate({ fr: 'Boutique', en: 'Shop', ar: 'المتجر' }, lang), to: '/shop' },
        { label: name },
      ]} />

      {(category.banner_url || category.image_url) && (
        <div className="container mt-4">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={(category.banner_url ?? category.image_url) ?? undefined} alt={name} className="h-48 w-full object-cover md:h-64" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8">
              <h1 className="font-display text-3xl text-white md:text-4xl">{name}</h1>
              <p className="mt-2 max-w-lg text-sm text-white/85">{translate(category.description_translations, lang)}</p>
            </div>
          </div>
        </div>
      )}

      {!(category.banner_url || category.image_url) && (
        <div className="container pt-4">
          <h1 className="font-display text-3xl md:text-4xl">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{translate(category.description_translations, lang)}</p>
        </div>
      )}

      <CatalogBrowser lockedCategory={category.slug} />
    </>
  )
}