import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface Crumb { label: string; to?: string }

/** Section 30 : fil d'Ariane (chevrons mirés en RTL). */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="container pt-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 rtl:rotate-180" aria-hidden />}
            {item.to ? (
              <Link to={item.to} className="transition hover:text-primary">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}