import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Section 56 : newsletter avec consentement obligatoire. */
export default function NewsletterSection({ title }: { title: string }) {
  const { lang } = useLanguage()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) { setStatus('error'); return }
    if (!consent) { setStatus('error'); return }
    setStatus('loading')
    const { error } = await supabase.from('newsletter_subscribers').insert({ email, language: lang, consent: true })
    setStatus(error ? 'error' : 'success')
    if (!error) { setEmail(''); setConsent(false) }
  }

  return (
    <section className="bg-primary/8 py-16">
      <div className="container flex max-w-xl flex-col items-center gap-5 text-center">
        <h2 className="font-display text-3xl">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {translate({
            fr: 'Soyez la première informée de nos nouveautés et offres exclusives.',
            en: 'Be the first to know about new arrivals and exclusive offers.',
            ar: 'كوني أول من يعرف عن جديدنا وعروضنا الحصرية.',
          }, lang)}
        </p>

        {status === 'success' ? (
          <p role="status" className="rounded-lg bg-emerald-50 px-6 py-3 text-sm text-emerald-700">
            {translate({ fr: 'Merci ! Inscription confirmée.', en: 'Thank you! Subscription confirmed.', ar: 'شكراً! تم تأكيد الاشتراك.' }, lang)}
          </p>
        ) : (
          <form onSubmit={submit} className="w-full space-y-3" noValidate>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">Email</label>
              <Input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={translate({ fr: 'Votre email', en: 'Your email', ar: 'بريدك الإلكتروني' }, lang)}
                aria-invalid={status === 'error'}
              />
              <Button type="submit" disabled={status === 'loading'} className="shrink-0">
                {status === 'loading'
                  ? '…'
                  : translate({ fr: 'S\'inscrire', en: 'Subscribe', ar: 'اشتركي' }, lang)}
              </Button>
            </div>
            <label className="flex items-start justify-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-[hsl(var(--primary))]"
              />
              {translate({
                fr: 'J\'accepte de recevoir la newsletter et je peux me désinscrire à tout moment.',
                en: 'I agree to receive the newsletter and can unsubscribe anytime.',
                ar: 'أوافق على تلقي النشرة البريدية ويمكنني إلغاء الاشتراك في أي وقت.',
              }, lang)}
            </label>
            {status === 'error' && (
              <p role="alert" className="text-xs text-red-500">
                {translate({
                  fr: 'Veuillez saisir un email valide et cocher le consentement.',
                  en: 'Please enter a valid email and tick consent.',
                  ar: 'يرجى إدخال بريد صالح والموافقة.',
                }, lang)}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}