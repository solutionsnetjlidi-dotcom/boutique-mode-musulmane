import { useEffect, useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/services/admin-orders'
import { formatPrice } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import type { OrderRow } from '@/types/database.types'

interface CustomerAgg {
  name: string
  phone: string
  whatsapp: string | null
  email: string | null
  city: string | null
  orders: number
  total: number
  lastOrder: string
}

/** Clientes (invitées incluses), agrégées depuis les commandes. */
export default function AdminCustomers() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as OrderRow[]))
      .catch(() => setOrders([]))
  }, [])

  const customers = useMemo(() => {
    const map = new Map<string, CustomerAgg>()
    for (const o of orders ?? []) {
      const key = o.customer_phone
      const existing = map.get(key)
      if (existing) {
        existing.orders += 1
        existing.total += o.total
        if (o.created_at > existing.lastOrder) {
          existing.lastOrder = o.created_at
          existing.name = `${o.customer_first_name} ${o.customer_last_name}`
          existing.city = o.city
        }
      } else {
        map.set(key, {
          name: `${o.customer_first_name} ${o.customer_last_name}`,
          phone: o.customer_phone,
          whatsapp: o.customer_whatsapp,
          email: o.customer_email,
          city: o.city,
          orders: 1,
          total: o.total,
          lastOrder: o.created_at,
        })
      }
    }
    const q = search.trim().toLowerCase()
    return [...map.values()]
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => b.total - a.total)
  }, [orders, search])

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {customers.length} cliente(s) unique(s) — invitées incluses
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou téléphone…"
          className="h-10 w-72 rounded-full border border-border bg-card px-4 text-sm outline-none transition focus:border-primary"
          aria-label="Rechercher une cliente"
        />
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Commandes</th>
              <th className="px-4 py-3">Total dépensé</th>
              <th className="px-4 py-3">Dernière commande</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders === null ? (
              <tr><td colSpan={6} className="px-4 py-4"><Skeleton className="h-8 w-full" /></td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Aucune cliente.</td></tr>
            ) : (
              customers.map((c) => {
                const number = (c.whatsapp ?? c.phone).replace(/[^0-9]/g, '')
                return (
                  <tr key={c.phone} className="transition hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{c.phone}</span>
                        {number && (
                          <a
                            href={`https://wa.me/${number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-emerald-50 p-1.5 text-emerald-600 transition hover:bg-emerald-100"
                            aria-label={`WhatsApp ${c.name}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        )}
                      </div>
                      {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3">{c.city ?? '—'}</td>
                    <td className="px-4 py-3">{c.orders}</td>
                    <td className="px-4 py-3 font-semibold price-ltr">{formatPrice(c.total)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.lastOrder)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}