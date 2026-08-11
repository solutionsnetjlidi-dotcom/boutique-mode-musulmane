import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import {
  fetchAdminOrders, fetchStatusCounts, formatDate, ORDER_STATUSES, STATUS_META,
} from '@/services/admin-orders'
import type { AdminOrder, OrderStatus } from '@/services/admin-orders'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PER_PAGE = 10

/** Section 74 : gestion des commandes — liste, filtres, recherche, pagination. */
export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, c] = await Promise.all([
        fetchAdminOrders({ status: status === 'all' ? undefined : status, search, page, perPage: PER_PAGE }),
        fetchStatusCounts(),
      ])
      setOrders(res.orders)
      setTotal(res.total)
      setCounts(c)
    } finally {
      setLoading(false)
    }
  }, [status, search, page])

  useEffect(() => { void load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Commandes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} commande(s) au total</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="N° commande, cliente, téléphone…"
            className="h-10 w-72 rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none transition focus:border-primary"
            aria-label="Rechercher une commande"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
        <button
          role="tab" aria-selected={status === 'all'}
          onClick={() => { setStatus('all'); setPage(1) }}
          className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition',
            status === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}
        >
          Toutes
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            role="tab" aria-selected={status === s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition',
              status === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}
          >
            {translate(STATUS_META[s].label, 'fr')} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Articles</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"><span className="sr-only">Détail</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  Aucune commande trouvée.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="transition hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-primary">
                      {o.order_number}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{formatDate(o.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer_first_name} {o.customer_last_name}</p>
                    <p className="text-[11px] text-muted-foreground">{o.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3">{o.order_items.length}</td>
                  <td className="px-4 py-3 font-semibold price-ltr">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3 text-xs">{o.zone_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase',
                      o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}
                    >
                      {o.payment_status === 'paid' ? 'Payée' : 'COD'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase', STATUS_META[o.status as OrderStatus]?.className)}>
                      {translate(STATUS_META[o.status as OrderStatus]?.label, 'fr')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/orders/${o.id}`} className="text-xs text-primary underline underline-offset-2">
                      Gérer →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Page précédente">←</Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Page suivante">→</Button>
        </div>
      )}
    </div>
  )
}