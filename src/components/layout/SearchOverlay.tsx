import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { loadCatalogData } from '@/services/shop'
import type { CatalogData } from '@/services/shop'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'

/** Section 29 : recherche intelligente — produits, catégories, collections (nom, SKU, tags). */
export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [query, setQuery] = useState('')
  const [data, setData] = useState<CatalogData | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      loadCatalogData().then(setData).catch(() => setData(null))
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!data || q.length < 2) return { products: [], categories: [], collections: [] }

    const inText = (t: unknown) =>
      t && typeof t === 'object'
        ? Object.values(t as Record<string, unknown>).some(
            (v) => typeof v === 'string' && v.toLowerCase().includes(q),
          )
        : false

    return {
      products: data.products
        .filter((p) =>
          inText(p.name_translations) ||
          inText(p.short_description_translations) ||
          (p.sku ?? '').toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)))
        .slice(0, 5),
      categories: data.categories.filter((c) => inText(c.name_translations)).slice(0, 3),
      collections: data.collections.filter((c) => inText(c.name_translations)).slice(0, 3),
    }
  }, [data, q])

  if (!open) return null

  const submit = () => {
    if (!q) return
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true"
      aria-label={translate({ fr: 'Recherche', en: 'Search', ar: 'بحث' }, lang)}>
      <button
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label={translate({ fr: 'Fermer la recherche', en: 'Close search', ar: 'إغلاق البحث' }, lang)}
      />
      <div className="relative mx-auto mt-16 w-[92%] max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={translate(
              { fr: 'Rechercher un produit, une catégorie…', en: 'Search products, categories…', ar: 'ابحثي عن منتج أو فئة…' },
              lang,
            )}
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            aria-label={translate({ fr: 'Recherche', en: 'Search', ar: 'بحث' }, lang)}
          />
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"
            aria-label={translate({ fr: 'Fermer', en: 'Close', ar: 'إغلاق' }, lang)}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {q.length < 2 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">
              {translate(
                {
                  fr: 'Tapez au moins 2 caractères. Recherche par nom, SKU, catégorie, collection ou tags.',
                  en: 'Type at least 2 characters. Search by name, SKU, category, collection or tags.',
                  ar: 'اكتبي حرفين على الأقل. البحث بالاسم أو الفئة أو التشكيلة.',
                },
                lang,
              )}
            </p>
          ) : (
            <>
              {results.products.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {translate({ fr: 'Produits', en: 'Products', ar: 'المنتجات' }, lang)}
                  </p>
                  {results.products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { navigate(`/product/${p.slug}`); onClose() }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition hover:bg-muted"
                    >
                      <img src={p.main_image_url ?? undefined} alt="" className="h-12 rounded-lg bg-muted object-cover" style={{ width: '2.5rem' }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{translate(p.name_translations, lang)}</span>
                        <span className="text-xs text-muted-foreground price-ltr">{formatPrice(p.base_price)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.categories.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {translate({ fr: 'Catégories', en: 'Categories', ar: 'الفئات' }, lang)}
                  </p>
                  {results.categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { navigate(`/category/${c.slug}`); onClose() }}
                      className="block w-full rounded-xl px-3 py-2 text-start text-sm transition hover:bg-muted"
                    >
                      {translate(c.name_translations, lang)}
                    </button>
                  ))}
                </div>
              )}

              {results.collections.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {translate({ fr: 'Collections', en: 'Collections', ar: 'التشكيلات' }, lang)}
                  </p>
                  {results.collections.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { navigate(`/collection/${c.slug}`); onClose() }}
                      className="block w-full rounded-xl px-3 py-2 text-start text-sm transition hover:bg-muted"
                    >
                      {translate(c.name_translations, lang)}
                    </button>
                  ))}
                </div>
              )}

              {results.products.length === 0 && results.categories.length === 0 && results.collections.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {translate(
                    { fr: `Aucun résultat pour « ${query} »`, en: `No results for "${query}"`, ar: `لا نتائج لـ « ${query} »` },
                    lang,
                  )}
                </p>
              )}

              <button
                onClick={submit}
                className="m-2 w-[calc(100%-16px)] rounded-full bg-primary py-2.5 text-sm text-primary-foreground transition hover:opacity-90"
              >
                {translate(
                  {
                    fr: `Voir tous les résultats pour « ${query.trim()} »`,
                    en: `See all results for "${query.trim()}"`,
                    ar: `عرض كل نتائج « ${query.trim()} »`,
                  },
                  lang,
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}