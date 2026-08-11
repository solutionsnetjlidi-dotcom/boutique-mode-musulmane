import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database.types'

type SettingsMap = Record<string, Json>

function parse(data: { key: string; value: Json }[] | null): SettingsMap {
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
}

/** Section 103 : les paramètres viennent TOUJOURS de Supabase, jamais en cache périmé. */
export function useSiteSettings(): SettingsMap | null {
  const [settings, setSettings] = useState<SettingsMap | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchSettings = () => {
      supabase
        .from('site_settings')
        .select('key, value')
        .then(({ data }) => {
          if (mounted) setSettings(parse(data))
        })
        .catch(() => undefined)
    }

    fetchSettings()

    // Se rafraîchit automatiquement quand on revient sur l'onglet (changement admin visible immédiatement)
    window.addEventListener('focus', fetchSettings)
    return () => {
      mounted = false
      window.removeEventListener('focus', fetchSettings)
    }
  }, [])

  return settings
}

export function settingString(s: SettingsMap | null, key: string, fallback = ''): string {
  const v = s?.[key]
  return typeof v === 'string' ? v : fallback
}

export function settingNumber(s: SettingsMap | null, key: string, fallback = 0): number {
  const v = s?.[key]
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : fallback
}