import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database.types'

type SettingsMap = Record<string, Json>

function parse(data: { key: string; value: Json }[] | null): SettingsMap {
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
}

let realtimeStarted = false
function startSettingsRealtime() {
  if (realtimeStarted) return
  realtimeStarted = true
  supabase
    .channel('site-settings-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'site_settings' },
      () => window.dispatchEvent(new Event('boutique:settings-changed')),
    )
    .subscribe()
}

/** Section 103 : paramètres toujours à jour — temps réel + retour d'onglet. */
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
    startSettingsRealtime()

    const onChanged = () => fetchSettings()
    window.addEventListener('boutique:settings-changed', onChanged)
    window.addEventListener('focus', onChanged)
    return () => {
      mounted = false
      window.removeEventListener('boutique:settings-changed', onChanged)
      window.removeEventListener('focus', onChanged)
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