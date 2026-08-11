import ProductCard from '@/components/product/ProductCard'
import SectionHeading from '@/sections/SectionHeading'
import type { ProductWithVariants } from '@/types/database.types'

/**
 * Sections 16-19 : section produits réutilisable.
 * Trending / Best Sellers / Nouveautés / Promotions.
 * Section 16 : 4 desktop / 2 tablette / 2 mobile.
 */
export default function ProductSection({
  title, eyebrow, products, link, linkLabel,
}: {
  title: string
  eyebrow?: string
  products: ProductWithVariants[]
  link?: string
  linkLabel?: string
}) {
  if (products.length === 0) return null
  return (
    <section className="container py-14">
      <SectionHeading eyebrow={eyebrow} title={title} link={link} linkLabel={linkLabel} />
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}