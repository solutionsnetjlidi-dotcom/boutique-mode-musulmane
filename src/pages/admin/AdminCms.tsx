import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, LayoutTemplate, Megaphone, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrilingualFields, emptyTri, triFromJson, triToJson } from '@/components/admin/TrilingualFields'
import type { TriValue } from '@/components/admin/TrilingualFields'
import { translate } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { AnnouncementRow, HeroRow, HomepageSectionRow } from '@/types/database.types'

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero / Diaporama', categories: 'Shop by Category', collections: 'Collections',
  new_arrivals: 'Nouveautés', best_sellers: 'Best Sellers', trending: 'Tendances',
  promotions: 'Promotions', lookbook: 'Lookbook', advantages: 'Pourquoi nous choisir',
  reviews: 'Avis clientes', instagram: 'Instagram / Social', newsletter: 'Newsletter', faq: 'FAQ',
}

type Tab = 'sections' | 'hero' | 'announcements'

interface HeroForm {
  id?: string
  title: TriValue; subtitle: TriValue
  image_desktop: string; image_mobile: string
  cta_label: TriValue; cta_url: string
  cta_secondary_label: TriValue; cta_secondary_url: string
  is_active: boolean
}
const emptyHero = (): HeroForm => ({
  title: emptyTri(), subtitle: emptyTri(), image_desktop: '', image_mobile: '',
  cta_label: emptyTri(), cta_url: '', cta_secondary_label: emptyTri(), cta_secondary_url: '', is_active: true,
})

