import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Language } from '@/lib/translations'
import type { LanguageRow } from '@/types/database.types'

const STORAGE_KEY = 'boutique:lang'

interface LanguageContextValue {
  lang: Language
  dir: 'ltr' | 'rtl'
  languages: LanguageRow[]
  setLang: (code: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<LanguageRow[]>([])
  const [lang, setLangState] = useState<Language>('fr')

  // Chargement des langues actives (section 61 : une langue désactivée disparaît du site)
  useEffect(() => {
    supabase
      .from('languages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (!data) return
        setLanguages(data)
        let stored: string | null = null
        try { stored = localStorage.getItem(STORAGE_KEY) } catch { /* ignore */ }
        const initial =
          (stored && data.find((l) => l.code === stored)?.code as Language) ||
          (data.find((l) => l.is_default)?.code as Language) || 'fr'
        setLangState(initial)
      })
  }, [])

  // Application RTL / LTR + attribut lang (section 60)
  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = lang
  }, [lang])

  // Section 61 : si la langue courante est désactivée par l'admin → langue par défaut
  useEffect(() => {
    if (languages.length === 0) return
    if (!languages.some((l) => l.code === lang)) {
      const def = languages.find((l) => l.is_default) ?? languages[0]
      if (def) setLangState(def.code as Language)
    }
  }, [languages, lang])

  const setLang = useCallback((code: Language) => {
    setLangState(code)
    try { localStorage.setItem(STORAGE_KEY, code) } catch { /* ignore */ }
  }, [])

  const value = useMemo(() => ({
    lang,
    dir: lang === 'ar' ? 'rtl' as const : 'ltr' as const,
    languages,
    setLang,
  }), [lang, languages, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage doit être utilisé dans <LanguageProvider>')
  return ctx
}