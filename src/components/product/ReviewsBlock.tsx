import { useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/common/Toaster'
import { cn } from '@/lib/utils'
import type { ReviewRow } from '@/types/database.types'

export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`Note : ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-4 w-4', i < Math.round(rating) ? 'fill-[#C9A961] text-[#C9A961]' : 'text-border')} aria-hidden />
      ))}
    </span>
  )
}

/**
 * Section 51 : avis clientes.
 * - Avis de démo clairement identifiés (badge "Démo").
 * - Soumission → is_approved=false (modération admin obligatoire).
 */
export default function ReviewsBlock({
  productId, reviews, onReviewAdded,
}: {
  productId: string
  reviews: ReviewRow[]
  onReviewAdded: () => void
}) {
  const { lang } = useLanguage()
  const { session, profile } = useAuth()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || comment.trim().length < 5) return
    setSending(true)
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: session.user.id,
      author_name: profile?.first_name || session.user.email?.split('@')[0] || 'Cliente',
      rating,
      comment: comment.trim(),
      is_approved: false,
      is_demo: false,
    })
    setSending(false)
    if (error) {
      toast(translate({ fr: 'Impossible d\'envoyer votre avis.', en: 'Could not submit your review.', ar: 'تعذر إرسال رأيك.' }, lang))
      return
    }
    setComment('')
    toast(translate({
      fr: 'Merci ! Votre avis sera publié après modération.',
      en: 'Thank you! Your review will be published after moderation.',
      ar: 'شكراً! سيُنشر رأيك بعد المراجعة.',
    }, lang))
    onReviewAdded()
  }

  const locale = lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-GB' : 'fr-TN'

  return (
    <section className="container max-w-3xl py-12" id="avis">
      <h2 className="mb-8 text-center font-display text-3xl">
        {translate({ fr: 'Avis Clientes', en: 'Customer Reviews', ar: 'آراء العميلات' }, lang)}
      </h2>

      {reviews.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {translate({ fr: 'Aucun avis pour le moment. Soyez la première !', en: 'No reviews yet. Be the first!', ar: 'لا توجد آراء بعد. كوني الأولى!' }, lang)}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <RatingStars rating={r.rating} />
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString(locale)}</span>
              </div>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>}
              <p className="mt-3 flex items-center gap-2 text-xs">
                <span className="font-medium">{r.author_name}</span>
                {r.is_verified_purchase && (
                  <span className="text-emerald-600">
                    {translate({ fr: 'Achat vérifié', en: 'Verified purchase', ar: 'شراء موثق' }, lang)}
                  </span>
                )}
                {r.is_demo && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">Démo</span>
                )}
              </p>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <p className="mb-4 font-display text-lg">
          {translate({ fr: 'Donner mon avis', en: 'Write a review', ar: 'أكتبي رأيك' }, lang)}
        </p>
        {session ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm">{translate({ fr: 'Votre note', en: 'Your rating', ar: 'تقييمك' }, lang)}</p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setRating(i + 1)} aria-label={`${i + 1} étoiles`}>
                    <Star className={cn('h-6 w-6 transition', i < rating ? 'fill-[#C9A961] text-[#C9A961]' : 'text-border hover:text-[#C9A961]')} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={translate({ fr: 'Partagez votre expérience…', en: 'Share your experience…', ar: 'شاركينا تجربتك…' }, lang)}
              aria-label={translate({ fr: 'Votre avis', en: 'Your review', ar: 'رأيك' }, lang)}
            />
            <Button type="submit" disabled={sending || comment.trim().length < 5}>
              {sending ? '…' : translate({ fr: 'Envoyer', en: 'Submit', ar: 'إرسال' }, lang)}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {translate({ fr: 'Connectez-vous pour laisser un avis.', en: 'Sign in to leave a review.', ar: 'سجلي الدخول لترك رأي.' }, lang)}
          </p>
        )}
      </div>
    </section>
  )
}