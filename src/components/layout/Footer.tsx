import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Facebook, Instagram, Mail, MessageCircle, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import type { CategoryRow, SocialLinkRow } from '@/types/database.types'

const INFO_LINKS = [
  { label: { fr: 'À propos', en: 'About', ar: 'من نحن' }, to: '/about' },
  { label: { fr: 'Contact', en: 'Contact', ar: 'اتصلي بنا' }, to: '/contact' },
  { label: { fr: 'FAQ', en: 'FAQ', ar: 'الأسئلة الشائعة' }, to: '/faq' },
  { label: { fr: 'Livraison', en: 'Shipping', ar: 'التوصيل' }, to: '/shipping' },
  { label: { fr: 'Retours', en: 'Returns', ar: 'الإرجاع' }, to: '/returns' },
  { label: { fr: 'CGV', en: 'Terms', ar: 'الشروط' }, to: '/terms' },
  { label: { fr: 'Confidentialité', en: 'Privacy', ar: 'الخصوصية' }, to: '/privacy' },
]

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
}

/** Section 58 : footer riche 4 colonnes + section 104 : crédits obligatoires. */
export default function Footer() {
  const { lang } = useLanguage()
  const settings = useSiteSettings()
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [socials, setSocials] = useState<SocialLinkRow[]>([])

  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(6)
      .then(({ data }) => setCategories((data ?? []) as CategoryRow[]))
    supabase.from('social_links').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setSocials((data ?? []) as SocialLinkRow[]))
  }, [])

  const brand = translate(settings?.brand_name, lang, 'Maison Noura')
  const whatsapp = settingString(settings, 'whatsapp_number')
  const email = settingString(settings, 'contact_email')
  const phone = settingString(settings, 'contact_phone')
  const hours = translate(settings?.opening_hours, lang)

  return (
    <footer className="border-t border-border bg-card pb-20 md:pb-0">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Marque */}
        <div>
          <p className="font-display text-2xl tracking-[0.15em]">{brand.toUpperCase()}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {translate(
              {
                fr: 'Mode musulmane féminine premium — élégance, pudeur et raffinement au quotidien.',
                en: 'Premium modest Muslim womenswear — elegance, modesty and refinement, every day.',
                ar: 'أزياء مسلمة فاخرة — أناقة وحشمة ورقيّ كل يوم.',
              },
              lang,
            )}
          </p>
          <div className="mt-5 flex gap-3">
            {socials.filter((s) => s.platform !== 'whatsapp').map((s) => {
              const Icon = SOCIAL_ICONS[s.platform]
              if (!Icon) return null
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border p-2.5 transition hover:border-primary hover:text-primary"
                  aria-label={s.platform}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              )
            })}
          </div>
        </div>

        {/* Boutique */}
        <nav aria-label={translate({ fr: 'Footer boutique', en: 'Footer shop', ar: 'المتجر' }, lang)}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">
            {translate({ fr: 'Boutique', en: 'Shop', ar: 'المتجر' }, lang)}
          </p>
          <ul className="space-y-2.5">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.slug}`} className="text-sm text-muted-foreground transition hover:text-primary">
                  {translate(c.name_translations, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Informations */}
        <nav aria-label={translate({ fr: 'Footer informations', en: 'Footer information', ar: 'معلومات' }, lang)}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">
            {translate({ fr: 'Informations', en: 'Information', ar: 'معلومات' }, lang)}
          </p>
          <ul className="space-y-2.5">
            {INFO_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-muted-foreground transition hover:text-primary">
                  {translate(label, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Aide */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">
            {translate({ fr: 'Aide', en: 'Help', ar: 'مساعدة' }, lang)}
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp : {whatsapp}
                </a>
              </li>
            )}
            {email && <li className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden /> {email}</li>}
            {phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4" aria-hidden /> {phone}</li>}
            {hours && <li className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden /> {hours}</li>}
          </ul>
        </div>
      </div>

      {/* Section 104 : copyright + crédits obligatoires */}
      <div className="border-t border-border py-6">
        <div className="container flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
          <p>Copyright © {new Date().getFullYear()} {brand}. Tous droits réservés.</p>
          <p className="font-medium tracking-wide">Created by JLIDI NETWORK SOLUTIONS - OMARSOFT</p>
        </div>
      </div>
    </footer>
  )
}