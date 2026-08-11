import { supabase } from '@/lib/supabase'
import type { OrderRow, ProductRow } from '@/types/database.types'

/** Section 75 : statistiques du dashboard. */
export interface DashboardStats {
  ordersToday: number
  ordersWeek: number
  ordersMonth: number
  revenueMonth: number
  revenueTotal: number
  avgOrder: number
  productsSold: number
  pendingOrders: number
  lowStock: ProductRow[]
  outOfStock: ProductRow[]
  bestSellers: ProductRow[]
  chart: { label: string; value: number }[]
  recentOrders: OrderRow[]
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [{ data: ordersRaw }, { data: productsRaw }] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('is_active', true),
  ])

  const orders = (ordersRaw ?? []) as OrderRow[]
  const products = (productsRaw ?? []) as ProductRow[]
  const valid = orders.filter((o) => o.status !== 'cancelled')

  const now = new Date()
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0)
  const startWeek = new Date(now); startWeek.setDate(now.getDate() - 6); startWeek.setHours(0, 0, 0, 0)
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  /* Graphique : commandes / jour sur 14 jours */
  const chart: { label: string; value: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    chart.push({
      label: d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' }),
      value: valid.filter((o) => o.created_at.slice(0, 10) === key).length,
    })
  }

  const revenueTotal = valid.reduce((s, o) => s + o.total, 0)

  return {
    ordersToday: valid.filter((o) => new Date(o.created_at) >= startToday).length,
    ordersWeek: valid.filter((o) => new Date(o.created_at) >= startWeek).length,
    ordersMonth: valid.filter((o) => new Date(o.created_at) >= startMonth).length,
    revenueMonth: valid.filter((o) => new Date(o.created_at) >= startMonth).reduce((s, o) => s + o.total, 0),
    revenueTotal,
    avgOrder: valid.length > 0 ? revenueTotal / valid.length : 0,
    productsSold: products.reduce((s, p) => s + p.sold_count, 0),
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold),
    outOfStock: products.filter((p) => p.stock <= 0),
    bestSellers: [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 5),
    chart,
    recentOrders: orders.slice(0, 6),
  }
}