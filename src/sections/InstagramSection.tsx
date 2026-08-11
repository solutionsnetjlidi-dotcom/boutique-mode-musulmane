import { Instagram } from 'lucide-react'
import type { SocialLinkRow } from '@/types/database.types'

const TILES = ['F7EDE8', 'F5E6E0', 'EFE0D9', 'E8D5C4', 'FAF6F2', 'F3EBE7']

/** Section 52 : SUIVEZ-NOUS — galerie visuelle + liens administrables. */
export default function InstagramSection({ socials, title }: { socials: SocialLinkRow[]; title: string }) {
  const instagram = socials.find((s) => s.platform === 'instagram')
  if (!instagram) return null

  return (
    <section className="py-14">
      <div className="container">
        <h2 className="mb-8 flex items-center justify-center gap-2 text-center font-display text-3xl">
          <Instagram className="h-6 w-6 text-primary" aria-hidden /> {title}
        </h2>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {TILES.map((color, i) => (
            <a
              key={color}
              href={instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${i + 1}`}
              className="group overflow-hidden rounded-xl"
            >
              <img
                src={`https://placehold.co/400x400/${color}/B76E79?text=%40votremarque`}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}