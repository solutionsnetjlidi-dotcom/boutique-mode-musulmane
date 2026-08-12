import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Heart, Menu, MessageCircle, Moon, ShoppingBag, Sun, User, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { getWishlist } from '@/lib/wishlist'
import SmartSearch from '@/components/shop/SmartSearch'

interface NavItem {
  id: string
  label_translations: { fr: string; en: string; ar: string }
  url: string
  sort_order: number
}

/* ===== Mode sombre (tout inclus ici, rien d'autre à modifier) ===== */
function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem('boutique:dark') === '1' } catch { return false }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  const toggle = () => {
    setDark((d) => {
      const next = !d
      try { localStorage.setItem('boutique:dark', next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }
  return { dark, toggle }
}

function DarkToggle() {
  const { dark, toggle } = useDarkMode()
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Mode clair' : 'Mode sombre'}
      className="rounded-full p-2 transition hover:bg-accent"
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  )
}

export default function Header() {
  const { lang, setLang } = useLanguage()
  const cart = useCart() as any
  const cartCount: number = cart.count ?? cart.items?.length ?? 0
  const settings = useSiteSettings()
  const whatsappNumber = settingString(settings, 'whatsapp_number')
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [announce, setAnnounce] = useState<{ id: string; text_translations: any } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [wishCount, setWishCount] = useState(0)

  useEffect(() => {
    supabase
      .from('navigation_items').select('*')
      .eq('is_active', true).eq('menu_location', 'main')
      .order('sort_order')
      .then(({ data }) => setNavItems((data ?? []) as NavItem[]))
    supabase
      .from('announcement_bars').select('*')
      .eq('is_active', true).order('sort_order').limit(1)
      .then(({ data }) => setAnnounce(data?.[0] ?? null))
    setWishCount(getWishlist().length)
  }, [])

  const brand = translate(settings?.brand_name as any, lang, 'ESTABRAK')
  const nextLang = () => setLang(lang === 'fr' ? 'en' : lang === 'en' ? 'ar' : 'fr')
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` : null

  return (
    <header className="sticky top-0 z-50">
      {announce && (
        <div className="bg-primary py-2 text-center text-xs font-medium text-primary-foreground">
          {translate(announce.text_translations, lang)}
        </div>
      )}

      <div className="border-b border-border bg-background/90 backdrop-blur">
        <div className="container flex items-center justify-between gap-3 py-4">
          <button className="rounded-full p-2 hover:bg-accent md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <Link to="/" className="font-display text-2xl tracking-[0.25em]">{brand}</Link>

          <div className="flex items-center gap-1">
            {/* 🔍 Recherche intelligente */}
            <SmartSearch />
            {/* 🌙 Mode sombre */}
            <DarkToggle />
            <button onClick={nextLang} className="flex items-center gap-1 rounded-full p-2 transition hover:bg-accent" aria-label="Changer de langue">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z" />
              </svg>
              <span className="text-xs font-semibold uppercase">{lang}</span>
            </button>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hidden rounded-full p-2 transition hover:bg-accent sm:block" aria-label="WhatsApp">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </a>
            )}
            <Link to="/account" className="hidden rounded-full p-2 transition hover:bg-accent sm:block" aria-label="Compte">
              <User className="h-5 w-5" aria-hidden />
            </Link>
            <Link to="/wishlist" className="relative rounded-full p-2 transition hover:bg-accent" aria-label="Wishlist">
              <Heart className="h-5 w-5" aria-hidden />
              {wishCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{wishCount}</span>
              )}
            </Link>
            <Link to="/cart" className="relative rounded-full p-2 transition hover:bg-accent" aria-label="Panier">
              <ShoppingBag className="h-5 w-5" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>

        <nav className="hidden justify-center gap-7 pb-3 text-xs uppercase tracking-[0.18em] md:flex" aria-label="Navigation principale">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.url}
              className={({ isActive }) => cn('transition hover:text-primary', isActive ? 'text-primary' : 'text-muted-foreground')}
            >
              {translate(item.label_translations, lang)}
            </NavLink>
          ))}
        </nav>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] bg-black/40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-72 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-xl">{brand}</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Fermer"><X className="h-5 w-5" aria-hidden /></button>
            </div>
            <nav className="flex flex-col gap-4 text-sm" aria-label="Navigation mobile">
              {navItems.map((item) => (
                <Link key={item.id} to={item.url} onClick={() => setMobileOpen(false)} className="py-1 transition hover:text-primary">
                  {translate(item.label_translations, lang)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}