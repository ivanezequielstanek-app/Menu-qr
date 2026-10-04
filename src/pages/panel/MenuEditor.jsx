import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, imageUrl, friendlyError, BUCKET } from '../../lib/supabase'
import { money } from '../../lib/format'
import { Empty, Modal, Spinner, Switch, useToast } from '../../components/ui'
import { Plus, Edit, Trash, Up, Down, Eye, EyeOff, ImageIcon, Search } from '../../components/icons'
import ProductForm from './ProductForm'

export default function MenuEditor({ restaurant }) {
  const rid = restaurant.id
  const toast = useToast()
  const [cats, setCats] = useState(null)
  const [prods, setProds] = useState([])
  const [editing, setEditing] = useState(null)   // { product?, category_id? }
  const [catModal, setCatModal] = useState(null) // { cat? }
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', rid).order('position'),
      supabase.from('products').select('*').eq('restaurant_id', rid).order('position'),
    ])
    if (c.error || p.error) toast(friendlyError(c.error || p.error), 'error')
    setCats(c.data || []); setProds(p.data || [])
  }, [rid, toast])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? prods.filter((p) => p.name.toLowerCase().includes(s)) : prods
  }, [prods, q])

  async function reorder(table, list, i, dir) {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const arr = [...list];[arr[i], arr[j]] = [arr[j], arr[i]]
    const updates = arr.map((x, idx) => ({ id: x.id, position: idx })).filter((u, idx) => list[idx]?.id !== u.id || list[idx].position !== idx)
    if (table === 'categories') setCats(arr.map((x, idx) => ({ ...x, position: idx })))
    else setProds((all) => all.map((p) => { const u = updates.find((x) => x.id === p.id); return u ? { ...p, position: u.position } : p }).sort((a, b) => a.position - b.position))
    const res = await Promise.all(updates.map((u) => supabase.from(table).update({ position: u.position }).eq('id', u.id)))
    if (res.some((r) => r.error)) { toast('No se pudo reordenar', 'error'); load() }
  }

  async function patchProduct(p, patch) {
    setProds((all) => all.map((x) => (x.id === p.id ? { ...x, ...patch } : x)))
    const { error } = await supabase.from('products').update(patch).eq('id', p.id)
    if (error) { toast(friendlyError(error), 'error'); load() }
  }

  async function patchCategory(c, patch) {
    setCats((all) => all.map((x) => (x.id === c.id ? { ...x, ...patch } : x)))
    const { error } = await supabase.from('categories').update(patch).eq('id', c.id)
    if (error) { toast(friendlyError(error), 'error'); load() }
  }

  async function deleteProduct(p) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) return toast(friendlyError(error), 'error')
    if (p.image_path) supabase.storage.from(BUCKET).remove([p.image_path])
    toast('Producto eliminado'); load()
  }

  async function deleteCategory(c) {
    const items = prods.filter((p) => p.category_id === c.id)
    const text = items.length
      ? `Se eliminará "${c.name}" junto con sus ${items.length} productos. ¿Continuar?`
      : `¿Eliminar la categoría "${c.name}"?`
    if (!confirm(text)) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return toast(friendlyError(error), 'error')
    const imgs = items.map((p) => p.image_path).filter(Boolean)
    if (imgs.length) supabase.storage.from(BUCKET).remove(imgs)
    toast('Categoría eliminada'); load()
  }

  if (!cats) return <Spinner label="Cargando menú…" />

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Menú</h1>
          <p className="muted">{prods.length} productos en {cats.length} categorías</p>
        </div>
        <div className="page-actions">
          {prods.length > 6 && (
            <label className="search">
              <Search /><input placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto" />
            </label>
          )}
          <button className="btn btn-secondary" onClick={() => setCatModal({})}><Plus /> Categoría</button>
          {cats.length > 0 && <button className="btn btn-primary" onClick={() => setEditing({ category_id: cats[0].id })}><Plus /> Producto</button>}
        </div>
      </div>

      {cats.length === 0 && (
        <Empty title="Empezá creando una categoría" text="Por ejemplo: Entradas, Principales, Bebidas, Postres."
          action={<button className="btn btn-primary" onClick={() => setCatModal({})}><Plus /> Crear categoría</button>} />
      )}

      {cats.map((c, i) => {
        const all = prods.filter((p) => p.category_id === c.id)
        const items = filtered.filter((p) => p.category_id === c.id)
        if (q && items.length === 0) return null
        return (
          <section key={c.id} className={`cat-card ${c.visible ? '' : 'is-hidden'}`}>
            <header className="cat-head">
              <div className="cat-title">
                <h2>{c.name}</h2>
                <span className="badge">{all.length}</span>
                {!c.visible && <span className="badge badge-warn">Oculta</span>}
              </div>
              <div className="row-actions">
                <button className="icon-btn" onClick={() => reorder('categories', cats, i, -1)} disabled={i === 0} aria-label="Subir categoría"><Up /></button>
                <button className="icon-btn" onClick={() => reorder('categories', cats, i, 1)} disabled={i === cats.length - 1} aria-label="Bajar categoría"><Down /></button>
                <button className="icon-btn" onClick={() => patchCategory(c, { visible: !c.visible })} aria-label={c.visible ? 'Ocultar categoría' : 'Mostrar categoría'} title={c.visible ? 'Ocultar del menú' : 'Mostrar en el menú'}>{c.visible ? <Eye /> : <EyeOff />}</button>
                <button className="icon-btn" onClick={() => setCatModal({ cat: c })} aria-label="Renombrar"><Edit /></button>
                <button className="icon-btn danger" onClick={() => deleteCategory(c)} aria-label="Eliminar categoría"><Trash /></button>
              </div>
            </header>

            <ul className="prod-list">
              {items.map((p, pi) => (
                <li key={p.id} className={`prod-row ${p.available ? '' : 'is-out'}`}>
                  <button className="prod-main" onClick={() => setEditing({ product: p })}>
                    <span className="thumb">{p.image_path ? <img src={imageUrl(p.image_path)} alt="" loading="lazy" /> : <ImageIcon />}</span>
                    <span className="prod-info">
                      <strong>{p.name}</strong>
                      {p.description && <span className="muted">{p.description}</span>}
                    </span>
                    <span className="prod-price">{money(p.price)}</span>
                  </button>
                  <div className="prod-tools">
                    <Switch checked={p.available} onChange={(v) => patchProduct(p, { available: v })} label={p.available ? 'Disponible' : 'Agotado'} />
                    <div className="row-actions">
                      {!q && <>
                        <button className="icon-btn" onClick={() => reorder('products', all, pi, -1)} disabled={pi === 0} aria-label="Subir"><Up /></button>
                        <button className="icon-btn" onClick={() => reorder('products', all, pi, 1)} disabled={pi === all.length - 1} aria-label="Bajar"><Down /></button>
                      </>}
                      <button className="icon-btn danger" onClick={() => deleteProduct(p)} aria-label="Eliminar"><Trash /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {!q && <button className="add-row" onClick={() => setEditing({ category_id: c.id })}><Plus /> Agregar producto en {c.name}</button>}
          </section>
        )
      })}

      {editing && (
        <ProductForm
          restaurantId={rid} categories={cats} product={editing.product} defaultCategory={editing.category_id}
          nextPosition={prods.filter((p) => p.category_id === editing.category_id).length}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); toast(msg); load() }}
        />
      )}
      {catModal && (
        <CategoryModal restaurantId={rid} cat={catModal.cat} position={cats.length}
          onClose={() => setCatModal(null)} onSaved={(msg) => { setCatModal(null); toast(msg); load() }} />
      )}
    </div>
  )
}

function CategoryModal({ restaurantId, cat, position, onClose, onSaved }) {
  const [name, setName] = useState(cat?.name || '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(e) {
    e.preventDefault()
    if (!name.trim()) return setErr('Escribí un nombre.')
    setBusy(true)
    const { error } = cat
      ? await supabase.from('categories').update({ name: name.trim() }).eq('id', cat.id)
      : await supabase.from('categories').insert({ restaurant_id: restaurantId, name: name.trim(), position })
    setBusy(false)
    if (error) return setErr(friendlyError(error))
    onSaved(cat ? 'Categoría actualizada' : 'Categoría creada')
  }
  return (
    <Modal title={cat ? 'Renombrar categoría' : 'Nueva categoría'} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="cat-form" className="btn btn-primary" disabled={busy}>Guardar</button>
      </>}>
      <form id="cat-form" onSubmit={save}>
        <label className="field"><span>Nombre</span>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Principales" />
        </label>
        {err && <p className="form-error">{err}</p>}
      </form>
    </Modal>
  )
}
