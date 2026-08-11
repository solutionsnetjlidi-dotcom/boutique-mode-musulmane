import { useState } from 'react'
import { Clock, Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings, settingString } from '@/hooks/useSiteSettings'
import { translate } from '@/lib/translations'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Breadcrumb from '@/components/shop/Breadcrumb'

/** Section 94 : page contact avec formulaire + coordonnées administrables. */
export default function ContactPage() {
  const { lang } = useLanguage()
  const settings = useSiteSettings()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const whatsapp = settingString(settings, 'whatsapp_number')
  const contactEmail = settingString(settings, 'contact_email')
  const contactPhone = settingString(settings, 'contact_phone')
  const hours = translate(settings?.opening_hours, lang)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.trim().length < 10) {
      toast(translate({
        fr: 'Veuillez remplir correctement tous les champs.',
        en: 'Please fill all fields correctly.',
        ar: 'يرجى ملء جميع الحقول بشكل صحيح.',
      }, lang))
      return
    }
    setSending(true)
    const { error } = await supabase.from('contact_messages').insert({
      name: name.trim(), email: email.trim(), phone: phone.trim() || null, message: message.trim(),
    })
    setSending(false)
    if (error) { toast(error.message); return }
    setSent(true)
  }

  return (
    <>
      <Breadcrumb items={[
        { label: translate({ fr: 'Accueil', en: 'Home', ar: 'الرئيسية' }, lang), to: '/' },
        { label: translate({ fr: 'Contact', en: 'Contact', ar: 'اتصلي بنا' }, lang) },
      ]} />
      <div className="container grid max-w-5xl gap-10 py-12 md:grid-cols-2">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">
            {translate({ fr: 'Contactez-nous', en: 'Contact us', ar: 'اتصلي بنا' }, lang)}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {translate({
              fr: 'Une question sur une pièce, une taille, votre commande ? Notre équipe vous répond avec plaisir.',
              en: 'A question about a piece, a size, your order? Our team is happy to help.',
              ar: 'سؤال عن قطعة أو مقاس أو طلبك؟ فريقنا يسعده مساعدتك.',
            }, lang)}
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {whatsapp && (
              <li>
                <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 transition hover:text-primary">
                  <span className="rounded-full bg-emerald-50 p-2.5 text-emerald-600"><MessageCircle className="h-4 w-4" aria-hidden /></span>
                  WhatsApp : {whatsapp}
                </a>
              </li>
            )}
            {contactPhone && (
              <li className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 p-2.5 text-primary"><Phone className="h-4 w-4" aria-hidden /></span>
                {contactPhone}
              </li>
            )}
            {contactEmail && (
              <li className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 p-2.5 text-primary"><Mail className="h-4 w-4" aria-hidden /></span>
                {contactEmail}
              </li>
            )}
            {hours && (
              <li className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 p-2.5 text-primary"><Clock className="h-4 w-4" aria-hidden /></span>
                {hours}
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          {sent ? (
            <p role="status" className="rounded-lg bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              {translate({
                fr: 'Message envoyé ✓ Nous vous répondrons rapidement.',
                en: 'Message sent ✓ We will reply soon.',
                ar: 'تم إرسال الرسالة ✓ سنرد عليك قريباً.',
              }, lang)}
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="c-name">{translate({ fr: 'Nom *', en: 'Name *', ar: 'الاسم *' }, lang)}</Label>
                <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="c-email">{translate({ fr: 'Email *', en: 'Email *', ar: 'البريد *' }, lang)}</Label>
                  <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="c-phone">{translate({ fr: 'Téléphone', en: 'Phone', ar: 'الهاتف' }, lang)}</Label>
                  <Input id="c-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="c-msg">{translate({ fr: 'Message *', en: 'Message *', ar: 'الرسالة *' }, lang)}</Label>
                <Textarea id="c-msg" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                <Send className="h-4 w-4" aria-hidden />
                {sending ? '…' : translate({ fr: 'Envoyer', en: 'Send', ar: 'إرسال' }, lang)}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}