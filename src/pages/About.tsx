import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import Breadcrumb from '@/components/shop/Breadcrumb'

/** Section 95 : page À propos éditoriale, contenu administrable. */
export default function AboutPage() {
  const { lang } = useLanguage()
  const settings = useSiteSettings()

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate({ fr: 'À propos', en: 'About', ar: 'من نحن' }, lang) },
      ]} />
      <div className="container max-w-3xl py-12">
        <h1 className="mb-2 font-display text-3xl md:text-4xl">
          {translate({ fr: 'Notre Maison', en: 'Our House', ar: 'دارنا' }, lang)}
        </h1>
        <p className="mb-8 text-sm uppercase tracking-[0.2em] text-primary">
          {translate({ fr: 'Élégance · Pudeur · Raffinement', en: 'Elegance · Modesty · Refinement', ar: 'أناقة · حشمة · رقيّ' }, lang)}
        </p>
        <p className="whitespace-pre-line text-sm leading-loose text-muted-foreground md:text-base">
          {translate(settings?.about_content, lang)}
        </p>
      </div>
    </>
  )
}