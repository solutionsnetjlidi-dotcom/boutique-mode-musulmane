import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function usePendingOrdersCount(): number {
  const { isManager } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isManager) return
    let mounted = true
    const load = () =>
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then(({ count }) => { if (mounted) setCount(count ?? 0) })
        .catch(() => undefined)

    void load()
    const interval = window.setInterval(load, 30000)
    return () => { mounted = false; window.clearInterval(interval) }
  }, [isManager])

  return count
}