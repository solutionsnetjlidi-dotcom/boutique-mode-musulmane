import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import {
  PER_PAGE, applyFilters, derivePriceBounds, filtersToParams, parseFilters, sortProducts,
  useCatalogData,
} from '@/hooks/useCatalog'
import type { CatalogFilters, SortKey } from '@/hooks/useCatalog'
import ProductCard from '@/components/product/ProductCard'
import FilterPanel from '@/components/shop/FilterPanel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Json } from '@/types/database.types'

const SORTS: { value: SortKey; label: Json }[] = [
  { value: 'relevance', label: { fr: 'Pertinence', en: 'Relevance', ar: 'الأكثر صلة' } },
  { value: 'newest', label: { fr: 'Nouveautés', en: 'Newest', ar: 'الأحدث' } },
  { value: 'bestsellers', label: { fr: 'Best Sellers', en: 'Best Sellers', ar: 'الأكثر مبيعاً' } },
  { value: 'price-asc', label: { fr: 'Prix croissant', en: 'Price: low to high', ar: 'السعر تصاعدياً' } },
  { value: 'price-desc', label: { fr: 'Prix décroissant', en: 'Price: high to low', ar: 'السعر تنازلياً' } },
  { value: 'promo', label: { fr: 'Promotions', en: 'Promotions', ar: 'العروض' } },
  { value: 'name-asc', label: { fr: 'Nom A-Z', en: 'Name A-Z', ar: 'الاسم أ-ي' } },
  { value: 'name-desc', label: { fr: 'Nom Z-A', en: 'Name Z-A', ar: 'الاسم ي-أ' } },
]

