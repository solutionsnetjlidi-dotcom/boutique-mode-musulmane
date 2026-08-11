import { useCallback, useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { logAudit } from '@/lib/audit'
import { toast } from '@/components/common/Toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { MediaRow } from '@/types/database.types'

const FOLDERS = ['logo', 'hero', 'products', 'categories', 'collections', 'lookbook', 'reviews', 'audio']

/** Section 65 : Media Library — upload Supabase Storage, organisation, suppression. */
export default function AdminMedia() {
  const { user } = useAuth()
  const [files, setFiles] = useState<MediaRow[] | null>(null)
  const [folder, setFolder] = useState('products')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    supabase.from('media').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setFiles((data ?? []) as MediaRow[]))
  }, [])
  useEffect(() => { load() }, [load])

  const pathFromUrl = (url: string) => url.split('/media/')[1] ?? ''

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('media').getPublicUrl(path)

      const { error: insertError } = await supabase.from('media').insert({
        folder,
        url: data.publicUrl,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user?.id ?? null,
      })
      if (insertError) throw insertError

      await logAudit('create', 'media', undefined, { path })
      toast('Fichier uploadé ✓')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur d\'upload')
    } finally {
      setUploading(false)
    }
  }

  const remove = async (m: MediaRow) => {
    if (!window.confirm('Supprimer ce fichier ?')) return
    const path = pathFromUrl(m.url)
    if (path) await supabase.storage.from('media').remove([path])
    await supabase.from('media').delete().eq('id', m.id)
    await logAudit('delete', 'media', m.id, { path })
    toast('Fichier supprimé ✓')
    load()
  }

  const visible = (files ?? []).filter((f) => f.folder === folder)

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl">
            <ImageIcon className="h-6 w-6 text-primary" aria-hidden /> Media Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Section 65 — stockage Supabase (bucket « media »).</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" className="hidden" accept="image/*,audio/*"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4" aria-hidden />
            {uploading ? 'Upload…' : 'Uploader dans « ' + folder + ' »'}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {FOLDERS.map((f) => (
          <button key={f} onClick={() => setFolder(f)}
            className={cn('rounded-full px-4 py-1.5 text-xs font-medium capitalize transition',
              folder === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>
            {f}
          </button>
        ))}
      </div>

      {files === null ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aucun fichier dans « {folder} ». Uploadez votre premier fichier.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {visible.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
              {m.mime_type?.startsWith('audio') ? (
                <audio controls src={m.url} className="w-full" aria-label={m.file_name ?? 'audio'} />
              ) : (
                <img src={m.url} alt={m.file_name ?? ''} className="aspect-square w-full object-cover" loading="lazy" />
              )}
              <div className="flex items-center justify-between gap-2 p-3">
                <p className="line-clamp-1 text-xs text-muted-foreground">{m.file_name}</p>
                <button onClick={() => remove(m)} className="rounded-full p-1.5 text-red-500 transition hover:bg-red-50" aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}