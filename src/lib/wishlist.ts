/**
 * Section 24 — Visiteuse : wishlist locale.
 * La fusion avec Supabase à la connexion est prévue en extension.
 */
const KEY = 'boutique:wishlist'

export function getWishlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function isWishlisted(productId: string): boolean {
  return getWishlist().includes(productId)
}

/** Retourne true si le produit est maintenant dans la wishlist */
export function toggleWishlist(productId: string): boolean {
  const list = getWishlist()
  const next = list.includes(productId)
    ? list.filter((id) => id !== productId)
    : [...list, productId]
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* mode privé */
  }
  window.dispatchEvent(new CustomEvent('wishlist:changed'))
  return next.includes(productId)
}