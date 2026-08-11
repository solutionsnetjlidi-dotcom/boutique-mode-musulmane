import { useEffect, useMemo, useState } from 'react'
import { ZoomIn } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import type { ProductWithVariants } from '@/types/database.types'

/** Section 33 : galerie avec zoom au survol + plein écran. */
export default function ProductGallery({
  product, variantImage,
}: {
  product: ProductWithVariants
  variantImage?: string | null
}) {
  const { lang } = useLanguage()
  const name = translate(product.name_translations, lang)

  const images = useMemo(() => {
    const list = [variantImage, product.main_image_url, product.hover_image_url].filter(Boolean) as string[]
    return [...new Set(list)]
  }, [product, variantImage])

  const [active, setActive] = useState(0)
  const [origin, setOrigin] = useState('50% 50%')
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => setActive(0), [images.length])

  const current = images[Math.min(active, Math.max(images.length - 1, 0))]

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative cursor-zoom-in overflow-hidden rounded-2xl bg-muted"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setOrigin(`${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`)
        }}
        onClick={() => setFullscreen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setFullscreen(true)}
        aria-label={`${translate({ fr: 'Agrandir l\'image', en: 'Zoom image', ar: 'تكبير الصورة' }, lang)} : ${name}`}
      >
        <img
          src={current}
          alt={name}
          className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-[1.6]"
          style={{ transformOrigin: origin }}
        />
        <span className="absolute bottom-3 end-3 rounded-full bg-card/90 p-2 opacity-0 shadow backdrop-blur transition group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" aria-hidden />
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={cn('overflow-hidden rounded-lg border-2 transition', i === active ? 'border-primary' : 'border-transparent hover:border-border')}
              aria-label={`Image ${i + 1}`}
              aria-current={i === active}
            >
              <img src={src} alt="" className="h-20 object-cover" style={{ width: '4rem' }} />
            </button>
          ))}
        </div>
      )}

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-3xl bg-transparent p-0 shadow-none">
          <img src={current} alt={name} className="max-h-[85vh] w-full rounded-xl object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  )
}