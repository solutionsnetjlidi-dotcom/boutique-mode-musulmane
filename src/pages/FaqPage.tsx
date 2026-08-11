import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { useSeo } from '@/lib/seo'
import { JsonLd } from '@/lib/seo'
import Breadcrumb from '@/components/shop/Breadcrumb'
import FaqSection from '@/sections/FaqSection'
import type { FaqRow } from '@/types/database.types'

/** Section 96 : page FAQ (réutilise la section administrable). */
export default function FaqPage() {
  const { lang } = useLanguage()
  const [faqs, setFaqs] = useState<FaqRow[]>([])

  useEffect(() => {
    supabase.from('faqs').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setFaqs((data ?? []) as FaqRow[]))
  }, [])

  useSeo({
    title: translate({ fr: 'FAQ | Mode Musulmane Premium', en: 'FAQ | Premium Modest Fashion', ar: 'الأسئلة الشائعة | أزياء مسلمة فاخرة' }, lang),
  })

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: 'FAQ' },
      ]} />
      <FaqSection faqs={faqs} title={translate({ fr: 'Questions Fréquentes', en: 'FAQ', ar: 'الأسئلة الشائعة' }, lang)} />

      {/* Section 79 : FAQPage structured data */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: translate(f.question_translations, lang),
          acceptedAnswer: {
            '@type': 'Answer',
            text: translate(f.answer_translations, lang),
          },
        })),
      }} />
    </>
  )
}