import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import SectionHeading from '@/sections/SectionHeading'
import type { CategoryRow } from '@/types/database.types'
import type { CatalogProduct } from '@/services/shop'

type Slide =
  | { kind: 'category'; id: string; category: CategoryRow; product: CatalogProduct | null }
  | { kind: 'logo'; id: string }

/**
 * Vitrine 3D « 5D » : best seller de chaque catégorie + LOGO lumineux
 * en alternance entre les catégories, boucle infinie, coverflow profond.
 */
export default function ShopByCategory({ categories }: { categories: CategoryRow[] }) {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const settings = useSiteSettings()
  const logoUrl = settingString(settings, 'logo_url')
  const brand = translate(settings?.brand_name as any, lang, 'ESTABRAK')

  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    supabase
      .from('products')
      .select('*, product_variants(*), categories(slug, name_translations)')
      .eq('is_active', true)
      .order('sold_count', { ascending: false })
      .then(({ data }) => setProducts((data ?? []) as unknown as CatalogProduct[]))
  }, [])

  /* Catégories + logo inséré en alternance */
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = []
    categories
      .filter((c) => c.is_active)
      .forEach((c, idx) => {
        if (logoUrl && idx > 0) list.push({ kind: 'logo', id: `logo-${idx}` })
        list.push({
          kind: 'category',
          id: c.id,
          category: c,
          product: products.find((p) => p.category_id === c.id) ?? null,
        })
      })
    return list
  }, [categories, products, logoUrl])

  const count = slides.length

  useEffect(() => {
    if (paused || count <= 1) return
    const t = window.setInterval(() => setActive((a) => (a + 1) % count), 3200)
    return () => window.clearInterval(t)
  }, [paused, count])

  if (count === 0) return null

  const prev = () => setActive((a) => (a - 1 + count) % count)
  const next = () => setActive((a) => (a + 1) % count)

  return (
    <section className="overflow-hidden py-14">
      <SectionHeading
        eyebrow={translate({ fr: 'Vitrine 3D', en: '3D Showcase', ar: 'واجهة ثلاثية الأبعاد' }, lang)}
        title={translate({
          fr: 'Chaque univers, une pièce d\'exception',
          en: 'Every world, one exceptional piece',
          ar: 'لكل عالم، قطعة استثنائية',
        }, lang)}
      />

      {/* ===== CARROUSEL 3D + LOGO 5D ===== */}
      <div
        className="relative mx-auto mt-6 h-[460px] w-full max-w-6xl"
        style={{ perspective: '1600px' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-roledescription="carousel"
      >
        {slides.map((s, i) => {
          let offset = i - active
          if (offset > count / 2) offset -= count
          if (offset < -count / 2) offset += count
          const abs = Math.abs(offset)
          const isActive = abs === 0
          return (
            <div
              key={s.id}
              className="absolute left-1/2 top-2 w-[270px] transition-all duration-700 ease-out md:w-[320px]"
              style={{
                transform: `translateX(-50%) translateX(${offset * 56}%) translateZ(${isActive ? 40 : -260 * abs}px) rotateY(${offset * -22}deg) rotateX(${isActive ? 0 : 4}deg) scale(${isActive ? 1.04 : 0.9})`,
                zIndex: 30 - abs,
                opacity: abs > 2 ? 0 : 1 - abs * 0.22,
                pointerEvents: abs > 2 ? 'none' : 'auto',
              }}
            >
              {/* ===== CARTE LOGO « 5D » ===== */}
              {s.kind === 'logo' ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => (isActive ? navigate('/shop') : setActive(i))}
                  onKeyDown={(e) => { if (e.key === 'Enter') setActive(i) }}
                  className={cn(
                    'relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-accent to-card transition-shadow duration-500',
                    isActive ? 'cs-glow border-primary/60' : 'border-border',
                  )}
                >
                  {isActive && <div className="cs-shine pointer-events-none absolute inset-0" aria-hidden />}
                  <Sparkles className="cs-twinkle absolute left-6 top-8 h-5 w-5 text-primary" aria-hidden />
                  <Sparkles className="cs-twinkle absolute right-7 top-16 h-4 w-4 text-badge" style={{ animationDelay: '0.7s' }} aria-hidden />
                  <Sparkles className="cs-twinkle absolute bottom-14 left-9 h-4 w-4 text-badge" style={{ animationDelay: '1.3s' }} aria-hidden />
                  <img
                    src={logoUrl ?? undefined}
                    alt={brand}
                    className="balloon-float h-28 w-28 rounded-full object-cover shadow-2xl ring-4 ring-primary/50"
                  />
                  <p className="font-display text-2xl tracking-[0.3em]">{brand}</p>
                  <p className="px-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {translate({ fr: 'Élégance · Pudeur · Amour', en: 'Elegance · Modesty · Love', ar: 'أناقة · حشمة · حب' }, lang)}
                  </p>
                </div>
              ) : (
                /* ===== CARTE CATÉGORIE ===== */
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isActive) { setActive(i); return }
                    if (s.product) navigate(`/product/${s.product.slug}`)
                    else navigate(`/category/${s.category.slug}`)
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') setActive(i) }}
                  className={cn(
                    'group relative overflow-hidden rounded-3xl border bg-card shadow-xl transition-shadow duration-500',
                    isActive ? 'cs-glow border-primary/50' : 'border-border',
                  )}
                >
                  <img
                    src={(s.product?.main_image_url ?? s.category.image_url) ?? undefined}
                    alt={translate(s.category.name_translations, lang)}
                    className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  {isActive && <div className="cs-shine pointer-events-none absolute inset-0" aria-hidden />}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/80">
                      {translate(s.category.name_translations, lang)}
                    </p>
                    {s.product && (
                      <>
                        <p className="mt-1 truncate font-display text-xl">
                          {translate(s.product.name_translations, lang)}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-white/90 price-ltr">
                          {formatPrice(s.product.base_price)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Flèches */}
        <button
          onClick={prev}
          aria-label={translate({ fr: 'Précédent', en: 'Previous', ar: 'السابق' }, lang)}
          className="absolute left-3 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border bg-card/80 p-2.5 backdrop-blur transition hover:border-primary hover:text-primary"
        >
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
        </button>
        <button
          onClick={next}
          aria-label={translate({ fr: 'Suivant', en: 'Next', ar: 'التالي' }, lang)}
          className="absolute right-3 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border bg-card/80 p-2.5 backdrop-blur transition hover:border-primary hover:text-primary"
        >
          <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
        </button>

        {/* Points */}
        <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              aria-label={s.kind === 'logo' ? brand : translate(s.category.name_translations, lang)}
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                i === active ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground',
              )}
            />
          ))}
        </div>
      </div>

      {/* Effets glow + brillance + ballons + étoiles */}
      <style>{`
        .cs-glow { box-shadow: 0 25px 60px -20px hsl(var(--primary) / .5), 0 0 30px -6px hsl(var(--badge) / .35); }
        .cs-shine { background: linear-gradient(105deg, transparent 40%, hsl(0 0% 100% / .35) 50%, transparent 60%); transform: translateX(-130%); animation: csShine 3.2s ease infinite; }
        @keyframes csShine { 0% { transform: translateX(-130%); } 60%, 100% { transform: translateX(130%); } }
        @keyframes balloonFloat {
          0%, 100% { transform: translateY(0) rotate(-4deg) scale(1); }
          50% { transform: translateY(-16px) rotate(4deg) scale(1.06); }
        }
        .balloon-float { animation: balloonFloat 3.4s ease-in-out infinite; }
        @keyframes csTwinkle { 0%, 100% { opacity: .25; transform: scale(.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.25) rotate(20deg); } }
        .cs-twinkle { animation: csTwinkle 2.2s ease-in-out infinite; }
      `}</style>

      {/* ===== Grille complète des catégories ===== */}
      <div className="container mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.slice(0, 8).map((c) => (
          <Link key={c.id} to={`/category/${c.slug}`} className="group relative overflow-hidden rounded-2xl">
            <img
              src={c.image_url ?? undefined}
              alt={translate(c.name_translations, lang)}
              className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute inset-x-0 bottom-4 text-center font-display text-lg text-white">
              {translate(c.name_translations, lang)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}