/** Section 76 : CMS homepage — sections, hero slider, barres d'annonces. */
export default function AdminCms() {
  const [tab, setTab] = useState<Tab>('sections')

  const [sections, setSections] = useState<HomepageSectionRow[] | null>(null)
  const [editingSection, setEditingSection] = useState<HomepageSectionRow | null>(null)
  const [sectionTitle, setSectionTitle] = useState<TriValue>(emptyTri())

  const [slides, setSlides] = useState<HeroRow[]>([])
  const [heroForm, setHeroForm] = useState<HeroForm | null>(null)

  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [annText, setAnnText] = useState<TriValue>(emptyTri())
  const [annId, setAnnId] = useState<string | null>(null)
  const [annActive, setAnnActive] = useState(true)

  const loadSections = useCallback(() => {
    supabase.from('homepage_sections').select('*').order('sort_order')
      .then(({ data }) => setSections((data ?? []) as HomepageSectionRow[]))
  }, [])
  const loadSlides = useCallback(() => {
    supabase.from('hero_sections').select('*').order('sort_order')
      .then(({ data }) => setSlides((data ?? []) as HeroRow[]))
  }, [])
  const loadAnnouncements = useCallback(() => {
    supabase.from('announcement_bars').select('*').order('sort_order')
      .then(({ data }) => setAnnouncements((data ?? []) as AnnouncementRow[]))
  }, [])

  useEffect(() => { loadSections(); loadSlides(); loadAnnouncements() }, [loadSections, loadSlides, loadAnnouncements])

  /* ---- Sections ---- */
  const toggleSection = async (s: HomepageSectionRow, active: boolean) => {
    const { error } = await supabase.from('homepage_sections').update({ is_active: active }).eq('id', s.id)
    if (error) { toast(error.message); return }
    await logAudit('update', 'homepage_sections', s.id, { section_key: s.section_key, is_active: active })
    loadSections()
  }

  const moveSection = async (index: number, dir: -1 | 1) => {
    if (!sections) return
    const current = sections[index]
    const target = sections[index + dir]
    if (!current || !target) return
    await Promise.all([
      supabase.from('homepage_sections').update({ sort_order: target.sort_order }).eq('id', current.id),
      supabase.from('homepage_sections').update({ sort_order: current.sort_order }).eq('id', target.id),
    ])
    loadSections()
  }

  const saveSectionTitle = async () => {
    if (!editingSection) return
    const { error } = await supabase.from('homepage_sections')
      .update({ title_translations: triToJson(sectionTitle) }).eq('id', editingSection.id)
    if (error) { toast(error.message); return }
    await logAudit('update', 'homepage_sections', editingSection.id, { section_key: editingSection.section_key })
    toast('Titre enregistré ✓')
    setEditingSection(null)
    loadSections()
  }

  /* ---- Hero (section 13) ---- */
  const saveHero = async () => {
    if (!heroForm) return
    if (!heroForm.title.fr.trim()) { toast('Titre FR obligatoire.'); return }
    const payload = {
      title_translations: triToJson(heroForm.title),
      subtitle_translations: triToJson(heroForm.subtitle),
      image_desktop: heroForm.image_desktop.trim() || null,
      image_mobile: heroForm.image_mobile.trim() || null,
      cta_label_translations: triToJson(heroForm.cta_label),
      cta_url: heroForm.cta_url.trim() || null,
      cta_secondary_label_translations: triToJson(heroForm.cta_secondary_label),
      cta_secondary_url: heroForm.cta_secondary_url.trim() || null,
      is_active: heroForm.is_active,
    }
    const { error } = heroForm.id
      ? await supabase.from('hero_sections').update(payload).eq('id', heroForm.id)
      : await supabase.from('hero_sections').insert({ ...payload, sort_order: slides.length + 1 })
    if (error) { toast(error.message); return }
    await logAudit(heroForm.id ? 'update' : 'create', 'hero_sections', heroForm.id, {})
    toast('Slide enregistré ✓')
    setHeroForm(null)
    loadSlides()
  }

  const deleteHero = async (s: HeroRow) => {
    if (!window.confirm('Supprimer ce slide ?')) return
    const { error } = await supabase.from('hero_sections').delete().eq('id', s.id)
    if (error) { toast(error.message); return }
    await logAudit('delete', 'hero_sections', s.id, {})
    loadSlides()
  }

  /* ---- Annonces (section 7) ---- */
  const saveAnnouncement = async () => {
    if (!annText.fr.trim()) { toast('Texte FR obligatoire.'); return }
    const payload = { text_translations: triToJson(annText), is_active: annActive }
    const { error } = annId
      ? await supabase.from('announcement_bars').update(payload).eq('id', annId)
      : await supabase.from('announcement_bars').insert({ ...payload, sort_order: announcements.length + 1 })
    if (error) { toast(error.message); return }
    await logAudit(annId ? 'update' : 'create', 'announcement_bars', annId ?? undefined, {})
    toast('Annonce enregistrée ✓')
    setAnnText(emptyTri()); setAnnId(null); setAnnActive(true)
    loadAnnouncements()
  }

  const deleteAnnouncement = async (a: AnnouncementRow) => {
    if (!window.confirm('Supprimer cette annonce ?')) return
    await supabase.from('announcement_bars').delete().eq('id', a.id)
    loadAnnouncements()
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 font-display text-3xl">
          <LayoutTemplate className="h-6 w-6 text-primary" aria-hidden /> CMS Homepage
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque modification est répercutée immédiatement sur le site public (sections 76 & 103).
        </p>
      </header>

      <div className="flex gap-2" role="tablist">
        {([['sections', 'Sections'], ['hero', 'Hero Slider'], ['announcements', 'Barre d\'annonces']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('rounded-full px-4 py-2 text-sm font-medium transition',
              tab === key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>
            {label}
          </button>
        ))}
      </div>

      {/* ===== SECTIONS ===== */}
      {tab === 'sections' && (
        <div className="space-y-3">
          {sections === null ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : sections.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveSection(i, -1)} disabled={i === 0}
                  className="rounded p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-30" aria-label="Monter">
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1}
                  className="rounded p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-30" aria-label="Descendre">
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {SECTION_LABELS[s.section_key] ?? s.section_key}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{s.section_key}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Titre affiché : {translate(s.title_translations, 'fr') || '(par défaut)'}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setEditingSection(s); setSectionTitle(triFromJson(s.title_translations)) }}>
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Titre
              </Button>
              <Switch checked={s.is_active} onCheckedChange={(v) => toggleSection(s, v)} aria-label={`Activer ${SECTION_LABELS[s.section_key] ?? s.section_key}`} />
            </div>
          ))}
        </div>
      )}

      {/* ===== HERO ===== */}
      {tab === 'hero' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setHeroForm(emptyHero())}><Plus className="h-4 w-4" aria-hidden /> Nouveau slide</Button>
          </div>

          {slides.map((s) => (
            <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <img src={s.image_desktop ?? undefined} alt="" className="h-16 w-28 rounded-lg bg-muted object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{translate(s.title_translations, 'fr')}</p>
                <p className="text-xs text-muted-foreground">CTA : {translate(s.cta_label_translations, 'fr')} → {s.cta_url ?? '—'}</p>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase', s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                {s.is_active ? 'Actif' : 'Inactif'}
              </span>
              <Button size="sm" variant="outline" onClick={() => setHeroForm({
                id: s.id,
                title: triFromJson(s.title_translations), subtitle: triFromJson(s.subtitle_translations),
                image_desktop: s.image_desktop ?? '', image_mobile: s.image_mobile ?? '',
                cta_label: triFromJson(s.cta_label_translations), cta_url: s.cta_url ?? '',
                cta_secondary_label: triFromJson(s.cta_secondary_label_translations), cta_secondary_url: s.cta_secondary_url ?? '',
                is_active: s.is_active,
              })}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </Button>
              <button onClick={() => deleteHero(s)} className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer le slide">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}

          {heroForm && (
            <div className="space-y-4 rounded-2xl border-2 border-primary/30 bg-card p-6">
              <p className="flex items-center gap-2 font-display text-lg">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                {heroForm.id ? 'Modifier le slide' : 'Nouveau slide'}
              </p>
              <TrilingualFields label="Titre" value={heroForm.title} onChange={(title) => setHeroForm((f) => f && { ...f, title })} />
              <TrilingualFields label="Sous-titre" value={heroForm.subtitle} onChange={(subtitle) => setHeroForm((f) => f && { ...f, subtitle })} textarea />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Image desktop (URL)</Label>
                  <Input value={heroForm.image_desktop} onChange={(e) => setHeroForm((f) => f && { ...f, image_desktop: e.target.value })} />
                </div>
                <div>
                  <Label>Image mobile (URL)</Label>
                  <Input value={heroForm.image_mobile} onChange={(e) => setHeroForm((f) => f && { ...f, image_mobile: e.target.value })} />
                </div>
              </div>
              <TrilingualFields label="Libellé CTA principal" value={heroForm.cta_label} onChange={(cta_label) => setHeroForm((f) => f && { ...f, cta_label })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Lien CTA principal</Label>
                  <Input value={heroForm.cta_url} onChange={(e) => setHeroForm((f) => f && { ...f, cta_url: e.target.value })} placeholder="/collections" />
                </div>
                <div>
                  <Label>Lien CTA secondaire</Label>
                  <Input value={heroForm.cta_secondary_url} onChange={(e) => setHeroForm((f) => f && { ...f, cta_secondary_url: e.target.value })} placeholder="/shop" />
                </div>
              </div>
              <TrilingualFields label="Libellé CTA secondaire" value={heroForm.cta_secondary_label} onChange={(cta_secondary_label) => setHeroForm((f) => f && { ...f, cta_secondary_label })} />
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <span className="text-sm">Slide actif</span>
                <Switch checked={heroForm.is_active} onCheckedChange={(is_active) => setHeroForm((f) => f && { ...f, is_active })} aria-label="Slide actif" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={saveHero}>Enregistrer le slide</Button>
                <Button variant="outline" onClick={() => setHeroForm(null)}>Annuler</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ANNONCES ===== */}
      {tab === 'announcements' && (
        <div className="space-y-4">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <p className="flex items-center gap-2 font-display text-lg">
              <Megaphone className="h-4 w-4 text-primary" aria-hidden />
              {annId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
            </p>
            <TrilingualFields label="Texte" value={annText} onChange={setAnnText} />
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <span className="text-sm">Annonce active</span>
              <Switch checked={annActive} onCheckedChange={setAnnActive} aria-label="Annonce active" />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveAnnouncement}>Enregistrer</Button>
              {annId && <Button variant="outline" onClick={() => { setAnnId(null); setAnnText(emptyTri()); setAnnActive(true) }}>Annuler</Button>}
            </div>
          </div>

          {announcements.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex-1 rounded-lg px-4 py-2 text-center text-xs font-medium"
                style={{ backgroundColor: a.background_color ?? '#B76E79', color: a.text_color ?? '#fff' }}>
                {translate(a.text_translations, 'fr')}
              </div>
              <Button size="sm" variant="outline" onClick={() => { setAnnId(a.id); setAnnText(triFromJson(a.text_translations)); setAnnActive(a.is_active) }}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </Button>
              <button onClick={() => deleteAnnouncement(a)} className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dialog titre de section */}
      <Dialog open={!!editingSection} onOpenChange={(v) => !v && setEditingSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Titre — {editingSection ? SECTION_LABELS[editingSection.section_key] ?? editingSection.section_key : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <TrilingualFields label="Titre de la section" value={sectionTitle} onChange={setSectionTitle} />
            <Button className="w-full" onClick={saveSectionTitle}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}