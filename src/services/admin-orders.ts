import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import type { Json, OrderItemRow, OrderRow, OrderStatusHistoryRow } from '@/types/database.types'

export type AdminOrder = OrderRow & { order_items: { id: string }[] }
export type AdminOrderDetail = OrderRow & {
  order_items: OrderItemRow[]
  order_status_history: OrderStatusHistoryRow[]
}

export const ORDER_STATUSES = [
  'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Section 74 : libellés + couleurs des statuts. */
export const STATUS_META: Record<OrderStatus, { label: Json; className: string }> = {
  pending:   { label: { fr: 'En attente', en: 'Pending', ar: 'قيد الانتظار' }, className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: { fr: 'Confirmée', en: 'Confirmed', ar: 'مؤكدة' }, className: 'bg-blue-100 text-blue-700' },
  preparing: { label: { fr: 'En préparation', en: 'Preparing', ar: 'قيد التحضير' }, className: 'bg-purple-100 text-purple-700' },
  shipped:   { label: { fr: 'Expédiée', en: 'Shipped', ar: 'تم الشحن' }, className: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: { fr: 'Livrée', en: 'Delivered', ar: 'تم التسليم' }, className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: { fr: 'Annulée', en: 'Cancelled', ar: 'ملغاة' }, className: 'bg-red-100 text-red-700' },
  returned:  { label: { fr: 'Retournée', en: 'Returned', ar: 'مرتجعة' }, className: 'bg-slate-200 text-slate-700' },
}

/** Section 74 : actions autorisées selon le statut courant. */
export const STATUS_ACTIONS: Record<OrderStatus, { to: OrderStatus; label: Json; danger?: boolean }[]> = {
  pending: [
    { to: 'confirmed', label: { fr: 'Confirmer', en: 'Confirm', ar: 'تأكيد' } },
    { to: 'cancelled', label: { fr: 'Annuler', en: 'Cancel', ar: 'إلغاء' }, danger: true },
  ],
  confirmed: [
    { to: 'preparing', label: { fr: 'Préparer', en: 'Prepare', ar: 'تحضير' } },
    { to: 'cancelled', label: { fr: 'Annuler', en: 'Cancel', ar: 'إلغاء' }, danger: true },
  ],
  preparing: [
    { to: 'shipped', label: { fr: 'Expédier', en: 'Ship', ar: 'شحن' } },
    { to: 'cancelled', label: { fr: 'Annuler', en: 'Cancel', ar: 'إلغاء' }, danger: true },
  ],
  shipped: [
    { to: 'delivered', label: { fr: 'Livrer', en: 'Deliver', ar: 'تسليم' } },
  ],
  delivered: [
    { to: 'returned', label: { fr: 'Retour', en: 'Return', ar: 'إرجاع' }, danger: true },
  ],
  cancelled: [],
  returned: [],
}

export { formatDate } from '@/lib/format'

/** Section 74 : liste paginée + recherche + filtre statut. */
export async function fetchAdminOrders(opts: {
  status?: string; search?: string; page?: number; perPage?: number
} = {}): Promise<{ orders: AdminOrder[]; total: number }> {
  const perPage = opts.perPage ?? 10
  const from = ((opts.page ?? 1) - 1) * perPage

  let query = supabase
    .from('orders')
    .select('*, order_items(id)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (opts.status) query = query.eq('status', opts.status)
  if (opts.search && opts.search.trim()) {
    const s = opts.search.trim().replace(/[,()]/g, ' ')
    query = query.or(
      `order_number.ilike.%${s}%,customer_first_name.ilike.%${s}%,customer_last_name.ilike.%${s}%,customer_phone.ilike.%${s}%`,
    )
  }

  const { data, error, count } = await query.range(from, from + perPage - 1)
  if (error) throw error
  return { orders: (data ?? []) as unknown as AdminOrder[], total: count ?? 0 }
}

export async function fetchStatusCounts(): Promise<Record<string, number>> {
  const { data } = await supabase.from('orders').select('status')
  const counts: Record<string, number> = {}
  ;(data ?? []).forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1 })
  return counts
}

export async function fetchAdminOrderDetail(id: string): Promise<AdminOrderDetail | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_status_history(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as unknown as AdminOrderDetail | null
}

/** Section 74 : transition validée côté serveur + restock + audit (RPC set_order_status). */
export async function setOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  const { data, error } = await supabase.rpc('set_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_note: note ?? null,
  })
  if (error) throw error
  return data as { ok: boolean; order_number: string; status: string }
}

export async function markOrderPaid(orderId: string, orderNumber: string) {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
  if (error) throw error
  await logAudit('update', 'orders', orderId, { payment_status: 'paid', order_number: orderNumber })
}