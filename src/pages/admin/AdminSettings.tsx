import { useEffect, useState } from 'react'
import { Save, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrilingualFields, emptyTri, triFromJson, triToJson } from '@/components/admin/TrilingualFields'
import type { TriValue } from '@/components/admin/TrilingualFields'

/** Section 103 : paramètres globaux — toute modification met à jour le site sans toucher au code. */
export default function AdminSettings() {
  const [brand, setBrand] = useState<TriValue>(emptyTri())
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState<TriValue>(emptyTri())
  const [threshold, setThreshold] = useState('150')
  const [about, setAbout] = useState<TriValue>(emptyTri())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('site_settings').select('key, value')
      .in('key', ['brand_name', 'whatsapp_number', 'contact_email', 'contact_phone', 'opening_hours', 'free_shipping_threshold', 'about_content'])
      .then(({ data }) => {
        const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
        setBrand(triFromJson(m.brand_name))
        setWhatsapp(typeof m.whatsapp_number === 'string' ? m.whatsapp_number : '')
        setEmail(typeof m.contact_email === 'string' ? m.contact_email : '')
        setPhone(typeof m.contact_phone === 'string' ? m.contact_phone : '')
        setHours(triFromJson(m.opening_hours))
        setThreshold(typeof m.free_shipping_threshold === 'string' ? m.free_shipping_threshold : '150')
        setAbout(triFromJson(m.about_content))
      })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all([
        supabase.from('site_settings').update({ value: JSON.stringify(triToJson(brand)) }).eq('key', 'brand_name'),
        supabase.from('site_settings').update({ value: JSON.stringify(whatsapp) }).eq('key', 'whatsapp_number'),
        supabase.from('site_settings').update({ value: JSON.stringify(email) }).eq('key', 'contact_email'),
        supabase.from('site_settings').update({ value: JSON.stringify(phone) }).eq('key', 'contact_phone'),
        supabase.from('site_settings').update({ value: JSON.stringify(triToJson(hours)) }).eq('key', 'opening_hours'),
        supabase.from('site_settings').update({ value: JSON.stringify(threshold) }).eq('key', 'free_shipping_threshold'),
        supabase.from('site_settings').update({ value: JSON.stringify(triToJson(about)) }).eq('key', 'about_content'),
      ])
      await logAudit('settings_change', 'site_settings', undefined, { scope: 'global' })
      toast('Paramètres enregistrés ✓ — répercutés sur tout le site')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-3 font-display text-3xl">
          <Settings className="h-6 w-6 text-primary" aria-hidden /> Paramètres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Chaque modification met à jour le site public sans toucher au code (section 103).</p>
      </header>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <TrilingualFields label="Nom de la marque (header, footer, copyright)" value={brand} onChange={setBrand} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+216 20 000 000" />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Email de contact</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Seuil livraison gratuite (DT)</Label>
            <Input type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
        </div>
        <TrilingualFields label="Horaires" value={hours} onChange={setHours} />
        <TrilingualFields label="Contenu page À propos (section 95)" value={about} onChange={setAbout} textarea rows={8} />
        <Button size="lg" className="w-full" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" aria-hidden /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}