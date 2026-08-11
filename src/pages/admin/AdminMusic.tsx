import { useEffect, useRef, useState } from 'react'
import { Music, Save, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

/** Sections 63-64 : musique — upload Storage, activation, volume, URL. */
export default function AdminMusic() {
  const [enabled, setEnabled] = useState(false)
  const [trackUrl, setTrackUrl] = useState('')
  const [volume, setVolume] = useState('0.5')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('site_settings').select('key, value')
      .in('key', ['music_enabled', 'music_track_url', 'music_volume'])
      .then(({ data }) => {
        const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
        setEnabled(map.music_enabled === true || map.music_enabled === 'true')
        setTrackUrl(typeof map.music_track_url === 'string' ? map.music_track_url : '')
        setVolume(typeof map.music_volume === 'string' ? map.music_volume : '0.5')
      })
  }, [])

  /* Section 63 : fichier stocké dans Supabase Storage (bucket media/audio) */
  const upload = async (file: File) => {
    setUploading(true)
    try {
      const path = `audio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      setTrackUrl(data.publicUrl)
      toast('Fichier audio uploadé ✓')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur d\'upload')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all([
        supabase.from('site_settings').update({ value: JSON.stringify(enabled) }).eq('key', 'music_enabled'),
        supabase.from('site_settings').update({ value: JSON.stringify(trackUrl) }).eq('key', 'music_track_url'),
        supabase.from('site_settings').update({ value: JSON.stringify(volume) }).eq('key', 'music_volume'),
      ])
      await logAudit('settings_change', 'site_settings', undefined, { music_enabled: enabled })
      toast('Paramètres musique enregistrés ✓')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-3 font-display text-3xl">
          <Music className="h-6 w-6 text-primary" aria-hidden /> Musique
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Musique libre de droits (section 63). La préférence de la visiteuse est respectée :
          si elle coupe la musique, elle ne se relance jamais (section 64).
        </p>
      </header>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium">Musique activée</p>
            <p className="text-xs text-muted-foreground">Le player 🎵 apparaît sur tout le site public.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Activer la musique" />
        </div>

        <div>
          <Label>Fichier audio (MP3 libre de droits)</Label>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="audio/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4" aria-hidden />
              {uploading ? 'Upload…' : 'Uploader un fichier'}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="music-url">ou URL directe du fichier</Label>
          <Input id="music-url" value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)} placeholder="https://…/musique.mp3" />
        </div>

        <div>
          <Label htmlFor="music-vol">Volume par défaut (0 à 1)</Label>
          <Input id="music-vol" type="number" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(e.target.value)} />
        </div>

        {trackUrl && <audio controls src={trackUrl} className="w-full" aria-label="Prévisualisation de la musique" />}

        <Button size="lg" className="w-full" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" aria-hidden /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}