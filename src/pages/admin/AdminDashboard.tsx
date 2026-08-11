import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Banknote, CalendarDays, Package, TrendingUp } from 'lucide-react'
import { fetchDashboardStats } from '@/services/admin-stats'
import type { DashboardStats } from '@/services/admin-stats'
import { formatDate, STATUS_META } from '@/services/admin-orders'
import type { OrderStatus } from '@/services/admin-orders'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof Package; label: string; value: string; accent?: boolean
}) {
  return (
    <div className={cn('rounded-2xl border p-5', accent ? 'border-amber-200 bg-amber-50' : 'border-border bg-card')}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  )
}

function OrdersBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Commandes par jour (14 derniers jours)">
        {data.map((d) => (
          <div key={d.label} className="flex h-full flex-1 flex-col justify-end" title={`${d.label} : ${d.value} commande(s)`}>
            <div
              className="rounded-t bg-primary/85 transition hover:bg-primary"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 text-center text-[8px] text-muted-foreground">
            {i % 2 === 0 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Section 75 : statistiques du dashboard. */
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(() => setStats(null))
  }, [])

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble de la boutique (section 75)</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Commandes aujourd'hui" value={String(stats.ordersToday)} />
        <StatCard icon={CalendarDays} label="Cette semaine" value={String(stats.ordersWeek)} />
        <StatCard icon={CalendarDays} label="Ce mois" value={String(stats.ordersMonth)} />
        <StatCard icon={Banknote} label="CA du mois" value={formatPrice(stats.revenueMonth)} />
        <StatCard icon={Banknote} label="CA total" value={formatPrice(stats.revenueTotal)} />
        <StatCard icon={TrendingUp} label="Panier moyen" value={formatPrice(stats.avgOrder)} />
        <StatCard icon={Package} label="Produits vendus" value={String(stats.productsSold)} />
        <StatCard icon={AlertTriangle} label="En attente" value={String(stats.pendingOrders)} accent={stats.pendingOrders > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-4 font-display text-lg">Commandes — 14 derniers jours</p>
          <OrdersBarChart data={stats.chart} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg">Alertes stock</p>
            <Link to="/admin/stock" className="text-xs text-primary underline underline-offset-2">Gérer le stock →</Link>
          </div>
          {stats.outOfStock.length === 0 && stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte — tout est en stock ✓</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.outOfStock.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                  <span>{translate(p.name_translations, 'fr')}</span>
                  <span className="text-xs font-semibold text-red-600">Rupture</span>
                </li>
              ))}
              {stats.lowStock.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                  <span>{translate(p.name_translations, 'fr')}</span>
                  <span className="text-xs font-semibold text-amber-600">Stock faible ({p.stock})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-4 font-display text-lg">Best Sellers</p>
          <ol className="space-y-3">
            {stats.bestSellers.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <img src={p.main_image_url ?? undefined} alt="" className="h-10 w-8 rounded-lg bg-muted object-cover" />
                <span className="flex-1">{translate(p.name_translations, 'fr')}</span>
                <span className="text-xs text-muted-foreground">{p.sold_count} vendus</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg">Commandes récentes</p>
            <Link to="/admin/orders" className="text-xs text-primary underline underline-offset-2">Tout voir →</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-muted">
                    <span>
                      <span className="font-mono text-xs font-semibold text-primary">{o.order_number}</span>
                      <span className="ml-2 text-muted-foreground">{formatDate(o.created_at)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold price-ltr">{formatPrice(o.total)}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', STATUS_META[o.status as OrderStatus]?.className)}>
                        {translate(STATUS_META[o.status as OrderStatus]?.label, 'fr')}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}