import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import Breadcrumb from '@/components/shop/Breadcrumb'

/** Section 96 : page légale réutilisable, contenu administrable et multilingue. */
export default function LegalPage({ settingKey, titleKey }: {
  settingKey: string
  titleKey: { fr: string; en: string; ar: string }
}) {
  const { lang } = useLanguage()
  const settings = useSiteSettings()

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate(titleKey, lang) },
      ]} />
      <div className="container max-w-3xl py-12">
        <h1 className="mb-6 font-display text-3xl md:text-4xl">{translate(titleKey, lang)}</h1>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {translate(settings?.[settingKey], lang)}
        </p>
      </div>
    </>
  )
}