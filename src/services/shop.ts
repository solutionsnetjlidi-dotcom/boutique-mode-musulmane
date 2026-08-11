import { supabase } from '@/lib/supabase'
import type { CategoryRow, CollectionRow, Json, ProductWithVariants } from '@/types/database.types'

const CATALOG_SELECT = '*, product_variants(*), categories(id, slug, name_translations), collections(id, slug, name_translations)'

/** Section 26 : produit enrichi de sa catégorie et collection jointes. */
export type CatalogProduct = ProductWithVariants & {
  categories: { id: string; slug: string; name_translations: Json } | null
  collections: { id: string; slug: string; name_translations: Json } | null
}

export interface CatalogData {
  products: CatalogProduct[]
  categories: CategoryRow[]
  collections: CollectionRow[]
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  const { data, error } = await supabase
    .from('products').select(CATALOG_SELECT).eq('is_active', true)
  if (error) throw error
  return (data ?? []) as unknown as CatalogProduct[]
}

export async function fetchAllCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories').select('*').eq('is_active', true).order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchAllCollections(): Promise<CollectionRow[]> {
  const { data, error } = await supabase
    .from('collections').select('*').eq('is_active', true).order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const { data, error } = await supabase
    .from('categories').select('*').eq('slug', slug).eq('is_active', true).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchCollectionBySlug(slug: string): Promise<CollectionRow | null> {
  const { data, error } = await supabase
    .from('collections').select('*').eq('slug', slug).eq('is_active', true).maybeSingle()
  if (error) throw error
  return data
}

/* ---- Cache module : une seule requête pour toute la session (section 84) ---- */
let cache: CatalogData | null = null
let pending: Promise<CatalogData> | null = null

export function loadCatalogData(): Promise<CatalogData> {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = Promise.all([fetchCatalogProducts(), fetchAllCategories(), fetchAllCollections()])
      .then(([products, categories, collections]) => {
        cache = { products, categories, collections }
        return cache
      })
      .catch((e) => { pending = null; throw e })
  }
  return pending
}