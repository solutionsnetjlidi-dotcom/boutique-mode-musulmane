import { useCallback, useEffect, useState } from 'react'
import { Boxes } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { translate } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { ProductRow } from '@/types/database.types'

type StockTab = 'all' | 'low' | 'out'

/** Section 73 : gestion du stock — ajustements + historique stock_movements. */
export default function AdminStock() {
  const { user, isManager } = useAuth()
  const [products, setProducts] = useState<ProductRow[] | null>(null)
  const [tab, setTab] = useState<StockTab>('all')
  const [newStock, setNewStock] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    supabase.from('products').select('*').order('stock', { ascending: true })
      .then(({ data }) => setProducts((data ?? []) as ProductRow[]))
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = (products ?? []).filter((p) => {
    if (tab === 'low') return p.stock > 0 && p.stock <= p.low_stock_threshold
    if (tab === 'out') return p.stock <= 0
    return true
  })

  const adjust = async (p: ProductRow) => {
    if (!isManager) { toast('RBAC : réservé à l\'équipe.'); return }
    const target = Number(newStock[p.id])
    if (!Number.isFinite(target) || target < 0) { toast('Valeur de stock invalide.'); return }
    const delta = target - p.stock
    if (delta === 0) return

    const { error } = await supabase.from('products').update({ stock: target }).eq('id', p.id)
    if (error) { toast(error.message); return }

    // Historique (section 73)
    await supabase.from('stock_movements').insert({
      product_id: p.id,
      type: 'adjustment',
      quantity: delta,
      reason: 'Ajustement manuel (dashboard)',
      created_by: user?.id ?? null,
    })

    toast(`Stock de « ${translate(p.name_translations, 'fr')} » : ${p.stock} → ${target} ✓`)
    setNewStock((s) => ({ ...s, [p.id]: '' }))
    load()
  }

  const totalUnits = (products ?? []).reduce((s, p) => s + Math.max(p.stock, 0), 0)
  const lowCount = (products ?? []).filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold).length
  const outCount = (products ?? []).filter((p) => p.stock <= 0).length

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl">
            <Boxes className="h-6 w-6 text-primary" aria-hidden /> Gestion du stock
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalUnits} unités en stock · {lowCount} stock faible · {outCount} rupture
          </p>
        </div>
      </header>

      <div className="flex gap-2">
        {([['all', 'Tous'], ['low', 'Stock faible'], ['out', 'Rupture']] as [StockTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition',
              tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Stock actuel</th>
              <th className="px-4 py-3">Seuil alerte</th>
              <th className="px-4 py-3">État</th>
              <th className="px-4 py-3">Ajuster</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products === null ? (
              <tr><td colSpan={5} className="px-4 py-4"><Skeleton className="h-8 w-full" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Aucun produit dans cette vue.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="transition hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.main_image_url ?? undefined} alt="" className="h-10 rounded-lg bg-muted object-cover" style={{ width: '2rem' }} />
                    <div>
                      <p className="font-medium">{translate(p.name_translations, 'fr')}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{p.sku ?? p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-lg font-semibold">{p.stock}</td>
                <td className="px-4 py-3">{p.low_stock_threshold}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase',
                    p.stock <= 0 ? 'bg-red-100 text-red-700'
                    : p.stock <= p.low_stock_threshold ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700')}
                  >
                    {p.stock <= 0 ? 'Rupture' : p.stock <= p.low_stock_threshold ? 'Stock faible' : 'En stock'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min="0"
                      value={newStock[p.id] ?? ''}
                      onChange={(e) => setNewStock((s) => ({ ...s, [p.id]: e.target.value }))}
                      placeholder={String(p.stock)}
                      className="h-9 w-24"
                      aria-label={`Nouveau stock pour ${translate(p.name_translations, 'fr')}`}
                    />
                    <Button size="sm" variant="outline" onClick={() => adjust(p)}>Ajuster</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}