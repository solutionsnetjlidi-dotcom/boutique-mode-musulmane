import { useEffect, useRef, useState } from 'react'
import { Music, Volume2, X } from 'lucide-react'
import { useSiteSettings, settingString, settingNumber } from '@/hooks/useSiteSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { translate } from '@/lib/translations'
import { cn } from '@/lib/utils'

const PREF_KEY = 'boutique:music-pref'
const VOL_KEY = 'boutique:music-volume'
const INTERACT_KEY = 'boutique:interacted'
const ENTER_KEY = 'boutique:entered'

/* ================= Helpers YouTube ================= */
function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

let ytAPIPromise: Promise<any> | null = null
function loadYouTubeAPI(): Promise<any> {
  if (ytAPIPromise) return ytAPIPromise
  ytAPIPromise = new Promise((resolve) => {
    const w = window as any
    if (w.YT && w.YT.Player) {
      resolve(w.YT)
      return
    }
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      if (prev) prev()
      resolve(w.YT)
    }
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script')
      tag.id = 'yt-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
  return ytAPIPromise
}

/**
 * Sections 63-64 : musique ON par défaut.
 * Écran d'entrée luxe (1 clic = musique immédiate) + autoplay au retour.
 */
export default function MusicPlayer() {
  const settings = useSiteSettings()
  const { lang } = useLanguage()
  const trackUrl = settingString(settings, 'music_track_url')
  const enabled = settings?.music_enabled
  const defaultVolume = settingNumber(settings, 'music_volume', 0.5)
  const logoUrl = settingString(settings, 'logo_url')
  const brand = translate(settings?.brand_name as any, lang, 'ESTABRAK')

  const [playing, setPlaying] = useState(false)
  const [open, setOpen] = useState(false)
  const [entered, setEntered] = useState<boolean>(() => {
    try { return sessionStorage.getItem(ENTER_KEY) === '1' } catch { return true }
  })
  const [closing, setClosing] = useState(false)
  const [volume, setVolume] = useState<number>(() => {
    try {
      const v = localStorage.getItem(VOL_KEY)
      return v != null && Number.isFinite(Number(v)) ? Number(v) : defaultVolume
    } catch {
      return defaultVolume
    }
  })

  const userDisabled = useRef(false)
  const wantPlay = useRef(false)
  const playingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ytPlayer = useRef<any>(null)
  const ytHost = useRef<HTMLDivElement | null>(null)

  const isYouTube = !!trackUrl && !!ytId(trackUrl)
  const isFeatureOn = enabled === true || enabled === 'true'
  const showGate = isFeatureOn && !!trackUrl && !entered

  useEffect(() => {
    try {
      userDisabled.current = localStorage.getItem(PREF_KEY) === 'off'
    } catch {
      /* ignore */
    }
  }, [])

  const setPlayingBoth = (v: boolean) => {
    playingRef.current = v
    setPlaying(v)
  }

  const applyVolume = (v: number) => {
    if (audioRef.current) audioRef.current.volume = v
    if (ytPlayer.current?.setVolume) ytPlayer.current.setVolume(Math.round(v * 100))
  }

  const play = () => {
    if (isYouTube) {
      if (ytPlayer.current?.playVideo) ytPlayer.current.playVideo()
      else wantPlay.current = true
    } else if (audioRef.current) {
      audioRef.current.play().then(() => setPlayingBoth(true)).catch(() => undefined)
    }
  }

  const pause = () => {
    if (isYouTube) ytPlayer.current?.pauseVideo?.()
    else audioRef.current?.pause()
    setPlayingBoth(false)
  }

  /* Player YouTube invisible + loop */
  useEffect(() => {
    if (!isFeatureOn || !isYouTube || !trackUrl) return
    let cancelled = false
    const id = ytId(trackUrl) as string

    loadYouTubeAPI().then((YT) => {
      if (cancelled || ytPlayer.current || !ytHost.current) return
      ytPlayer.current = new YT.Player(ytHost.current, {
        width: '2',
        height: '2',
        videoId: id,
        playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1, loop: 1, playlist: id },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(Math.round(volume * 100))
            if (wantPlay.current && !userDisabled.current) e.target.playVideo()
          },
          onStateChange: (e: any) => {
            if (e.data === 1) setPlayingBoth(true)
            if (e.data === 2) setPlayingBoth(false)
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (ytPlayer.current?.destroy) {
        ytPlayer.current.destroy()
        ytPlayer.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFeatureOn, isYouTube, trackUrl])

  /* Démarrage au 1er geste OU autoplay si déjà entrée/visitée */
  useEffect(() => {
    if (!isFeatureOn || !trackUrl || userDisabled.current) return

    const tryStart = () => {
      try { localStorage.setItem(INTERACT_KEY, '1') } catch { /* ignore */ }
      wantPlay.current = true
      if (!playingRef.current) play()
    }

    let visited = false
    try { visited = localStorage.getItem(INTERACT_KEY) === '1' } catch { /* ignore */ }
    if (visited && entered) tryStart()

    window.addEventListener('pointerdown', tryStart, { once: true })
    window.addEventListener('keydown', tryStart, { once: true })
    window.addEventListener('touchend', tryStart, { once: true })
    return () => {
      window.removeEventListener('pointerdown', tryStart)
      window.removeEventListener('keydown', tryStart)
      window.removeEventListener('touchend', tryStart)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFeatureOn, trackUrl, isYouTube, entered])

  useEffect(() => {
    applyVolume(volume)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume])

  /* ===== Clic « Entrer » = musique immédiate ===== */
  const enter = () => {
    try { sessionStorage.setItem(ENTER_KEY, '1') } catch { /* ignore */ }
    try { localStorage.setItem(INTERACT_KEY, '1') } catch { /* ignore */ }
    userDisabled.current = false
    setClosing(true)
    window.setTimeout(() => { setEntered(true); setClosing(false) }, 700)
    wantPlay.current = true
    play()
  }

  const toggle = () => {
    if (playing) {
      pause()
      userDisabled.current = true
      wantPlay.current = false
      try { localStorage.setItem(PREF_KEY, 'off') } catch { /* ignore */ }
    } else {
      userDisabled.current = false
      play()
      try { localStorage.setItem(PREF_KEY, 'on') } catch { /* ignore */ }
    }
  }

  const changeVolume = (v: number) => {
    setVolume(v)
    try { localStorage.setItem(VOL_KEY, String(v)) } catch { /* ignore */ }
  }

  if (!isFeatureOn || !trackUrl) return null

  return (
    <>
      <style>{`
        @keyframes mpPulse {
          0% { box-shadow: 0 0 0 0 hsl(var(--primary) / .55); }
          70% { box-shadow: 0 0 0 16px hsl(var(--primary) / 0); }
          100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0); }
        }
        .mp-pulse { animation: mpPulse 1.8s ease-out infinite; }
        @keyframes gateHub {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / .5), 0 25px 60px -20px hsl(var(--primary) / .6); }
          50% { box-shadow: 0 0 0 24px hsl(var(--primary) / 0), 0 25px 60px -20px hsl(var(--primary) / .6); }
        }
        .gate-hub { animation: gateHub 2.4s ease-out infinite; }
        @keyframes gateZoom {
          0%, 52%, 100% { transform: scale(1); }
          62% { transform: scale(1.28); }
          72% { transform: scale(1.12); }
          82% { transform: scale(1.22); }
        }
        .gate-zoom { animation: gateZoom 4.5s ease-in-out infinite; }
      `}</style>

      {/* ===== ✨ PORTE D'ENTRÉE LUXE (1 fois par session) ===== */}
      {showGate && (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-background px-6 text-center transition-opacity duration-700',
            closing && 'pointer-events-none opacity-0',
          )}
        >
          <div className="gate-hub flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary shadow-2xl ring-4 ring-white/60">
            {logoUrl ? (
              <img src={logoUrl} alt={brand} className="gate-zoom h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <span className="font-display text-4xl text-primary-foreground">{brand.charAt(0)}</span>
            )}
          </div>
          <h1 className="font-display text-4xl md:text-5xl">{brand}</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {translate({
              fr: 'Bienvenue dans votre univers d\'élégance. 🎵 La musique est activée pour une expérience inoubliable.',
              en: 'Welcome to your world of elegance. 🎵 Music is on for an unforgettable experience.',
              ar: 'مرحباً بكم في عالم الأناقة. 🎵 الموسيقى مفعّلة لتجربة لا تُنسى.',
            }, lang)}
          </p>
          <button
            onClick={enter}
            className="rounded-full bg-primary px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-xl transition hover:scale-105"
          >
            {translate({ fr: '✨ Entrer dans la boutique', en: '✨ Enter the boutique', ar: '✨ دخول المتجر' }, lang)}
          </button>
        </div>
      )}

      {isYouTube && (
        <div
          key={trackUrl}
          className="pointer-events-none fixed -left-[9999px] top-0 h-[2px] w-[2px] overflow-hidden"
          aria-hidden
        >
          <div ref={ytHost} />
        </div>
      )}

      {!isYouTube && <audio ref={audioRef} src={trackUrl} loop preload="none" />}

      <div className="fixed bottom-20 left-4 z-50 md:bottom-6 md:left-6">
        {open && (
          <div className="mb-2 flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
            <Volume2 className="h-4 w-4 text-primary" aria-hidden />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-24 accent-[hsl(var(--primary))]"
              aria-label={translate({ fr: 'Volume de la musique', en: 'Music volume', ar: 'مستوى الصوت' }, lang)}
            />
            <button onClick={() => setOpen(false)} aria-label={translate({ fr: 'Fermer', en: 'Close', ar: 'إغلاق' }, lang)}>
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
        <button
          onClick={() => { toggle(); setOpen(true) }}
          aria-pressed={playing}
          aria-label={
            playing
              ? translate({ fr: 'Couper la musique', en: 'Turn off music', ar: 'إيقاف الموسيقى' }, lang)
              : translate({ fr: 'Activer la musique', en: 'Turn on music', ar: 'تشغيل الموسيقى' }, lang)
          }
          title={translate({ fr: 'Musique', en: 'Music', ar: 'موسيقى' }, lang)}
          className={
            playing
              ? 'rounded-full bg-primary p-3.5 text-primary-foreground shadow-lg transition hover:opacity-90'
              : 'mp-pulse rounded-full border border-primary/40 bg-card p-3.5 text-primary shadow-lg transition hover:border-primary'
          }
        >
          <Music className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </>
  )
}