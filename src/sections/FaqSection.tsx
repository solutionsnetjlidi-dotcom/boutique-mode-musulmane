import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import SectionHeading from '@/sections/SectionHeading'
import { cn } from '@/lib/utils'
import type { FaqRow } from '@/types/database.types'

/** Section 57 : FAQ administrable FR/EN/AR (accordéon accessible). */
export default function FaqSection({ faqs, title }: { faqs: FaqRow[]; title: string }) {
  const { lang } = useLanguage()
  const [openId, setOpenId] = useState<string | null>(null)
  if (faqs.length === 0) return null

  return (
    <section className="container max-w-3xl py-14">
      <SectionHeading title={title} />
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f) => {
          const open = openId === f.id
          return (
            <div key={f.id}>
              <button
                onClick={() => setOpenId(open ? null : f.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-medium transition hover:text-primary"
                aria-expanded={open}
              >
                {translate(f.question_translations, lang)}
                <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
              </button>
              {open && (
                <p className="animate-fade-in px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {translate(f.answer_translations, lang)}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}