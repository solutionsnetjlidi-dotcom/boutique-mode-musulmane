import { useCallback, useEffect, useState } from 'react'
import { Check, Star, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ReviewWithProduct = {
  id: string; product_id: string; author_name: string; rating: number
  title: string | null; comment: string | null; is_verified_purchase: boolean
  is_demo: boolean; is_approved: boolean; created_at: string
  products: { name_translations: unknown; slug: string } | null
}

/** Section 51 : modération des avis (publier / masquer / supprimer). */
export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithProduct[] | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  const load = useCallback(() => {
    supabase.from('reviews').select('*, products(name_translations, slug)').order('created_at', { ascending: false })
      .then(({ data }) => setReviews((data ?? []) as unknown as ReviewWithProduct[]))
  }, [])
  useEffect(() => { load() }, [load])

  const setApproved = async (r: ReviewWithProduct, approved: boolean) => {
    const { error } = await supabase.from('reviews').update({ is_approved: approved }).eq('id', r.id)
    if (error) { toast(error.message); return }
    await logAudit('update', 'reviews', r.id, { is_approved: approved })
    toast(approved ? 'Avis publié ✓' : 'Avis masqué')
    load()
  }

  const remove = async (r: ReviewWithProduct) => {
    if (!window.confirm('Supprimer définitivement cet avis ?')) return
    await supabase.from('reviews').delete().eq('id', r.id)
    await logAudit('delete', 'reviews', r.id, {})
    load()
  }

  const visible = (reviews ?? []).filter((r) => (filter === 'pending' ? !r.is_approved : true))
  const pendingCount = (reviews ?? []).filter((r) => !r.is_approved).length

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Avis clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingCount} avis en attente de modération — jamais de faux avis réels (section 51).
        </p>
      </header>

      <div className="flex gap-2">
        <button onClick={() => setFilter('pending')}
          className={cn('rounded-full px-4 py-1.5 text-xs font-medium', filter === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
          En attente ({pendingCount})
        </button>
        <button onClick={() => setFilter('all')}
          className={cn('rounded-full px-4 py-1.5 text-xs font-medium', filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
          Tous ({reviews?.length ?? 0})
        </button>
      </div>

      <div className="space-y-3">
        {visible.length === 0 && <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">Aucun avis.</p>}
        {visible.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex" aria-label={`Note ${r.rating}/5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('h-3.5 w-3.5', i < r.rating ? 'fill-[#C9A961] text-[#C9A961]' : 'text-border')} aria-hidden />
                    ))}
                  </span>
                  <span className="font-medium">{r.author_name}</span>
                  {r.is_verified_purchase && <Badge variant="success">Achat vérifié</Badge>}
                  {r.is_demo && <Badge variant="muted">Démo</Badge>}
                  {r.is_approved ? <Badge variant="primary">Publié</Badge> : <Badge variant="warning">En attente</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.products ? String((r.products.name_translations as Record<string, string>)?.fr ?? r.products.slug) : 'Produit supprimé'} ·{' '}
                  {new Date(r.created_at).toLocaleDateString('fr-TN')}
                </p>
              </div>
              <div className="flex gap-1.5">
                {r.is_approved ? (
                  <button onClick={() => setApproved(r, false)} className="rounded-full border border-border p-2 transition hover:bg-muted" aria-label="Masquer">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <button onClick={() => setApproved(r, true)} className="rounded-full bg-emerald-600 p-2 text-white transition hover:bg-emerald-700" aria-label="Publier">
                    <Check className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <button onClick={() => remove(r)} className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            {r.title && <p className="mt-3 text-sm font-medium">{r.title}</p>}
            {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}