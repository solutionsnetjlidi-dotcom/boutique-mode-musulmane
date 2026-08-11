import { supabase } from '@/lib/supabase'
import type {
  AnnouncementRow, CategoryRow, CollectionRow, FaqRow, HeroRow,
  HomepageSectionRow, ProductWithVariants, ReviewRow, SocialLinkRow,
} from '@/types/database.types'

const PRODUCT_SELECT = '*, product_variants(*)'

async function throwIfError<T>(p: { data: T | null; error: Error | null }): Promise<T> {
  if (p.error) throw p.error
  return p.data as T
}

/** Section 11 : agrège toutes les données nécessaires à la homepage en une seule passe. */
export const fetchHomeData = async () => {
  const [hero, categories, collections, sections, reviews, faqs, social, announcements] = await Promise.all([
    throwIfError(await supabase.from('hero_sections').select('*').eq('is_active', true).order('sort_order')),
    throwIfError(await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')),
    throwIfError(await supabase.from('collections').select('*').eq('is_active', true).order('sort_order')),
    throwIfError(await supabase.from('homepage_sections').select('*').eq('is_active', true).order('sort_order')),
    throwIfError(await supabase.from('reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(6)),
    throwIfError(await supabase.from('faqs').select('*').eq('is_active', true).order('sort_order')),
    throwIfError(await supabase.from('social_links').select('*').eq('is_active', true).order('sort_order')),
    throwIfError(await supabase.from('announcement_bars').select('*').eq('is_active', true).order('sort_order')),
  ])

  const products = await throwIfError<ProductWithVariants[]>(
    await supabase.from('products').select(PRODUCT_SELECT).eq('is_active', true),
  )

  return {
    hero: hero as HeroRow[],
    categories: categories as CategoryRow[],
    collections: collections as CollectionRow[],
    sections: sections as HomepageSectionRow[],
    reviews: reviews as ReviewRow[],
    faqs: faqs as FaqRow[],
    social: social as SocialLinkRow[],
    announcements: announcements as AnnouncementRow[],
    /* Section 18 : nouveautés récemment ajoutées */
    newArrivals: [...products].filter((p) => p.is_new).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4),
    /* Section 17 : best sellers calculés automatiquement */
    bestSellers: [...products].filter((p) => p.is_best_seller || p.sold_count > 0).sort((a, b) => b.sold_count - a.sold_count).slice(0, 4),
    /* Section 16 : tendances */
    trending: products.filter((p) => p.is_featured).slice(0, 4),
    /* Section 19 : promotions */
    promotions: products.filter((p) => p.compare_at_price != null && p.compare_at_price > p.base_price).slice(0, 4),
  }
}

export type HomeData = Awaited<ReturnType<typeof fetchHomeData>>

/** Section 32 : fiche produit par slug. */
export const fetchProductBySlug = async (slug: string) =>
  throwIfError<ProductWithVariants>(
    await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle(),
  )