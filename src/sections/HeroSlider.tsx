import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

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
  base_price: number
  main_image_url: string | null
  is_best_seller: boolean
  is_new: boolean
}

/* ===== Carte produit qui défile ===== */
function FlowCard({ p, lang }: { p: FlowProduct; lang: string }) {
  return (
    <Link
      to={`/product/${p.slug}`}
      className="flex w-60 shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-md transition hover:shadow-xl"
    >
      {p.main_image_url && (
        <img src={p.main_image_url} alt="" className="h-12 w-10 rounded-lg object-cover" loading="lazy" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{translate(p.name_translations, lang)}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary price-ltr">{formatPrice(p.base_price)}</span>
        </p>
      </div>
      {(p.is_best_seller || p.is_new) && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {p.is_best_seller
            ? translate({ fr: 'Bestseller', en: 'Bestseller', ar: 'الأكثر مبيعاً' }, lang)
            : translate({ fr: 'Nouveau', en: 'New', ar: 'جديد' }, lang)}
        </span>
      )}
    </Link>
  )
}

/* ===== Piste inclinée avec défilement infini ===== */
function Lane({
  top, angle, reverse, duration, products, lang,
}: {
  top: string
  angle: number
  reverse?: boolean
  duration: number
  products: FlowProduct[]
  lang: string
}) {
  if (products.length === 0) return null
  const items = [...products, ...products]
  return (
    <div
      className="lane-mask absolute -inset-x-[12%]"
      style={{ top, transform: `rotate(${angle}deg)` }}
    >
      <div
        className={cn('lane-track flex gap-4 py-2', reverse && 'lane-reverse')}
        style={{ animationDuration: `${duration}s` }}
      >
        {items.map((p, i) => (
          <FlowCard key={`${p.id}-${i}`} p={p} lang={lang} />
        ))}
      </div>
    </div>
  )
}

/**
 * Hero « flux de produits » : 3 pistes convergentes + logo-hub + faisceau,
 * titres CMS en boucle (section 12).
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
      .select('id, slug, name_translations, base_price, main_image_url, is_best_seller, is_new')
      .eq('is_active', true)
      .order('sold_count', { ascending: false })
      .limit(18)
      .then(({ data }) => setProducts((data ?? []) as FlowProduct[]))
  }, [])

  useEffect(() => {
    if (visible.length <= 1) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % visible.length), 6000)
    return () => window.clearInterval(t)
  }, [visible.length])

  const current = visible[index] ?? visible[0]
  const laneA = products.slice(0, 6)
  const laneB = products.slice(6, 12)
  const laneC = products.slice(12, 18)

  return (
    <section className="relative h-[80vh] min-h-[600px] overflow-hidden" aria-roledescription="carousel">
      {/* Fond doux */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/50 to-background" />

      {/* ===== 3 PISTES DE PRODUITS ===== */}
      <div className="lanes-pause absolute inset-0">
        <Lane top="14%" angle={7} duration={38} products={laneA} lang={lang} />
        <Lane top="40%" angle={0} reverse duration={30} products={laneB} lang={lang} />
        <Lane top="66%" angle={-7} duration={44} products={laneC} lang={lang} />
      </div>

      {/* ===== LOGO-HUB + FAISCEAU ===== */}
      <div className="pointer-events-none absolute left-1/2 top-[40%] z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="hub-glow flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary shadow-2xl ring-4 ring-white/70">
          {logoUrl ? (
            <img src={logoUrl} alt={brand} className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <span className="font-display text-3xl text-primary-foreground">{brand.charAt(0)}</span>
          )}
        </div>
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] z-10 h-[46%] w-[46rem] max-w-[92vw] -translate-x-1/2 opacity-90"
        style={{
          background: 'linear-gradient(to bottom, hsl(var(--primary) / .85), hsl(var(--primary) / .25) 70%, transparent)',
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
          {/* Points */}
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
        .lane-track { width: max-content; animation: laneMove 36s linear infinite; }
        .lane-reverse { animation-direction: reverse; }
        @keyframes laneMove { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .lane-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 18%, black 82%, transparent);
          mask-image: linear-gradient(to right, transparent, black 18%, black 82%, transparent);
        }
        .lanes-pause:hover .lane-track { animation-play-state: paused; }
        @keyframes hubPulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / .5), 0 25px 60px -20px hsl(var(--primary) / .6); }
          50% { box-shadow: 0 0 0 22px hsl(var(--primary) / 0), 0 25px 60px -20px hsl(var(--primary) / .6); }
        }
        .hub-glow { animation: hubPulse 2.6s ease-out infinite; }
      `}</style>
    </section>
  )
}