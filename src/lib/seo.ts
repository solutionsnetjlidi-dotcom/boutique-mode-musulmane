import { createElement, useEffect } from 'react'

interface SeoOptions {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
}

/** Gère dynamiquement les balises <head> (section 78) */
export function useSeo({ title, description, canonical, ogImage }: SeoOptions) {
  useEffect(() => {
    if (title) document.title = title

    const ensureMeta = (attr: string, name: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      return el
    }

    if (description) {
      ensureMeta('name', 'description').setAttribute('content', description)
    }
    if (ogImage) {
      ensureMeta('property', 'og:image').setAttribute('content', ogImage)
      ensureMeta('property', 'og:title').setAttribute('content', title ?? document.title)
      ensureMeta('property', 'og:description').setAttribute('content', description ?? '')
    }
    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonical
    }
  }, [title, description, canonical, ogImage])
}

/**
 * Données structurées JSON-LD (section 79).
 * Écrit SANS JSX (createElement) pour rester valide dans un fichier .ts
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  })
}