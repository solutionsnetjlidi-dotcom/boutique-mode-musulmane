import { useEffect, useState } from 'react'
import { loadCatalogData } from '@/services/shop'
import type { CatalogData, CatalogProduct } from '@/services/shop'
import { translate } from '@/lib/translations'
import type { Language } from '@/lib/translations'
import type { Json } from '@/types/database.types'

export const PER_PAGE = 12

export type SortKey =
  | 'relevance' | 'newest' | 'bestsellers'
  | 'price-asc' | 'price-desc' | 'promo'
  | 'name-asc' | 'name-desc'

/** Section 27 : état complet des filtres. */
export interface CatalogFilters {
  q: string
  categories: string[]
  collections: string[]
  colors: string[]
  sizes: string[]
  priceMin: number
  priceMax: number
  inStock: boolean
  onSale: boolean
  premium: boolean
  sort: SortKey
  page: number
}

/** Hook : données du catalogue avec cache module (section 84). */
export function useCatalogData(): { data: CatalogData | null; loading: boolean; error: boolean } {
  const [state, setState] = useState<{ data: CatalogData | null; loading: boolean; error: boolean }>({
    data: null, loading: true, error: false,
  })

  useEffect(() => {
    let mounted = true
    loadCatalogData()
      .then((d) => mounted && setState({ data: d, loading: false, error: false }))
      .catch(() => mounted && setState({ data: null, loading: false, error: true }))
    return () => { mounted = false }
  }, [])

  return state
}

export function parseFilters(params: URLSearchParams, bounds: [number, number]): CatalogFilters {
  const list = (key: string) => params.get(key)?.split(',').filter(Boolean) ?? []
  return {
    q: params.get('q') ?? '',
    categories: list('cat'),
    collections: list('col'),
    colors: list('colors'),
    sizes: list('sizes'),
    priceMin: params.get('pmin') != null ? Number(params.get('pmin')) : bounds[0],
    priceMax: params.get('pmax') != null ? Number(params.get('pmax')) : bounds[1],
    inStock: params.get('stock') === '1',
    onSale: params.get('promo') === '1',
    premium: params.get('premium') === '1',
    sort: ((params.get('sort') as SortKey) || 'relevance'),
    page: Math.max(1, Number(params.get('page') ?? 1) || 1),
  }
}

export function filtersToParams(f: CatalogFilters, bounds: [number, number]): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.categories.length) p.set('cat', f.categories.join(','))
  if (f.collections.length) p.set('col', f.collections.join(','))
  if (f.colors.length) p.set('colors', f.colors.join(','))
  if (f.sizes.length) p.set('sizes', f.sizes.join(','))
  if (f.priceMin > bounds[0]) p.set('pmin', String(f.priceMin))
  if (f.priceMax < bounds[1]) p.set('pmax', String(f.priceMax))
  if (f.inStock) p.set('stock', '1')
  if (f.onSale) p.set('promo', '1')
  if (f.premium) p.set('premium', '1')
  if (f.sort !== 'relevance') p.set('sort', f.sort)
  if (f.page > 1) p.set('page', String(f.page))
  return p
}

const textOf = (t: Json | null): string =>
  t && typeof t === 'object' && !Array.isArray(t)
    ? Object.values(t as Record<string, unknown>).filter((v): v is string => typeof v === 'string').join(' ')
    : ''

/** Section 27 : application de tous les filtres (recherche multilingue incluse). */
export function applyFilters(products: CatalogProduct[], f: CatalogFilters): CatalogProduct[] {
  const q = f.q.trim().toLowerCase()

  return products.filter((p) => {
    if (f.categories.length && (!p.categories || !f.categories.includes(p.categories.slug))) return false
    if (f.collections.length && (!p.collections || !f.collections.includes(p.collections.slug))) return false

    if (f.colors.length) {
      const colors = p.product_variants.map((v) => (v.attributes as Record<string, string>).color).filter(Boolean)
      if (!colors.some((c) => f.colors.includes(c))) return false
    }

    if (f.sizes.length) {
      const sizes = p.product_variants.map((v) => (v.attributes as Record<string, string>).size).filter(Boolean)
      if (!f.sizes.some((s) => sizes.includes(s))) return false
    }

    if (p.base_price < f.priceMin || p.base_price > f.priceMax) return false
    if (f.inStock && p.stock <= 0) return false
    if (f.onSale && !(p.compare_at_price != null && p.compare_at_price > p.base_price)) return false
    if (f.premium && !p.is_premium) return false

    if (q) {
      const haystack = [
        textOf(p.name_translations),
        textOf(p.short_description_translations),
        textOf(p.categories?.name_translations ?? null),
        p.sku ?? '',
        p.tags.join(' '),
      ].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })
}

export function discountPct(p: CatalogProduct): number {
  return p.compare_at_price && p.compare_at_price > p.base_price
    ? Math.round((1 - p.base_price / p.compare_at_price) * 100)
    : 0
}

/** Section 28 : 8 options de tri. */
export function sortProducts(list: CatalogProduct[], sort: SortKey, lang: Language): CatalogProduct[] {
  const arr = [...list]
  const name = (p: CatalogProduct) => translate(p.name_translations, lang)

  switch (sort) {
    case 'newest':
      arr.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
    case 'bestsellers':
      arr.sort((a, b) => (b.sold_count - a.sold_count) || (Number(b.is_best_seller) - Number(a.is_best_seller))); break
    case 'price-asc':
      arr.sort((a, b) => a.base_price - b.base_price); break
    case 'price-desc':
      arr.sort((a, b) => b.base_price - a.base_price); break
    case 'promo':
      arr.sort((a, b) => discountPct(b) - discountPct(a)); break
    case 'name-asc':
      arr.sort((a, b) => name(a).localeCompare(name(b))); break
    case 'name-desc':
      arr.sort((a, b) => name(b).localeCompare(name(a))); break
    default:
      arr.sort((a, b) =>
        (Number(b.is_featured) - Number(a.is_featured)) ||
        (b.sold_count - a.sold_count) ||
        b.created_at.localeCompare(a.created_at))
  }
  return arr
}

/** Options couleurs (nom + hex) dérivées des variantes. */
export function deriveColorOptions(products: CatalogProduct[]): [string, string][] {
  const map = new Map<string, string>()
  products.forEach((p) => p.product_variants.forEach((v) => {
    const a = v.attributes as Record<string, string>
    if (a.color && !map.has(a.color)) map.set(a.color, a.hex ?? '#CCCCCC')
  }))
  return [...map.entries()]
}

/** Options tailles dérivées des variantes, ordonnées. */
export function deriveSizeOptions(products: CatalogProduct[]): string[] {
  const set = new Set<string>()
  products.forEach((p) => p.product_variants.forEach((v) => {
    const a = v.attributes as Record<string, string>
    if (a.size) set.add(a.size)
  }))
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Taille unique']
  return [...set].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

/** Bornes min/max du prix pour le slider. */
export function derivePriceBounds(products: CatalogProduct[]): [number, number] {
  if (products.length === 0) return [0, 200]
  const prices = products.map((p) => p.base_price)
  return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
}