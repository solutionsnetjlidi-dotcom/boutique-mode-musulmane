import Breadcrumb from '@/components/shop/Breadcrumb'
import CatalogBrowser from '@/components/shop/CatalogBrowser'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { useSeo } from '@/lib/seo'

/** Section 26 : page catalogue /shop. */
export default function Shop() {
  const { lang } = useLanguage()

  useSeo({
    title: translate({ fr: 'Boutique | Mode Musulmane Premium', en: 'Shop | Premium Modest Fashion', ar: 'المتجر | أزياء مسلمة فاخرة' }, lang),
    description: translate({
      fr: 'Découvrez notre sélection complète de mode modeste premium : hijabs, jilbabs, abayas, khimars.',
      en: 'Discover our full premium modest fashion selection.',
      ar: 'اكتشفي تشكيلتنا الكاملة من الموضة المحتشمة الفاخرة.',
    }, lang),
  })

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate({ fr: 'Boutique', en: 'Shop', ar: 'المتجر' }, lang) },
      ]} />
      <div className="container pt-4">
        <h1 className="font-display text-3xl md:text-4xl">
          {translate({ fr: 'Boutique', en: 'Shop', ar: 'المتجر' }, lang)}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {translate({
            fr: 'Toute notre sélection de mode modeste premium : hijabs, jilbabs, abayas, khimars, accessoires et prière.',
            en: 'Our full premium modest fashion selection: hijabs, jilbabs, abayas, khimars, accessories and prayer.',
            ar: 'كل تشكيلتنا من الموضة المحتشمة الفاخرة: حجابات وجلابيبت وعبايات وخمرات وإكسسوارات ومستلزمات الصلاة.',
          }, lang)}
        </p>
      </div>
      <CatalogBrowser />
    </>
  )
}