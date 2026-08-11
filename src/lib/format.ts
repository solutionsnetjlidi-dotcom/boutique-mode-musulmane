/** 89.5 → "89,50 DT" (section 41 : devise affichée DT) */
export function formatPrice(amount: number, currency = 'DT'): string {
  return `${amount.toFixed(2).replace('.', ',')} ${currency}`
}

/** Date lisible pour l'admin et les avis */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-TN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}