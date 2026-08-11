/** Utilisé pour les modules admin livrés aux lots suivants. */
export default function AdminPlaceholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <h1 className="font-display text-2xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Module développé en <span className="font-medium text-primary">{phase}</span>.
      </p>
    </div>
  )
}