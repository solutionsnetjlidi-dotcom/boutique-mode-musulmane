import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, MessageCircle, Package, X } from 'lucide-react'
import {
  fetchAdminOrderDetail, formatDate, markOrderPaid, setOrderStatus,
  STATUS_ACTIONS, STATUS_META,
} from '@/services/admin-orders'
import type { AdminOrderDetail, OrderStatus } from '@/services/admin-orders'
import { translate } from '@/lib/translations'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/common/Toaster'
import { cn } from '@/lib/utils'

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered']

/** Section 74 : timeline des statuts. */
function StatusTimeline({ status }: { status: OrderStatus }) {
  const aborted = status === 'cancelled' || status === 'returned'
  const currentIdx = FLOW.indexOf(status)

  return (
    <ol className="flex items-center gap-1" aria-label="Progression de la commande">
      {FLOW.map((s, i) => {
        const done = !aborted && i <= currentIdx
        const isCurrent = !aborted && i === currentIdx
        return (
          <li key={s} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : done ? 'bg-primary' : 'bg-border')} aria-hidden />
              <span
                className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition',
                  done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground',
                  isCurrent && 'ring-4 ring-primary/20')}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {done && !isCurrent ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn('h-0.5 flex-1', i === FLOW.length - 1 ? 'bg-transparent' : i < currentIdx && !aborted ? 'bg-primary' : 'bg-border')} aria-hidden />
            </div>
            <span className={cn('text-[10px] uppercase tracking-wide', done ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
              {translate(STATUS_META[s].label, 'fr')}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default function AdminOrderDetailPage() {
  const { id = '' } = useParams()
  const [order, setOrder] = useState<AdminOrderDetail | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setOrder(undefined)
    try {
      setOrder(await fetchAdminOrderDetail(id))
    } catch {
      setOrder(null)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  const handleAction = async (to: OrderStatus) => {
    if (!order) return
    setBusy(true)
    try {
      await setOrderStatus(order.id, to)
      toast(`Commande ${order.order_number} → ${translate(STATUS_META[to].label, 'fr')} ✓`)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible')
    } finally {
      setBusy(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!order) return
    setBusy(true)
    try {
      await markOrderPaid(order.id, order.order_number)
      toast('Commande marquée payée ✓')
      await load()
    } catch {
      toast('Impossible de mettre à jour le paiement')
    } finally {
      setBusy(false)
    }
  }

  if (order === undefined) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (order === null) return <p className="py-20 text-center text-sm text-muted-foreground">Commande introuvable.</p>

  const meta = STATUS_META[order.status as OrderStatus]
  const actions = STATUS_ACTIONS[order.status as OrderStatus] ?? []
  const aborted = order.status === 'cancelled' || order.status === 'returned'

  const customerNumber = (order.customer_whatsapp ?? order.customer_phone ?? '').replace(/[^0-9]/g, '')
  const waMessage = encodeURIComponent(
    `Bonjour ${order.customer_first_name}, votre commande #${order.order_number} (${formatPrice(order.total)}) est « ${translate(meta.label, 'fr')} ». Merci pour votre confiance !`,
  )

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/orders" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /> Retour aux commandes
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold">{order.order_number}</h1>
            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase', meta.className)}>
              {translate(meta.label, 'fr')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Passée le {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <StatusTimeline status={order.status as OrderStatus} />
        {aborted && (
          <p className={cn('mt-4 rounded-lg px-4 py-2.5 text-sm',
            order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600')}
          >
            {order.status === 'cancelled'
              ? 'Commande annulée — le stock a été restitué automatiquement.'
              : 'Commande retournée — le stock a été réintégré automatiquement.'}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Articles (snapshot — section 46) */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <p className="border-b border-border px-6 py-4 font-display text-lg">
              Articles <span className="text-sm text-muted-foreground">(snapshot figé à la commande)</span>
            </p>
            <div className="divide-y divide-border">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <img src={item.image_url ?? undefined} alt="" className="h-16 rounded-lg bg-muted object-cover" style={{ width: '3.25rem' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.product_sku ?? '—'}
                      {Object.entries((item.variant_attributes ?? {}) as Record<string, string>)
                        .filter(([k]) => k !== 'hex')
                        .map(([k, v]) => ` · ${k}: ${v}`).join('')}
                    </p>
                    {item.discount_amount > 0 && (
                      <p className="text-xs text-emerald-600 price-ltr">Remise : -{formatPrice(item.discount_amount)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground price-ltr">{item.quantity} × {formatPrice(item.unit_price)}</p>
                    <p className="text-sm font-semibold price-ltr">{formatPrice(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
            <dl className="space-y-1.5 border-t border-border px-6 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Sous-total</dt><dd className="price-ltr">{formatPrice(order.subtotal)}</dd></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Remise {order.coupon_code ? `(${order.coupon_code})` : ''}</dt>
                  <dd className="price-ltr">-{formatPrice(order.discount_amount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Livraison ({order.zone_name ?? '—'})</dt>
                <dd className="price-ltr">{order.shipping_fee === 0 ? 'Gratuite' : formatPrice(order.shipping_fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt><dd className="price-ltr">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          {/* Historique */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-4 font-display text-lg">Historique des statuts</p>
            {order.order_status_history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun changement de statut pour le moment.</p>
            ) : (
              <ol className="space-y-3">
                {order.order_status_history.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 text-sm">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                    <span className="text-muted-foreground">{formatDate(h.created_at)}</span>
                    <span>
                      {h.from_status && (
                        <span className="text-muted-foreground">
                          {translate(STATUS_META[h.from_status as OrderStatus]?.label, 'fr')} →{' '}
                        </span>
                      )}
                      <span className="font-medium">{translate(STATUS_META[h.to_status as OrderStatus]?.label, 'fr')}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-4 font-display text-lg">Actions</p>
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune action disponible pour ce statut.</p>
            ) : (
              <div className="space-y-2">
                {actions.map((a, i) => (
                  <Button
                    key={a.to}
                    variant={a.danger ? 'outline' : i === 0 ? 'default' : 'outline'}
                    className={cn('w-full', a.danger && 'text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700')}
                    disabled={busy}
                    onClick={() => handleAction(a.to)}
                  >
                    {a.danger ? <X className="h-4 w-4" aria-hidden /> : <Package className="h-4 w-4" aria-hidden />}
                    {translate(a.label, 'fr')}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 font-display text-lg">Cliente</p>
            <p className="font-medium">{order.customer_first_name} {order.customer_last_name}</p>
            <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
            {order.customer_email && <p className="text-sm text-muted-foreground">{order.customer_email}</p>}
            <p className="mt-2 text-sm text-muted-foreground">
              {order.address}{order.address_complement ? `, ${order.address_complement}` : ''}<br />
              {order.city} — {order.zone_name}
            </p>
            {order.order_comment && (
              <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs italic">« {order.order_comment} »</p>
            )}
            {customerNumber && (
              <Button variant="outline" className="mt-4 w-full" asChild>
                <a href={`https://wa.me/${customerNumber}?text=${waMessage}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" aria-hidden /> Contacter sur WhatsApp
                </a>
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 font-display text-lg">Paiement</p>
            <p className="text-sm">Méthode : <span className="font-medium uppercase">{order.payment_method}</span></p>
            <p className="mt-1 text-sm">
              Statut :{' '}
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}
              >
                {order.payment_status === 'paid' ? 'Payée' : 'Non payée'}
              </span>
            </p>
            {order.payment_status === 'unpaid' && (
              <Button variant="outline" className="mt-4 w-full" onClick={handleMarkPaid} disabled={busy}>
                <Check className="h-4 w-4" aria-hidden /> Marquer payée (encaissée à la livraison)
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}