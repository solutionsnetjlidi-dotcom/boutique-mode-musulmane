import { Link } from 'react-router-dom'

export default function SectionHeading({ title, eyebrow, link, linkLabel }: {
  title: string; eyebrow?: string; link?: string; linkLabel?: string
}) {
  return (
    <div className="mb-8 flex flex-col items-center gap-1 text-center">
      {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>}
      <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
      {link && linkLabel && (
        <Link to={link} className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}