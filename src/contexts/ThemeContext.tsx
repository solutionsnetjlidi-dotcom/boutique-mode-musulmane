import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import type { ThemeRow } from '@/types/database.types'

const STORAGE_KEY = 'boutique:theme-slug'

const VAR_MAP: Record<string, string> = {
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  badge: '--badge',
  badgeForeground: '--badge-foreground',
  border: '--border',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
}

/** Convertit "#C8A2A0" → "350 30% 71%" (format attendu par Tailwind hsl()) */
function hexToHslChannels(hex: string): string | null {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Applique les couleurs d'un thème sur :root (accepte hex ou HSL) */
export function applyThemeColors(colors: Record<string, unknown>): void {
  const root = document.documentElement
  for (const [key, cssVar] of Object.entries(VAR_MAP)) {
    const value = colors[key]
    if (typeof value === 'string' && value.trim() !== '') {
      const v = value.trim()
      root.style.setProperty(cssVar, v.startsWith('#') ? (hexToHslChannels(v) ?? v) : v)
    }
  }
}

interface ThemeContextValue {
  themes: ThemeRow[]
  activeTheme: ThemeRow | null
  loading: boolean
  applyTheme: (theme: ThemeRow) => void
  setDefaultTheme: (theme: ThemeRow) => Promise<void>
  toggleThemeActive: (theme: ThemeRow) => Promise<void>
  refreshThemes: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themes, setThemes] = useState<ThemeRow[]>([])
  const [activeTheme, setActiveTheme] = useState<ThemeRow | null>(null)
  const [loading, setLoading] = useState(true)

  const applyTheme = useCallback((theme: ThemeRow) => {
    applyThemeColors((theme.colors ?? {}) as Record<string, unknown>)
    setActiveTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme.slug)
    } catch {
      /* navigation privée */
    }
  }, [])

  const refreshThemes = useCallback(async () => {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error || !data) {
      setLoading(false)
      return
    }

    setThemes(data)

    let stored: string | null = null
    try {
      stored = localStorage.getItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }

    const target =
      data.find((t) => t.slug === stored && t.is_active) ??
      data.find((t) => t.is_default && t.is_active) ??
      data.find((t) => t.is_active) ??
      null

    if (target) {
      applyThemeColors((target.colors ?? {}) as Record<string, unknown>)
    }
    setActiveTheme(target)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refreshThemes()
  }, [refreshThemes])

  /* ===== TEMPS RÉEL : tout changement de thème en base = application instantanée ===== */
  useEffect(() => {
    const channel = supabase
      .channel('themes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'themes' },
        () => void refreshThemes(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshThemes])

  const setDefaultTheme = useCallback(async (theme: ThemeRow) => {
    const { error: unsetError } = await supabase
      .from('themes')
      .update({ is_default: false })
      .eq('is_default', true)
    if (unsetError) throw unsetError

    const { error } = await supabase
      .from('themes')
      .update({ is_default: true })
      .eq('id', theme.id)
    if (error) throw error

    applyTheme(theme)
    await logAudit('theme_change', 'themes', theme.id, { slug: theme.slug, action: 'set_default' })
    await refreshThemes()
  }, [applyTheme, refreshThemes])

  const toggleThemeActive = useCallback(async (theme: ThemeRow) => {
    const { error } = await supabase
      .from('themes')
      .update({ is_active: !theme.is_active })
      .eq('id', theme.id)
    if (error) throw error

    await logAudit('theme_change', 'themes', theme.id, {
      slug: theme.slug,
      action: theme.is_active ? 'disable' : 'enable',
    })
    await refreshThemes()
  }, [refreshThemes])

  const value = useMemo<ThemeContextValue>(() => ({
    themes, activeTheme, loading,
    applyTheme, setDefaultTheme, toggleThemeActive, refreshThemes,
  }), [themes, activeTheme, loading, applyTheme, setDefaultTheme, toggleThemeActive, refreshThemes])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme doit être utilisé à l’intérieur de <ThemeProvider>')
  return ctx
}