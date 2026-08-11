import { supabase } from '@/lib/supabase'

/** Trace les actions sensibles (section 97). Best-effort : ne bloque jamais l'UX. */
export async function logAudit(
  action: string,
  entityType?: string,
  entityId?: string,
  newValues?: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      new_values: newValues ?? null,
    })
  } catch {
    // silencieux : l'audit ne doit jamais casser l'expérience
  }
}