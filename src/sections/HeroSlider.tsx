import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import { cn } from '@/lib/utils'

const GOLD = '#D4AF37'

interface HeroSlide {
  id: string
  title_translations: any
  subtitle_translations: any
  cta_label_translations: any
  cta_url: string | null
  cta_secondary_label_translations: any
  cta_secondary_url: string | null
  is_active: boolean
}

interface FlowProduct {
  id: string
  slug: string
  name_translations: any
  main_image_url: string | null
}

/* Trajectoires de la fontaine (dx, dy en px depuis le centre) */
const VECTORS = [
  { dx: -430, dy: -140 }, { dx: -380, dy: -250 }, { dx: -280, dy: -330 }, { dx: -150, dy: -380 },
  { dx: 0, dy: -400 }, { dx: 150, dy: -380 }, { dx: 280, dy: -330 }, { dx: 380, dy: -250 },
  { dx: 430, dy: -140 }, { dx: -470, dy: -20 }, { dx: 470, dy: -20 }, { dx: -400, dy: 90 },
  { dx: 400, dy: 90 }, { dx: -220, dy: -200 }, { dx: 220, dy: -200 }, { dx: 0, dy: -260 },
]

/**
 * Hero « Fontaine Dorée » : grand logo qui zoome + produits qui jaillissent
 * du centre avec étincelles d'or + titres CMS en boucle (section 12).
 */
export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const { lang } = useLanguage()
  const settings = useSiteSettings()
  const logoUrl = settingString(settings, 'logo_url')
  const brand = translate(settings?.brand_name as any, lang, 'ESTABRAK')

  const [index, setIndex] = useState(0)
  const [products, setProducts] = useState<FlowProduct[]>([])
  const visible = slides.filter((s) => s.is_active)

  useEffect(() => {
    supabase
      .from('products')
      .select('id, slug, name_translations, main_image_url')
      .eq('is_active', true)
      .order('sold_count', { ascending: false })
      .limit(16)
      .then(({ data }) => setProducts((data ?? []) as FlowProduct[]))
  }, [])

  useEffect(() => {
    if (visible.length <= 1) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % visible.length), 6000)
    return () => window.clearInterval(t)
  }, [visible.length])

  const current = visible[index] ?? visible[0]

  return (
    <section className="relative h-[85vh] min-h-[640px] overflow-hidden" aria-roledescription="carousel">
      {/* Fond doux */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/50 to-background" />

      {/* ===== ⛲ FONTAINE DE PRODUITS DORÉE ===== */}
      <div className="pointer-events-none absolute inset-0 z-10 origin-center scale-[.62] sm:scale-90 md:scale-100">
        {products.map((p, i) => {
          const v = VECTORS[i % VECTORS.length]
          return (
            <div
              key={p.id}
              className="fountain-item"
              style={{
                '--dx': `${v.dx}px`,
                '--dy': `${v.dy}px`,
                animationDelay: `${(i * 0.65) % 6}s`,
                animationDuration: `${5.5 + (i % 3) * 0.9}s`,
              } as any}
            >
              <img
                src={p.main_image_url ?? undefined}
                alt=""
                className="h-14 w-14 rounded-full object-cover ring-2 ring-[#D4AF37]/80 shadow-[0_0_22px_rgba(212,175,55,0.55)]"
              />
            </div>
          )
        })}
        {/* Étincelles dorées */}
        {Array.from({ length: 20 }).map((_, i) => {
          const v = VECTORS[(i * 5) % VECTORS.length]
          return (
            <span
              key={`spark-${i}`}
              className="fountain-item block h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.95)]"
              style={{
                '--dx': `${v.dx * 1.18}px`,
                '--dy': `${v.dy * 1.18}px`,
                animationDelay: `${(i * 0.33) % 5}s`,
                animationDuration: `${4 + (i % 4)}s`,
              } as any}
            />
          )
        })}
      </div>

      {/* ===== GRAND LOGO + ZOOM AVANT ===== */}
      <div className="pointer-events-none absolute left-1/2 top-[40%] z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="hub-gold flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-primary shadow-2xl ring-4 ring-[#D4AF37]/70 md:h-36 md:w-36">
          <div className="hub-zoom flex h-full w-full items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt={brand} className="h-24 w-24 rounded-3xl object-cover md:h-28 md:w-28" />
            ) : (
              <span className="font-display text-5xl text-primary-foreground">{brand.charAt(0)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Faisceau dégradé or → rose */}
      <div
        className="pointer-events-none absolute left-1/2 top-[47%] z-10 h-[45%] w-[46rem] max-w-[92vw] -translate-x-1/2 opacity-90"
        style={{
          background: `linear-gradient(to bottom, ${GOLD}cc, hsl(var(--primary) / .5) 45%, transparent)`,
          clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0% 100%)',
          filter: 'blur(1px)',
        }}
      />

      {/* ===== TITRES EN BOUCLE ===== */}
      {current && (
        <div className="absolute inset-x-0 bottom-8 z-30 mx-auto max-w-3xl px-4 text-center">
          <h1 className="font-display text-4xl md:text-6xl">
            {translate(current.title_translations, lang)}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            {translate(current.subtitle_translations, lang)}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {current.cta_label_translations && (
              <Link
                to={current.cta_url ?? '/shop'}
                className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:scale-105"
              >
                {translate(current.cta_label_translations, lang)}
              </Link>
            )}
            {current.cta_secondary_label_translations && (
              <Link
                to={current.cta_secondary_url ?? '/shop'}
                className="rounded-full border border-border bg-card/80 px-7 py-3 text-sm font-medium backdrop-blur transition hover:border-primary hover:text-primary"
              >
                {translate(current.cta_secondary_label_translations, lang)}
              </Link>
            )}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            {visible.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-500',
                  i === index ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground',
                )}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        /* ===== Fontaine : jaillissement du centre vers l'extérieur ===== */
        .fountain-item {
          position: absolute;
          left: 50%;
          top: 40%;
          opacity: 0;
          transform: translate(-50%, -50%);
          animation: fountain 6s cubic-bezier(.2, .6, .4, 1) infinite;
        }
        @keyframes fountain {
          0%   { transform: translate(-50%, -50%) translate(0, 0) scale(.15); opacity: 0; }
          10%  { opacity: 1; }
          70%  { opacity: .95; }
          100% { transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(1); opacity: 0; }
        }
        /* ===== Halo doré du logo ===== */
        @keyframes hubGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, .55), 0 25px 70px -20px hsl(var(--primary) / .65); }
          50% { box-shadow: 0 0 0 26px rgba(212, 175, 55, 0), 0 25px 70px -20px hsl(var(--primary) / .65); }
        }
        .hub-gold { animation: hubGold 2.6s ease-out infinite; }
        /* ===== Zoom avant périodique du logo ===== */
        @keyframes hubZoom {
          0%, 52%, 100% { transform: scale(1); }
          62% { transform: scale(1.32); }
          72% { transform: scale(1.14); }
          82% { transform: scale(1.26); }
        }
        .hub-zoom { animation: hubZoom 5s ease-in-out infinite; }
      `}</style>
    </section>
  )
}