/** Sections 26-28 : toolbar, filtres actifs, grille, pagination, drawer mobile. */
export default function CatalogBrowser({
  lockedCategory, lockedCollection,
}: {
  lockedCategory?: string
  lockedCollection?: string
}) {
  const { lang } = useLanguage()
  const { data, loading, error } = useCatalogData()
  const [params, setParams] = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const priceBounds = useMemo(() => derivePriceBounds(data?.products ?? []), [data])
  const filters = useMemo(() => parseFilters(params, priceBounds), [params, priceBounds])

  const update = useCallback((patch: Partial<CatalogFilters>) => {
    const next = { ...filters, ...patch }
    if (!('page' in patch)) next.page = 1
    setParams(filtersToParams(next, priceBounds), { replace: true })
  }, [filters, priceBounds, setParams])

  const filtered = useMemo(() => {
    if (!data) return []
    const f: CatalogFilters = {
      ...filters,
      categories: lockedCategory ? [lockedCategory] : filters.categories,
      collections: lockedCollection ? [lockedCollection] : filters.collections,
    }
    return sortProducts(applyFilters(data.products, f), filters.sort, lang)
  }, [data, filters, lang, lockedCategory, lockedCollection])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const page = Math.min(filters.page, totalPages)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  /* Puces des filtres actifs */
  const chips: { label: string; onRemove: () => void }[] = []
  if (filters.q) chips.push({ label: `« ${filters.q} »`, onRemove: () => update({ q: '' }) })
  if (!lockedCategory) filters.categories.forEach((c) => chips.push({
    label: translate(data?.categories.find((x) => x.slug === c)?.name_translations, lang, c),
    onRemove: () => update({ categories: filters.categories.filter((x) => x !== c) }),
  }))
  if (!lockedCollection) filters.collections.forEach((c) => chips.push({
    label: translate(data?.collections.find((x) => x.slug === c)?.name_translations, lang, c),
    onRemove: () => update({ collections: filters.collections.filter((x) => x !== c) }),
  }))
  filters.colors.forEach((c) => chips.push({ label: c, onRemove: () => update({ colors: filters.colors.filter((x) => x !== c) }) }))
  filters.sizes.forEach((s) => chips.push({ label: s, onRemove: () => update({ sizes: filters.sizes.filter((x) => x !== s) }) }))
  if (filters.inStock) chips.push({ label: translate({ fr: 'En stock', en: 'In stock', ar: 'متوفر' }, lang), onRemove: () => update({ inStock: false }) })
  if (filters.onSale) chips.push({ label: translate({ fr: 'Promotions', en: 'On sale', ar: 'عروض' }, lang), onRemove: () => update({ onSale: false }) })
  if (filters.premium) chips.push({ label: 'Premium', onRemove: () => update({ premium: false }) })

  if (error) {
    return (
      <p className="container py-20 text-center text-sm text-muted-foreground">
        Impossible de charger le catalogue. Vérifiez la connexion Supabase.
      </p>
    )
  }

  const panelProps = {
    products: data?.products ?? [],
    categories: data?.categories ?? [],
    collections: data?.collections ?? [],
    filters, priceBounds, onChange: update,
    hideCategories: !!lockedCategory,
    hideCollections: !!lockedCollection,
  }

  return (
    <div className="container flex gap-8 py-8">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 lg:block" aria-label={translate({ fr: 'Filtres', en: 'Filters', ar: 'الفلاتر' }, lang)}>
        <FilterPanel {...panelProps} />
      </aside>

      <div className="min-w-0 flex-1">
        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtered.length} {translate({ fr: 'produits', en: 'products', ar: 'منتجات' }, lang)}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              {translate({ fr: 'Filtres', en: 'Filters', ar: 'الفلاتر' }, lang)}
            </Button>
            <label htmlFor="sort" className="sr-only">{translate({ fr: 'Trier', en: 'Sort', ar: 'ترتيب' }, lang)}</label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              className="h-9 rounded-full border border-border bg-card px-4 text-xs outline-none transition focus:border-primary"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{translate(s.label, lang)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Puces filtres actifs */}
        {chips.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={chip.onRemove}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition hover:border-primary"
              >
                {chip.label} <X className="h-3 w-3" aria-hidden />
              </button>
            ))}
            <button
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="text-xs text-primary underline underline-offset-2"
            >
              {translate({ fr: 'Tout effacer', en: 'Clear all', ar: 'مسح الكل' }, lang)}
            </button>
          </div>
        )}

        {/* Grille */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-xl">
              {translate({ fr: 'Aucun produit ne correspond', en: 'No matching products', ar: 'لا توجد منتجات مطابقة' }, lang)}
            </p>
            <p className="text-sm text-muted-foreground">
              {translate({ fr: 'Essayez de retirer des filtres ou de modifier votre recherche.', en: 'Try removing filters or editing your search.', ar: 'جرّبي إزالة بعض الفلاتر أو تعديل بحثك.' }, lang)}
            </p>
            <Button variant="outline" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              {translate({ fr: 'Réinitialiser', en: 'Reset', ar: 'إعادة تعيين' }, lang)}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label={translate({ fr: 'Pagination', en: 'Pagination', ar: 'التنقل بين الصفحات' }, lang)}>
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => { update({ page: page - 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              aria-label={translate({ fr: 'Page précédente', en: 'Previous page', ar: 'الصفحة السابقة' }, lang)}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { update({ page: i + 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                aria-current={page === i + 1 ? 'page' : undefined}
                className={
                  page === i + 1
                    ? 'h-9 w-9 rounded-full bg-primary text-sm text-primary-foreground'
                    : 'h-9 w-9 rounded-full border border-border text-sm transition hover:border-primary'
                }
              >
                {i + 1}
              </button>
            ))}
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages}
              onClick={() => { update({ page: page + 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              aria-label={translate({ fr: 'Page suivante', en: 'Next page', ar: 'الصفحة التالية' }, lang)}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Button>
          </nav>
        )}
      </div>

      {/* Drawer filtres mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{translate({ fr: 'Filtres', en: 'Filters', ar: 'الفلاتر' }, lang)}</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-4">
            <FilterPanel {...panelProps} />
          </div>
          <SheetFooter>
            <Button className="w-full" onClick={() => setMobileOpen(false)}>
              {translate({ fr: `Voir ${filtered.length} produits`, en: `Show ${filtered.length} products`, ar: `عرض ${filtered.length} منتجاً` }, lang)}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}