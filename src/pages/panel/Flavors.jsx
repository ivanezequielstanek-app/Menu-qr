import { useCallback, useEffect, useState } from 'react'
import { supabase, friendlyError } from '../../lib/supabase'
import { Empty, Spinner, useToast } from '../../components/ui'
import FlavorsEditorView from '../../components/FlavorsEditorView'

// Sabores del panel real (la interfaz es la misma que en la demo)
export default function Flavors({ restaurant }) {
  const rid = restaurant.id
  const toast = useToast()
  const [list, setList] = useState(null)
  const [missing, setMissing] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('flavors').select('*').eq('restaurant_id', rid).order('position')
    if (error) {
      if (/flavors|does not exist|schema cache/i.test(error.message)) { setMissing(true); setList([]); return }
      toast(friendlyError(error), 'error')
    }
    setList(data || [])
  }, [rid, toast])
  useEffect(() => { load() }, [load])

  async function add(items) {
    const start = (list?.reduce((m, f) => Math.max(m, f.position ?? 0), -1) ?? -1) + 1
    const rows = items.map((x, i) => ({ restaurant_id: rid, name: x.name, grp: x.grp, position: start + i }))
    const { error } = await supabase.from('flavors').insert(rows)
    if (error) return toast(friendlyError(error), 'error')
    toast(rows.length === 1 ? 'Sabor agregado' : `${rows.length} sabores agregados`); load()
  }

  async function patch(f, change) {
    setList((l) => l.map((x) => (x.id === f.id ? { ...x, ...change } : x)))
    const { error } = await supabase.from('flavors').update(change).eq('id', f.id)
    if (error) { toast(friendlyError(error), 'error'); load() }
  }

  async function remove(f) {
    const { error } = await supabase.from('flavors').delete().eq('id', f.id)
    if (error) return toast(friendlyError(error), 'error')
    toast('Sabor eliminado'); load()
  }

  async function move(group, i, dir) {
    const j = i + dir
    if (j < 0 || j >= group.length) return
    const a = group[i], b = group[j]
    const pa = a.position ?? 0, pb = b.position ?? 0
    const [na, nb] = pa === pb ? [pb + dir, pa] : [pb, pa]
    setList((l) => l.map((x) => (x.id === a.id ? { ...x, position: na } : x.id === b.id ? { ...x, position: nb } : x)))
    const res = await Promise.all([
      supabase.from('flavors').update({ position: na }).eq('id', a.id),
      supabase.from('flavors').update({ position: nb }).eq('id', b.id),
    ])
    if (res.some((r) => r.error)) { toast('No se pudo reordenar', 'error'); load() }
  }

  async function allAvailable() {
    setList((l) => l.map((x) => ({ ...x, available: true })))
    const { error } = await supabase.from('flavors').update({ available: true }).eq('restaurant_id', rid).eq('available', false)
    if (error) { toast(friendlyError(error), 'error'); load() } else toast('Todos los sabores disponibles')
  }

  if (!list) return <Spinner label="Cargando sabores…" />
  if (missing) return (
    <Empty title="Falta activar los sabores"
      text="El administrador tiene que ejecutar la actualización 003_sabores.sql en Supabase. Después de eso, esta sección queda lista para usar." />
  )
  return <FlavorsEditorView flavors={list} onAdd={add} onPatch={patch} onDelete={remove} onMove={move} onAllAvailable={allAvailable} />
}
