import { MessageCircle } from 'lucide-react'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'

/** Section 49 : bouton "Besoin d'aide ?" — numéro administrable depuis le dashboard. */
export default function WhatsAppButton() {
  const settings = useSiteSettings()
  const { lang } = useLanguage()
  const number = settingString(settings, 'whatsapp_number')
  const enabled = settings?.whatsapp_enabled

  if (!number || enabled === false || enabled === 'false') return null

  const href = `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    translate(
      { fr: 'Bonjour, j\'ai besoin d\'aide.', en: 'Hello, I need help.', ar: 'مرحباً، أحتاج إلى المساعدة.' },
      lang,
    ),
  )}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={translate({ fr: 'Besoin d\'aide ? Contactez-nous sur WhatsApp', en: 'Need help? Contact us on WhatsApp', ar: 'تحتاجين مساعدة؟ تواصلي معنا عبر واتساب' }, lang)}
      title={translate({ fr: 'Besoin d\'aide ?', en: 'Need help?', ar: 'تحتاجين مساعدة؟' }, lang)}
      className="fixed bottom-20 right-4 z-50 flex items-center justify-center rounded-full bg-emerald-500 p-3.5 text-white shadow-lg transition hover:scale-105 hover:bg-emerald-600 md:bottom-6 md:right-6"
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </a>
  )
}