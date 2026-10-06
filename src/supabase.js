import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export const BUCKET = 'menu-images'

export function imageUrl(path) {
  if (!path) return null
  if (/^(data:|blob:|https?:)/.test(path)) return path
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Traduce errores técnicos a mensajes entendibles
export function friendlyError(err) {
  const m = (err?.message || String(err || '')).toLowerCase()
  if (m.includes('payload too large') || m.includes('exceeded the maximum')) return 'La imagen supera los 200 KB permitidos.'
  if (m.includes('duplicate key') && m.includes('slug')) return 'Esa dirección ya está en uso por otro local.'
  if (m.includes('row-level security') || m.includes('permission')) return 'No tenés permiso para hacer este cambio.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sin conexión. Revisá internet e intentá de nuevo.'
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.'
  return err?.message || 'Ocurrió un error inesperado.'
}
