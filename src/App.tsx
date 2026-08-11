import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { CartProvider } from '@/contexts/CartContext'
import type { UserRole } from '@/contexts/AuthContext'

import ProtectedRoute from '@/components/admin/ProtectedRoute'
import PublicLayout from '@/layouts/PublicLayout'
import AdminLayout from '@/layouts/AdminLayout'
import { Button } from '@/components/ui/button'

/* ===== Pages publiques ===== */
import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import Category from '@/pages/Category'
import CollectionPage from '@/pages/Collection'
import CollectionsIndex from '@/pages/CollectionsIndex'
import ProductPage from '@/pages/Product'
import CartPage from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderConfirmation from '@/pages/OrderConfirmation'
import AboutPage from '@/pages/About'
import ContactPage from '@/pages/Contact'
import FaqPage from '@/pages/FaqPage'
import LegalPage from '@/pages/LegalPage'

/* ===== Pages admin ===== */
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminPlaceholder from '@/pages/admin/AdminPlaceholder'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminThemes from '@/pages/admin/AdminThemes'
import AdminLanguages from '@/pages/admin/AdminLanguages'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminProductForm from '@/pages/admin/AdminProductForm'
import AdminCategories from '@/pages/admin/AdminCategories'
import AdminCollections from '@/pages/admin/AdminCollections'
import AdminStock from '@/pages/admin/AdminStock'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminOrderDetailPage from '@/pages/admin/AdminOrderDetailPage'
import AdminCustomers from '@/pages/admin/AdminCustomers'
import AdminReviews from '@/pages/admin/AdminReviews'
import AdminCms from '@/pages/admin/AdminCms'
import AdminFaq from '@/pages/admin/AdminFaq'
import AdminMedia from '@/pages/admin/AdminMedia'
import AdminShipping from '@/pages/admin/AdminShipping'
import AdminPromotions from '@/pages/admin/AdminPromotions'
import AdminCoupons from '@/pages/admin/AdminCoupons'
import AdminMusic from '@/pages/admin/AdminMusic'
import AdminSeo from '@/pages/admin/AdminSeo'
import AdminSettings from '@/pages/admin/AdminSettings'
import AdminWhatsApp from '@/pages/admin/AdminWhatsApp'

const STAFF_ROLES: UserRole[] = ['super_admin', 'admin', 'manager']

/** Pages d'extension future (wishlist dédiée, espace cliente). */
function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="container flex min-h-[55vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="text-sm text-muted-foreground">{phase}</p>
      <Button asChild variant="outline">
        <Link to="/">← Retour à l'accueil</Link>
      </Button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <CartProvider>
              <Routes>
                {/* ===== BOUTIQUE PUBLIQUE ===== */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/category/:slug" element={<Category />} />
                  <Route path="/collection/:slug" element={<CollectionPage />} />
                  <Route path="/collections" element={<CollectionsIndex />} />
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/confirmation" element={<OrderConfirmation />} />
                  <Route path="/wishlist" element={<PlaceholderPage title="Ma Wishlist" phase="La wishlist fonctionne via le cœur sur chaque produit." />} />
                  <Route path="/account" element={<PlaceholderPage title="Espace Cliente" phase="Page compte cliente en extension." />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/privacy" element={<LegalPage settingKey="legal_privacy" titleKey={{ fr: 'Politique de confidentialité', en: 'Privacy Policy', ar: 'سياسة الخصوصية' }} />} />
                  <Route path="/terms" element={<LegalPage settingKey="legal_terms" titleKey={{ fr: 'Conditions générales', en: 'Terms of Sale', ar: 'الشروط العامة' }} />} />
                  <Route path="/shipping" element={<LegalPage settingKey="legal_shipping" titleKey={{ fr: 'Livraison', en: 'Shipping', ar: 'التوصيل' }} />} />
                  <Route path="/returns" element={<LegalPage settingKey="legal_returns" titleKey={{ fr: 'Retours', en: 'Returns', ar: 'الإرجاع' }} />} />
                </Route>

                {/* ===== ADMIN ===== */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={STAFF_ROLES}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<AdminProductForm />} />
                  <Route path="products/:id" element={<AdminProductForm />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="collections" element={<AdminCollections />} />
                  <Route path="stock" element={<AdminStock />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="cms" element={<AdminCms />} />
                  <Route path="faq" element={<AdminFaq />} />
                  <Route path="themes" element={<AdminThemes />} />
                  <Route path="languages" element={<AdminLanguages />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="shipping" element={<AdminShipping />} />
                  <Route path="promotions" element={<AdminPromotions />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="music" element={<AdminMusic />} />
                  <Route path="seo" element={<AdminSeo />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="whatsapp" element={<AdminWhatsApp />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}