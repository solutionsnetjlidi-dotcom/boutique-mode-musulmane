import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { cn } from '@/lib/utils'

interface HeroSlide {
  id: string
  title_translations: any
  subtitle_translations: any
  image_desktop: string | null
  image_mobile: string | null
  cta_label_translations: any
  cta_url: string | null
  cta_secondary_label_translations: any
  cta_secondary_url: string | null
  is_active: boolean
}

/** Hero slider + ballons-logo qui dansent des deux côtés (section 12) */
export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const { lang } = useLanguage()
  const settings = useSiteSettings()
  const logoUrl = settingString(settings, 'logo_url')
  const [index, setIndex] = useState(0)
  const visible = slides.filter((s) => s.is_active)

  useEffect(() => {
    if (visible.length <= 1) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % visible.length), 6000)
    return () => window.clearInterval(t)
  }, [visible.length])

  if (visible.length === 0) return null

  return (
    <section className="relative h-[72vh] min-h-[480px] overflow-hidden" aria-roledescription="carousel">
      {visible.map((slide, i) => (
        <div
          key={slide.id}
          className={cn('absolute inset-0 transition-opacity duration-1000', i === index ? 'opacity-100' : 'opacity-0')}
          aria-hidden={i !== index}
        >
          <picture>
            <source media="(max-width: 767px)" srcSet={slide.image_mobile ?? slide.image_desktop ?? undefined} />
            <img src={slide.image_desktop ?? undefined} alt="" className="h-full w-full object-cover" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />

          <div className="container relative flex h-full flex-col justify-center">
            <h1 className="max-w-xl font-display text-4xl text-white md:text-6xl">
              {translate(slide.title_translations, lang)}
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/85 md:text-base">
              {translate(slide.subtitle_translations, lang)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {slide.cta_label_translations && (
                <Link
                  to={slide.cta_url ?? '/shop'}
                  className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:scale-105 hover:opacity-90"
                >
                  {translate(slide.cta_label_translations, lang)}
                </Link>
              )}
              {slide.cta_secondary_label_translations && (
                <Link
                  to={slide.cta_secondary_url ?? '/shop'}
                  className="rounded-full border border-white/60 px-7 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
                >
                  {translate(slide.cta_secondary_label_translations, lang)}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* ===== 🎈 BALLONS-LOGO QUI DANSENT DES DEUX CÔTÉS ===== */}
      {logoUrl && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-3 z-10 hidden flex-col justify-around md:flex" aria-hidden>
            {[0, 1, 2].map((i) => (
              <img
                key={i}
                src={logoUrl}
                alt=""
                className="balloon-float h-12 w-12 rounded-full object-cover opacity-90 shadow-xl ring-2 ring-white/60"
                style={{ animationDelay: `${i * 0.8}s` }}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-3 z-10 hidden flex-col justify-around md:flex" aria-hidden>
            {[0, 1, 2].map((i) => (
              <img
                key={i}
                src={logoUrl}
                alt=""
                className="balloon-float h-12 w-12 rounded-full object-cover opacity-90 shadow-xl ring-2 ring-white/60"
                style={{ animationDelay: `${0.4 + i * 0.8}s` }}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes balloonFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg) scale(1); }
          50% { transform: translateY(-22px) rotate(5deg) scale(1.08); }
        }
        .balloon-float { animation: balloonFloat 3.6s ease-in-out infinite; }
      `}</style>

      {/* Points de navigation */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {visible.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={cn('h-2 rounded-full transition-all', i === index ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80')}
          />
        ))}
      </div>
    </section>
  )
}