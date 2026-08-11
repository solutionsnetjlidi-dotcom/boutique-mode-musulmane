import type { Json } from '@/types/database.types'

export type Language = 'fr' | 'en' | 'ar'

/**
 * Section 62 — Résolution d'une traduction JSONB.
 * Fallback : langue demandée → FR → première valeur disponible → fallback fourni.
 * Ne jamais afficher undefined / null / clé technique.
 */
export function translate(
  translations: Json | null | undefined,
  lang: Language,
  fallback = '',
): string {
  if (!translations || typeof translations !== 'object' || Array.isArray(translations)) {
    return fallback
  }

  const dict = translations as Record<string, unknown>

  const pick = (code: string): string | null => {
    const value = dict[code]
    return typeof value === 'string' && value.trim() !== '' ? value : null
  }

  const direct = pick(lang)
  if (direct !== null) return direct

  // Section 62 : fallback AR → FR, EN → FR.
  // En développement, on signale les trous pour aider à compléter les traductions.
  if (import.meta.env.DEV) {
    console.debug(`[i18n] Traduction « ${lang} » manquante → fallback FR`, dict)
  }

  return (
    pick('fr') ??
    Object.values(dict).find(
      (v): v is string => typeof v === 'string' && v.trim() !== '',
    ) ??
    fallback
  )
}