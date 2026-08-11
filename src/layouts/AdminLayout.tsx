import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Boxes, FileText, FolderTree, Image as ImageIcon, Languages, LayoutDashboard, Layers,
  LogOut, MessageCircle, MessageCircleQuestion, Music, Package, Palette, Percent,
  Search, Settings, ShoppingCart, Star, Ticket, Truck, Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePendingOrdersCount } from '@/hooks/usePendingOrders'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produits', icon: Package },
  { to: '/admin/categories', label: 'Catégories', icon: FolderTree },
  { to: '/admin/collections', label: 'Collections', icon: Layers },
  { to: '/admin/stock', label: 'Stock', icon: Boxes },
  { to: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Clientes', icon: Users },
  { to: '/admin/reviews', label: 'Avis', icon: Star },
  { to: '/admin/cms', label: 'CMS Homepage', icon: FileText },
  { to: '/admin/faq', label: 'FAQ', icon: MessageCircleQuestion },
  { to: '/admin/themes', label: 'Thèmes', icon: Palette },
  { to: '/admin/languages', label: 'Langues', icon: Languages },
  { to: '/admin/media', label: 'Media Library', icon: ImageIcon },
  { to: '/admin/shipping', label: 'Livraison', icon: Truck },
  { to: '/admin/promotions', label: 'Promotions', icon: Percent },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/music', label: 'Musique', icon: Music },
  { to: '/admin/seo', label: 'SEO', icon: Search },
  { to: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings },
]

/** Section 70 : déconnexion propre (signOut + redirection /admin/login). */
export default function AdminLayout() {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const pendingOrders = usePendingOrdersCount()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border px-6 py-5">
          <p className="font-display text-lg leading-tight">Admin</p>
          <p className="text-xs text-muted-foreground">Mode Musulmane Premium</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Navigation admin">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {to === '/admin/orders' && pendingOrders > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">
                  {pendingOrders}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div className="lg:hidden">
            <p className="font-display text-lg">Admin</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs uppercase tracking-wide text-primary">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 lg:hidden"
              aria-label="Déconnexion"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}