import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/common/Toaster'
import { formatPrice } from '@/lib/format'
import { downloadOrderPdf } from '@/lib/order-pdf'
import { cn } from '@/lib/utils'

const STATUSES = [
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmée' },
  { key: 'processing', label: 'En préparation' },
  { key: 'shipped', label: 'Expédiée' },
  { key: 'delivered', label: 'Livrée' },
  { key: 'cancelled', label: 'Annulée' },
]

/** Détail de commande + changement de statut + export PDF (section 76) */
export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setOrder(data)
          setItems((data.order_items ?? []) as any[])
        }
        setLoading(false)
      })
  }, [id])

  const setStatus = async (status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) {
      toast(error.message)
      return
    }
    await supabase.from('order_status_history').insert({
      order_id: id,
      from_status: order.status,
      to_status: status,
      note: 'Mise à jour admin',
    })
    setOrder({ ...order, status })
    toast('Statut mis à jour ✓')
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (!order) return <p className="py-20 text-center text-sm text-muted-foreground">Commande introuvable.</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/orders" className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /> Retour aux commandes
          </Link>
          <h1 className="font-display text-3xl">Commande {order.order_number}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString('fr-FR')} · {order.payment_method === 'cod' ? 'Paiement à la livraison' : order.payment_method}
          </p>
        </div>

        {/* ===== BOUTON PDF ===== */}
        <Button variant="outline" onClick={() => downloadOrderPdf(order, items)}>
          <FileDown className="h-4 w-4" aria-hidden /> Télécharger PDF
        </Button>
      </div>

      {/* Statuts */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(s.key)}
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-medium transition',
              order.status === s.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Articles */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-4 font-display text-lg">Articles</p>
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                {it.image_url && <img src={it.image_url} alt="" className="h-16 w-12 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.variant_attributes ? Object.values(it.variant_attributes).filter((v) => typeof v === 'string').join(' / ') : '—'} · Qté : {it.quantity}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium price-ltr">{formatPrice(Number(it.total))}</p>
                  <p className="text-xs text-muted-foreground price-ltr">{formatPrice(Number(it.unit_price))} / unité</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cliente + totaux */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 font-display text-lg">Cliente</p>
            <p className="text-sm font-medium">{order.customer_first_name} {order.customer_last_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">📞 {order.customer_phone}</p>
            {order.customer_whatsapp && <p className="text-sm text-muted-foreground">💬 WA : {order.customer_whatsapp}</p>}
            {order.customer_email && <p className="text-sm text-muted-foreground">✉️ {order.customer_email}</p>}
            <p className="mt-2 text-sm text-muted-foreground">📍 {order.address}, {order.city} ({order.zone_name})</p>
            {order.order_comment && <p className="mt-2 rounded-lg bg-muted p-2 text-xs italic">{order.order_comment}</p>}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 font-display text-lg">Totaux</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span className="price-ltr">{formatPrice(Number(order.subtotal))}</span></div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Remise {order.coupon_code ? `(${order.coupon_code})` : ''}</span><span className="price-ltr">-{formatPrice(Number(order.discount_amount))}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span className="price-ltr">{formatPrice(Number(order.shipping_fee))}</span></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><span>Total</span><span className="price-ltr">{formatPrice(Number(order.total))}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}