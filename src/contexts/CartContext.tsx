import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Json, ProductRow, VariantRow } from '@/types/database.types'

const STORAGE_KEY = 'boutique:cart'

export interface CartItem {
  key: string
  product_id: string
  variant_id: string | null
  slug: string
  name_translations: Json
  image: string | null
  unit_price: number
  attributes: Record<string, string>
  quantity: number
  max_stock: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (product: ProductRow, variant?: VariantRow | null, quantity?: number) => boolean
  removeItem: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('cart:changed'))
  }, [items])

  /** Section 35 : jamais de quantité au-delà du stock disponible */
  const addItem = useCallback((product: ProductRow, variant?: VariantRow | null, quantity = 1): boolean => {
    const maxStock = variant ? variant.stock : product.stock
    if (maxStock <= 0) return false

    const key = `${product.id}:${variant?.id ?? 'default'}`
    const price = variant?.price ?? product.base_price
    const attrs = (variant?.attributes ?? {}) as Record<string, string>

    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, maxStock) }
            : i,
        )
      }
      return [...prev, {
        key,
        product_id: product.id,
        variant_id: variant?.id ?? null,
        slug: product.slug,
        name_translations: product.name_translations,
        image: variant?.image_url ?? product.main_image_url,
        unit_price: price,
        attributes: attrs,
        quantity: Math.min(quantity, maxStock),
        max_stock: maxStock,
      }]
    })

    // Section 42 : ouvre automatiquement le Mini Cart drawer après l'ajout
    window.dispatchEvent(new CustomEvent('cart:item-added'))
    return true
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: Math.min(Math.max(quantity, 1), i.max_stock) } : i))
        .filter((i) => i.quantity > 0),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
    addItem, removeItem, setQuantity, clearCart,
  }), [items, addItem, removeItem, setQuantity, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>')
  return ctx
}