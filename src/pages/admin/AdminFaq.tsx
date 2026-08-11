import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrilingualFields, emptyTri, triFromJson, triToJson } from '@/components/admin/TrilingualFields'
import type { TriValue } from '@/components/admin/TrilingualFields'
import { translate } from '@/lib/translations'
import type { FaqRow } from '@/types/database.types'

/** Section 57 : FAQ administrable FR/EN/AR. */
export default function AdminFaq() {
  const [faqs, setFaqs] = useState<FaqRow[] | null>(null)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [question, setQuestion] = useState<TriValue>(emptyTri())
  const [answer, setAnswer] = useState<TriValue>(emptyTri())
  const [active, setActive] = useState(true)

  const load = useCallback(() => {
    supabase.from('faqs').select('*').order('sort_order')
      .then(({ data }) => setFaqs((data ?? []) as FaqRow[]))
  }, [])
  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!question.fr.trim() || !answer.fr.trim()) { toast('Question et réponse FR obligatoires.'); return }
    const payload = {
      question_translations: triToJson(question),
      answer_translations: triToJson(answer),
      is_active: active,
    }
    const { error } = editingId
      ? await supabase.from('faqs').update(payload).eq('id', editingId)
      : await supabase.from('faqs').insert({ ...payload, sort_order: (faqs?.length ?? 0) + 1 })
    if (error) { toast(error.message); return }
    await logAudit(editingId ? 'update' : 'create', 'faqs', editingId ?? undefined, {})
    toast('FAQ enregistrée ✓')
    setOpen(false)
    load()
  }

  const remove = async (f: FaqRow) => {
    if (!window.confirm('Supprimer cette question ?')) return
    await supabase.from('faqs').delete().eq('id', f.id)
    await logAudit('delete', 'faqs', f.id, {})
    load()
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl">FAQ</h1>
        <Button onClick={() => { setQuestion(emptyTri()); setAnswer(emptyTri()); setActive(true); setEditingId(null); setOpen(true) }}>
          <Plus className="h-4 w-4" aria-hidden /> Nouvelle question
        </Button>
      </header>

      <div className="space-y-3">
        {faqs === null ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : faqs.map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{translate(f.question_translations, 'fr')}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{translate(f.answer_translations, 'fr')}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => {
              setEditingId(f.id); setQuestion(triFromJson(f.question_translations))
              setAnswer(triFromJson(f.answer_translations)); setActive(f.is_active); setOpen(true)
            }}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <button onClick={() => remove(f)} className="rounded-full p-2 text-red-500 transition hover:bg-red-50" aria-label="Supprimer">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
            <Switch
              checked={f.is_active}
              onCheckedChange={async (v) => {
                await supabase.from('faqs').update({ is_active: v }).eq('id', f.id)
                load()
              }}
              aria-label="Activer la question"
            />
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier la question' : 'Nouvelle question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <TrilingualFields label="Question" value={question} onChange={setQuestion} />
            <TrilingualFields label="Réponse" value={answer} onChange={setAnswer} textarea rows={4} />
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <span className="text-sm">Question active</span>
              <Switch checked={active} onCheckedChange={setActive} aria-label="Question active" />
            </div>
            <Button className="w-full" onClick={save}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}