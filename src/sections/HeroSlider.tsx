import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { HeroRow } from '@/types/database.types'

/** Section 13 : Hero slider multi-slides (désactivable → Hero statique). */
export default function HeroSlider({ slides }: { slides: HeroRow[] }) {
  const { lang } = useLanguage()
  const [index, setIndex] = useState(0)
  const visible = slides.filter((s) => s.is_active)

  useEffect(() => {
    if (visible.length < 2) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % visible.length), 6000)
    return () => window.clearInterval(t)
  }, [visible.length])

  if (visible.length === 0) return null

  return (
    <section className="relative h-[72vh] min-h-[480px] overflow-hidden" aria-label="Présentation">
      {visible.map((slide, i) => (
        <div
          key={slide.id}
          className={cn('absolute inset-0 transition-opacity duration-700', i === index ? 'opacity-100' : 'pointer-events-none opacity-0')}
          aria-hidden={i !== index}
        >
          {/* Images desktop / mobile (section 13) */}
          <picture>
            {slide.image_mobile && <source media="(max-width: 767px)" srcSet={slide.image_mobile} />}
            <img
              src={slide.image_desktop ?? slide.image_mobile ?? undefined}
              alt={translate(slide.title_translations, lang)}
              className="h-full w-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
          <div className="container absolute inset-0 flex flex-col justify-center">
            <h1 className="max-w-xl font-display text-4xl leading-tight text-white md:text-6xl">
              {translate(slide.title_translations, lang)}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 md:text-base">
              {translate(slide.subtitle_translations, lang)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {slide.cta_url && (
                <Button asChild size="lg">
                  <Link to={slide.cta_url}>{translate(slide.cta_label_translations, lang, 'Découvrir')}</Link>
                </Button>
              )}
              {slide.cta_secondary_url && (
                <Button asChild size="lg" variant="outline" className="border-white/60 bg-transparent text-white hover:border-white hover:bg-white/10">
                  <Link to={slide.cta_secondary_url}>{translate(slide.cta_secondary_label_translations, lang)}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {visible.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn('h-2 rounded-full transition-all', i === index ? 'w-8 bg-white' : 'w-2 bg-white/50')}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </section>
  )
}