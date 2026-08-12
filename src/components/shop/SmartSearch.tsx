import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'

export default function SmartSearch() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    const term = q.trim()
    if (term.length < 2) { setResults([]); return }
    setLoading(true)
    timer.current = window.setTimeout(() => {
      supabase
        .from('products')
        .select('id, slug, name_translations, base_price, main_image_url, stock')
        .eq('is_active', true)
        .textSearch('search_vector', term, { type: 'plain', config: 'simple' })
        .limit(6)
        .then(({ data }) => {
          setResults((data ?? []) as any[])
          setLoading(false)
        })
    }, 220)
  }, [q])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  const go = (slug: string) => {
    setOpen(false); setQ(''); setResults([])
    navigate(`/product/${slug}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={translate({ fr: 'Rechercher', en: 'Search', ar: 'بحث' }, lang)}
        className="rounded-full p-2 transition hover:bg-accent"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-20 w-[92vw] max-w-2xl rounded-3xl border border-border bg-card p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={translate({ fr: 'Rechercher une pièce…', en: 'Search a piece…', ar: 'ابحثي عن قطعة…' }, lang)}
                className="flex-1 bg-transparent text-base outline-none"
              />
              <button onClick={() => setOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-3 max-h-[60vh] overflow-y-auto">
              {loading && <p className="py-6 text-center text-sm text-muted-foreground">Recherche…</p>}
              {!loading && q.trim().length >= 2 && results.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {translate({ fr: 'Aucun résultat', en: 'No results', ar: 'لا توجد نتائج' }, lang)}
                </p>
              )}
              {!loading && results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(p.slug)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-accent"
                >
                  {p.main_image_url && (
                    <img src={p.main_image_url} alt="" className="h-14 w-11 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{translate(p.name_translations, lang)}</p>
                    <p className="text-sm text-muted-foreground price-ltr">{formatPrice(p.base_price)}</p>
                  </div>
                </button>
              ))}
              {!loading && q.trim().length < 2 && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  {translate({ fr: 'Tapez au moins 2 lettres', en: 'Type at least 2 letters', ar: 'اكتبي حرفين على الأقل' }, lang)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}