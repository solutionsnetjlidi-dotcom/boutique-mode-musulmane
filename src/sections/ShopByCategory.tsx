import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import SectionHeading from '@/sections/SectionHeading'
import type { CategoryRow } from '@/types/database.types'
import type { CatalogProduct } from '@/services/shop'

interface Slide {
  category: CategoryRow
  product: CatalogProduct | null
}

/**
 * Vitrine 3D : un exemple (best seller) de chaque catégorie,
 * boucle infinie + effet coverflow 3D + brillance.
 * Grille complète des catégories conservée en dessous.
 */
export default function ShopByCategory({ categories }: { categories: CategoryRow[] }) {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  /* Un exemple par catégorie = le best seller de la catégorie */
  useEffect(() => {
    supabase
      .from('products')
      .select('*, product_variants(*), categories(slug, name_translations)')
      .eq('is_active', true)
      .order('sold_count', { ascending: false })
      .then(({ data }) => setProducts((data ?? []) as unknown as CatalogProduct[]))
  }, [])

  const slides = useMemo<Slide[]>(
    () =>
      categories
        .filter((c) => c.is_active)
        .map((c) => ({
          category: c,
          product: products.find((p) => p.category_id === c.id) ?? null,
        })),
    [categories, products],
  )

  const count = slides.length

  /* Boucle infinie (pause au survol) */
  useEffect(() => {
    if (paused || count <= 1) return
    const t = window.setInterval(() => setActive((a) => (a + 1) % count), 3500)
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

      {/* ===== SLIDER 3D COVERFLOW ===== */}
      <div
        className="relative mx-auto mt-6 h-[440px] w-full max-w-6xl"
        style={{ perspective: '1500px' }}
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
              key={s.category.id}
              className="absolute left-1/2 top-2 w-[270px] transition-all duration-700 ease-out md:w-[320px]"
              style={{
                transform: `translateX(-50%) translateX(${offset * 58}%) translateZ(${isActive ? 0 : -230 * abs}px) rotateY(${offset * -20}deg)`,
                zIndex: 30 - abs,
                opacity: abs > 2 ? 0 : 1 - abs * 0.22,
                pointerEvents: abs > 2 ? 'none' : 'auto',
              }}
            >
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
              key={s.category.id}
              onClick={() => setActive(i)}
              aria-label={translate(s.category.name_translations, lang)}
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                i === active ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground',
              )}
            />
          ))}
        </div>
      </div>

      {/* Effets glow + brillance */}
      <style>{`
        .cs-glow { box-shadow: 0 25px 60px -20px hsl(var(--primary) / .5), 0 0 30px -6px hsl(var(--badge) / .35); }
        .cs-shine { background: linear-gradient(105deg, transparent 40%, hsl(0 0% 100% / .35) 50%, transparent 60%); transform: translateX(-130%); animation: csShine 3.2s ease infinite; }
        @keyframes csShine { 0% { transform: translateX(-130%); } 60%, 100% { transform: translateX(130%); } }
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