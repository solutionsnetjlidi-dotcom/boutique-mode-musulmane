import { Outlet } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import MusicPlayer from '@/components/common/MusicPlayer'
import Toaster from '@/components/common/Toaster'
import MiniCart from '@/components/cart/MiniCart'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MiniCart />
      <WhatsAppButton />
      <MusicPlayer />
      <Toaster />
    </div>
  )
}