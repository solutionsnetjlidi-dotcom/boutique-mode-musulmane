import { useMemo } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { deriveColorOptions, deriveSizeOptions } from '@/hooks/useCatalog'
import type { CatalogFilters } from '@/hooks/useCatalog'
import type { CatalogProduct } from '@/services/shop'
import type { CategoryRow, CollectionRow } from '@/types/database.types'
import { cn } from '@/lib/utils'

/** Section 27 : filtres catégorie / collection / taille / couleur / prix / disponibilité / promo / premium. */
interface FilterPanelProps {
  products: CatalogProduct[]
  categories: CategoryRow[]
  collections: CollectionRow[]
  filters: CatalogFilters
  priceBounds: [number, number]
  onChange: (patch: Partial<CatalogFilters>) => void
  hideCategories?: boolean
  hideCollections?: boolean
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]">{title}</p>
      {children}
    </div>
  )
}

function CheckboxRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground/85 transition hover:text-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
      />
      {label}
    </label>
  )
}

export default function FilterPanel({
  products, categories, collections, filters, priceBounds, onChange,
  hideCategories, hideCollections,
}: FilterPanelProps) {
  const { lang } = useLanguage()
  const colors = useMemo(() => deriveColorOptions(products), [products])
  const sizes = useMemo(() => deriveSizeOptions(products), [products])

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  return (
    <div>
      {!hideCategories && (
        <Group title={translate({ fr: 'Catégorie', en: 'Category', ar: 'الفئة' }, lang)}>
          {categories.map((c) => (
            <CheckboxRow
              key={c.id}
              label={translate(c.name_translations, lang)}
              checked={filters.categories.includes(c.slug)}
              onToggle={() => onChange({ categories: toggle(filters.categories, c.slug) })}
            />
          ))}
        </Group>
      )}

      {!hideCollections && collections.length > 0 && (
        <Group title={translate({ fr: 'Collection', en: 'Collection', ar: 'التشكيلة' }, lang)}>
          {collections.map((c) => (
            <CheckboxRow
              key={c.id}
              label={translate(c.name_translations, lang)}
              checked={filters.collections.includes(c.slug)}
              onToggle={() => onChange({ collections: toggle(filters.collections, c.slug) })}
            />
          ))}
        </Group>
      )}

      {sizes.length > 0 && (
        <Group title={translate({ fr: 'Taille', en: 'Size', ar: 'المقاس' }, lang)}>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => onChange({ sizes: toggle(filters.sizes, s) })}
                aria-pressed={filters.sizes.includes(s)}
                className={cn('rounded-lg border px-3 py-1.5 text-xs transition',
                  filters.sizes.includes(s)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary')}
              >
                {s}
              </button>
            ))}
          </div>
        </Group>
      )}

      {colors.length > 0 && (
        <Group title={translate({ fr: 'Couleur', en: 'Color', ar: 'اللون' }, lang)}>
          <div className="flex flex-wrap gap-2.5">
            {colors.map(([name, hex]) => (
              <button
                key={name}
                onClick={() => onChange({ colors: toggle(filters.colors, name) })}
                aria-pressed={filters.colors.includes(name)}
                aria-label={name}
                title={name}
                className={cn('h-7 w-7 rounded-full ring-2 ring-offset-2 transition',
                  filters.colors.includes(name) ? 'ring-primary' : 'ring-transparent hover:ring-border')}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </Group>
      )}

      <Group title={translate({ fr: 'Prix', en: 'Price', ar: 'السعر' }, lang)}>
        <Slider.Root
          value={[filters.priceMin, filters.priceMax]}
          min={priceBounds[0]}
          max={priceBounds[1]}
          step={1}
          onValueChange={([min, max]) => onChange({ priceMin: min, priceMax: max })}
          className="relative flex h-5 w-full touch-none select-none items-center"
        >
          <Slider.Track className="relative h-1 grow rounded-full bg-muted">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-card shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label={translate({ fr: 'Prix minimum', en: 'Minimum price', ar: 'السعر الأدنى' }, lang)} />
          <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-card shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label={translate({ fr: 'Prix maximum', en: 'Maximum price', ar: 'السعر الأقصى' }, lang)} />
        </Slider.Root>
        <p className="mt-2 text-xs text-muted-foreground price-ltr">
          {filters.priceMin} DT — {filters.priceMax} DT
        </p>
      </Group>

      <Group title={translate({ fr: 'Disponibilité & plus', en: 'Availability & more', ar: 'التوفر والمزيد' }, lang)}>
        <CheckboxRow
          label={translate({ fr: 'En stock uniquement', en: 'In stock only', ar: 'المتوفر فقط' }, lang)}
          checked={filters.inStock}
          onToggle={() => onChange({ inStock: !filters.inStock })}
        />
        <CheckboxRow
          label={translate({ fr: 'Promotions', en: 'On sale', ar: 'العروض' }, lang)}
          checked={filters.onSale}
          onToggle={() => onChange({ onSale: !filters.onSale })}
        />
        <CheckboxRow
          label="Premium"
          checked={filters.premium}
          onToggle={() => onChange({ premium: !filters.premium })}
        />
      </Group>
    </div>
  )
}