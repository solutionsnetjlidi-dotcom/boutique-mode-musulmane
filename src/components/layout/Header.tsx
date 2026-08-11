import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Heart, Menu, Search, ShoppingBag, User, X, Globe, MessageCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { getWishlist } from '@/lib/wishlist'
import { translate } from '@/lib/translations'
import type { Language } from '@/lib/translations'
import type { AnnouncementRow, NavItemRow } from '@/types/database.types'
import { cn } from '@/lib/utils'
import SearchOverlay from '@/components/layout/SearchOverlay'

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null
  return (
    <span
      aria-label={label}
      className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-badge px-1 text-[10px] font-semibold text-badge-foreground"
    >
      {count}
    </span>
  )
}

/** Sections 7-10 : announcement bar + header desktop + menu mobile + barre basse. */
export default function Header() {
  const { lang, languages, setLang } = useLanguage()
  const settings = useSiteSettings()
  const { count } = useCart()
  const [wishlistCount, setWishlistCount] = useState(0)
  const [navItems, setNavItems] = useState<NavItemRow[]>([])
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const brand = translate(settings?.brand_name, lang, 'Maison Noura')

  useEffect(() => {
    supabase.from('navigation_items').select('*')
      .eq('menu_location', 'main').eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setNavItems((data ?? []) as NavItemRow[]))
    supabase.from('announcement_bars').select('*')
      .eq('is_active', true).order('sort_order').limit(1)
      .then(({ data }) => setAnnouncement(((data ?? []) as AnnouncementRow[])[0] ?? null))
  }, [])

  useEffect(() => {
    const update = () => setWishlistCount(getWishlist().length)
    update()
    window.addEventListener('wishlist:changed', update)
    return () => window.removeEventListener('wishlist:changed', update)
  }, [])

  const whatsapp = settingString(settings, 'whatsapp_number')

  return (
    <>
      {/* TOP ANNOUNCEMENT BAR (section 7) */}
      {announcement && (
        <div className="bg-primary px-4 py-2 text-center text-xs font-medium tracking-wide text-primary-foreground">
          {translate(announcement.text_translations, lang)}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        {/* Ligne principale */}
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-full p-2 transition hover:bg-muted md:hidden"
              aria-label={translate({ fr: 'Ouvrir le menu', en: 'Open menu', ar: 'فتح القائمة' }, lang)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <Link to="/" className="font-display text-xl tracking-[0.15em] md:text-2xl">
              {brand.toUpperCase()}
            </Link>
          </div>

          {/* Actions (section 9) */}
          <div className="flex items-center gap-0.5 md:gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2.5 transition hover:bg-muted"
              aria-label={translate({ fr: 'Recherche', en: 'Search', ar: 'بحث' }, lang)}
            >
              <Search className="h-5 w-5" aria-hidden />
            </button>

            {/* Langue */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1 rounded-full p-2.5 transition hover:bg-muted"
                aria-label={translate({ fr: 'Changer de langue', en: 'Change language', ar: 'تغيير اللغة' }, lang)}
                aria-expanded={langOpen}
              >
                <Globe className="h-5 w-5" aria-hidden />
                <span className="hidden text-xs font-medium uppercase md:block">{lang}</span>
              </button>
              {langOpen && (
                <ul className="absolute end-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  {languages.map((l) => (
                    <li key={l.code}>
                      <button
                        onClick={() => { setLang(l.code as Language); setLangOpen(false) }}
                        className={cn(
                          'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-muted',
                          l.code === lang && 'font-semibold text-primary',
                        )}
                      >
                        <span aria-hidden>{l.flag}</span> {l.native_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-full p-2.5 transition hover:bg-muted md:block"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
              </a>
            )}

            <Link to="/account" className="hidden rounded-full p-2.5 transition hover:bg-muted md:block"
              aria-label={translate({ fr: 'Compte', en: 'Account', ar: 'الحساب' }, lang)}>
              <User className="h-5 w-5" aria-hidden />
            </Link>

            <Link to="/wishlist" className="relative rounded-full p-2.5 transition hover:bg-muted"
              aria-label={`Wishlist (${wishlistCount})`}>
              <Heart className="h-5 w-5" aria-hidden />
              <CountBadge count={wishlistCount} label={`${wishlistCount} articles en wishlist`} />
            </Link>

            <Link to="/cart" className="relative rounded-full p-2.5 transition hover:bg-muted"
              aria-label={`${translate({ fr: 'Panier', en: 'Cart', ar: 'السلة' }, lang)} (${count})`}>
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <CountBadge count={count} label={`${count} articles au panier`} />
            </Link>
          </div>
        </div>

        {/* Navigation desktop (section 8) */}
        <nav className="hidden border-t border-border md:block" aria-label={translate({ fr: 'Navigation principale', en: 'Main navigation', ar: 'التنقل الرئيسي' }, lang)}>
          <ul className="container flex items-center justify-center gap-7 py-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.url ?? '/'}
                  className={({ isActive }) =>
                    cn(
                      'text-[13px] uppercase tracking-[0.12em] transition hover:text-primary',
                      isActive ? 'text-primary' : 'text-foreground/80',
                    )
                  }
                >
                  {translate(item.label_translations, lang)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* MENU MOBILE (section 10) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label={translate({ fr: 'Fermer le menu', en: 'Close menu', ar: 'إغلاق القائمة' }, lang)}
          />
          <div className="absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <p className="font-display text-lg tracking-[0.15em]">{brand.toUpperCase()}</p>
              <button onClick={() => setMobileOpen(false)} className="rounded-full p-2 hover:bg-muted"
                aria-label={translate({ fr: 'Fermer', en: 'Close', ar: 'إغلاق' }, lang)}>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label={translate({ fr: 'Navigation mobile', en: 'Mobile navigation', ar: 'التنقل المحمول' }, lang)}>
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.url ?? '/'}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm uppercase tracking-wide transition hover:bg-muted"
                >
                  {translate(item.label_translations, lang)}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code as Language)}
                    className={cn(
                      'flex-1 rounded-full border px-3 py-2 text-xs transition',
                      l.code === lang ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary',
                    )}
                  >
                    {l.flag} {l.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRE BASSE MOBILE (section 10 : Accueil | Boutique | Recherche | Wishlist | Panier) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card md:hidden"
        aria-label={translate({ fr: 'Navigation rapide', en: 'Quick navigation', ar: 'التنقل السريع' }, lang)}>
        <NavLink to="/" className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wide', isActive ? 'text-primary' : 'text-muted-foreground')}>
          <Menu className="h-5 w-5" aria-hidden />
          {translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang)}
        </NavLink>
        <NavLink to="/shop" className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wide', isActive ? 'text-primary' : 'text-muted-foreground')}>
          <ShoppingBag className="h-5 w-5" aria-hidden />
          {translate({ fr: 'Boutique', en: 'Shop', ar: 'المتجر' }, lang)}
        </NavLink>
        <button onClick={() => setSearchOpen(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <Search className="h-5 w-5" aria-hidden />
          {translate({ fr: 'Recherche', en: 'Search', ar: 'بحث' }, lang)}
        </button>
        <NavLink to="/wishlist" className={({ isActive }) => cn('relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wide', isActive ? 'text-primary' : 'text-muted-foreground')}>
          <Heart className="h-5 w-5" aria-hidden />
          {translate({ fr: 'Wishlist', en: 'Wishlist', ar: 'الأمنيات' }, lang)}
          {wishlistCount > 0 && (
            <span className="absolute end-[18%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-badge px-1 text-[9px] font-bold text-badge-foreground">
              {wishlistCount}
            </span>
          )}
        </NavLink>
        <NavLink to="/cart" className={({ isActive }) => cn('relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wide', isActive ? 'text-primary' : 'text-muted-foreground')}>
          <ShoppingBag className="h-5 w-5" aria-hidden />
          {translate({ fr: 'Panier', en: 'Cart', ar: 'السلة' }, lang)}
          {count > 0 && (
            <span className="absolute end-[18%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-badge px-1 text-[9px] font-bold text-badge-foreground">
              {count}
            </span>
          )}
        </NavLink>
      </nav>

      {/* Recherche intelligente (section 29) */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}