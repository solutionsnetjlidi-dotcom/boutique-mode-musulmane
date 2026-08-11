import { useEffect, useState } from 'react'

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: message }))
}

export default function Toaster() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let timer: number
    const handler = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setMessage(null), 3000)
    }
    window.addEventListener('app:toast', handler)
    return () => {
      window.removeEventListener('app:toast', handler)
      window.clearTimeout(timer)
    }
  }, [])

  if (!message) return null
  return (
    <div className="fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 md:bottom-8">
      <p role="status" className="animate-slide-up whitespace-nowrap rounded-full bg-foreground px-6 py-3 text-sm text-background shadow-xl">
        {message}
      </p>
    </div>
  )
}