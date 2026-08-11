import { useEffect, useState } from 'react'
import { Ruler } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import type { ProductWithVariants, SizeGuideRow } from '@/types/database.types'

/** Section 36 : guide des tailles par produit, sinon par catégorie. */
export default function SizeGuideDialog({ product }: { product: ProductWithVariants }) {
  const { lang } = useLanguage()
  const [guides, setGuides] = useState<SizeGuideRow[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true

    const load = async () => {
      const byProduct = await supabase
        .from('size_guides').select('*').eq('product_id', product.id).eq('is_active', true)
      let rows = (byProduct.data ?? []) as SizeGuideRow[]

      if (rows.length === 0 && product.category_id) {
        const byCategory = await supabase
          .from('size_guides').select('*').eq('category_id', product.category_id).eq('is_active', true)
        rows = (byCategory.data ?? []) as SizeGuideRow[]
      }
      if (mounted) setGuides(rows)
    }

    void load()
    return () => { mounted = false }
  }, [open, product.id, product.category_id])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 transition hover:text-primary">
          <Ruler className="h-3.5 w-3.5" aria-hidden />
          {translate({ fr: 'Guide des tailles', en: 'Size guide', ar: 'دليل المقاسات' }, lang)}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {guides.length > 0
              ? translate(guides[0].title_translations, lang)
              : translate({ fr: 'Guide des tailles', en: 'Size guide', ar: 'دليل المقاسات' }, lang)}
          </DialogTitle>
        </DialogHeader>

        {guides.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {translate({
              fr: 'Nos pièces taillent normalement avec une coupe ample pensée pour la pudeur et le confort. En cas de doute entre deux tailles, choisissez la taille supérieure, ou contactez-nous sur WhatsApp pour un conseil personnalisé.',
              en: 'Our pieces fit true to size with a loose cut designed for modesty and comfort. If between sizes, size up — or contact us on WhatsApp for personal advice.',
              ar: 'قطعنا بمقاسات مضبوطة مع قصّة واسعة تراعي الحشمة والراحة. عند التردد بين مقاسين اختاري الأكبر، أو تواصلي معنا عبر واتساب لنصيحة شخصية.',
            }, lang)}
          </p>
        ) : (
          guides.map((g) => {
            const rows = Array.isArray(g.data) ? (g.data as Record<string, string>[]) : []
            const cols = rows.length > 0 ? Object.keys(rows[0]) : []
            return (
              <div key={g.id} className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] border-collapse text-sm">
                    <thead>
                      <tr>
                        {cols.map((c) => (
                          <th key={c} className="border border-border bg-muted/50 px-3 py-2 text-start font-semibold capitalize">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          {cols.map((c) => (
                            <td key={c} className="border border-border px-3 py-2">{r[c]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {translate(g.recommendations_translations, lang)}
                </p>
              </div>
            )
          })
        )}
      </DialogContent>
    </Dialog>
  )
}