import { MessageCircle } from 'lucide-react'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'

const DEFAULT_ICEBREAKER = {
  fr: 'Bonjour ! 🌸 J\'ai craqué pour votre boutique ! 💕 J\'aimerais avoir des conseils pour choisir mes pièces préférées. Merci beaucoup ! 😊',
  en: 'Hello! 🌸 I just fell in love with your boutique! 💕 I\'d love some advice choosing my favorite pieces. Thank you so much! 😊',
  ar: 'مرحباً! 🌸 أعجبتني متجركم كثيراً! 💕 أود الحصول على نصائح لاختيار قطعي المفضلة. شكراً جزيلاً! 😊',
}

/** Bouton WhatsApp flottant avec message « casse-glace » automatique (section 64) */
export default function WhatsAppButton() {
  const settings = useSiteSettings()
  const { lang } = useLanguage()
  const number = settingString(settings, 'whatsapp_number')
  const enabled = settings?.whatsapp_enabled

  if (!number || !(enabled === true || enabled === 'true')) return null

  const icebreaker = (settings?.whatsapp_icebreaker ?? DEFAULT_ICEBREAKER) as {
    fr: string
    en: string
    ar: string
  }

  const href = `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    translate(icebreaker, lang),
  )}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={translate({ fr: 'Discuter sur WhatsApp', en: 'Chat on WhatsApp', ar: 'تحدثي عبر واتساب' }, lang)}
      title={translate({
        fr: 'Une question ? On vous répond avec plaisir 💬',
        en: 'Questions? We reply with pleasure 💬',
        ar: 'سؤال؟ نجيبك بكل سرور 💬',
      }, lang)}
      className="group fixed bottom-6 right-4 z-50 md:right-6"
    >
      {/* Bulle invitante au survol */}
      <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition group-hover:opacity-100">
        {translate({
          fr: 'Coucou ! Besoin d\'un conseil ? 💕',
          en: 'Hi there! Need some advice? 💕',
          ar: 'مرحباً! تحتاجين نصيحة؟ 💕',
        }, lang)}
      </span>
      <span className="mp-wa flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition group-hover:scale-110">
        <MessageCircle className="h-6 w-6" aria-hidden />
      </span>
      <style>{`
        @keyframes waPulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, .5); }
          70% { box-shadow: 0 0 0 16px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        .mp-wa { animation: waPulse 2s ease-out infinite; }
      `}</style>
    </a>
  )
}