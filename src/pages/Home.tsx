import { useEffect, useState } from 'react'
import { fetchHomeData } from '@/services/catalog'
import type { HomeData } from '@/services/catalog'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { useSeo, JsonLd } from '@/lib/seo'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { Skeleton } from '@/components/ui/skeleton'
import HeroSlider from '@/sections/HeroSlider'
import ShopByCategory from '@/sections/ShopByCategory'
import CollectionsGrid from '@/sections/CollectionsGrid'
import ProductSection from '@/sections/ProductSection'
import AdvantagesSection from '@/sections/AdvantagesSection'
import ReviewsSection from '@/sections/ReviewsSection'
import NewsletterSection from '@/sections/NewsletterSection'
import FaqSection from '@/sections/FaqSection'
import InstagramSection from '@/sections/InstagramSection'

/** Section 76 : la homepage est orchestrée par le CMS (ordre + activation). */
export default function Home() {
  const { lang } = useLanguage()
  const settings = useSiteSettings()
  const [data, setData] = useState<HomeData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchHomeData().then(setData).catch(() => setError(true))
  }, [])

  useSeo({
    title: translate(settings?.seo_default_title, lang, 'Mode Musulmane Féminine Premium'),
    description: translate(settings?.seo_default_description, lang),
    ogImage: settingString(settings, 'seo_og_image') || undefined,
  })

  if (error) {
    return (
      <div className="container py-24 text-center text-sm text-muted-foreground">
        Impossible de charger la boutique. Vérifiez la connexion Supabase puis rechargez.
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-[60vh] w-full rounded-none" />
        <div className="container grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const sectionTitle = (key: string, fallback: string) =>
    translate(data.sections.find((s) => s.section_key === key)?.title_translations, lang, fallback)
  const seeAll = translate({ fr: 'Tout voir', en: 'See all', ar: 'عرض الكل' }, lang)

  const renderers: Record<string, React.ReactNode> = {
    hero: <HeroSlider slides={data.hero} />,
    categories: <ShopByCategory categories={data.categories} title={sectionTitle('categories', 'Shop by Category')} />,
    collections: <CollectionsGrid collections={data.collections} title={sectionTitle('collections', 'Collections')} />,
    new_arrivals: <ProductSection eyebrow={translate({ fr: 'Just landed', en: 'Just landed', ar: 'وصل حديثاً' }, lang)} title={sectionTitle('new_arrivals', 'Nouveautés')} products={data.newArrivals} link="/shop" linkLabel={seeAll} />,
    best_sellers: <ProductSection eyebrow={translate({ fr: 'Les plus aimés', en: 'Most loved', ar: 'الأكثر حباً' }, lang)} title={sectionTitle('best_sellers', 'Nos Best Sellers')} products={data.bestSellers} link="/shop" linkLabel={seeAll} />,
    trending: <ProductSection eyebrow={translate({ fr: 'En ce moment', en: 'Right now', ar: 'الآن' }, lang)} title={sectionTitle('trending', 'Tendances du Moment')} products={data.trending} link="/shop" linkLabel={seeAll} />,
    promotions: <ProductSection eyebrow={translate({ fr: 'Offres limitées', en: 'Limited offers', ar: 'عروض محدودة' }, lang)} title={sectionTitle('promotions', 'Offres du Moment')} products={data.promotions} link="/shop" linkLabel={seeAll} />,
    advantages: <AdvantagesSection title={sectionTitle('advantages', 'Pourquoi Nous Choisir')} />,
    reviews: <ReviewsSection reviews={data.reviews} title={sectionTitle('reviews', 'Avis Clientes')} />,
    instagram: <InstagramSection socials={data.social} title={sectionTitle('instagram', 'Suivez-Nous')} />,
    newsletter: <NewsletterSection title={sectionTitle('newsletter', 'Recevez Nos Nouveautés')} />,
    faq: <FaqSection faqs={data.faqs} title={sectionTitle('faq', 'Questions Fréquentes')} />,
  }

  return (
    <>
      {data.sections.map((s) => (
        <div key={s.id}>{renderers[s.section_key] ?? null}</div>
      ))}
      {/* Section 79 : données structurées Organization */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: translate(settings?.brand_name, lang, 'Maison Noura'),
        description: translate(settings?.seo_default_description, lang),
        image: settingString(settings, 'seo_og_image'),
      }} />
    </>
  )
}