import { useCallback, useEffect, useState } from 'react'
import { supabase, imageUrl, friendlyError, BUCKET } from '../../lib/supabase'
import { Spinner, useToast } from '../../components/ui'
import MenuEditorView, { CategoryModalView } from '../../components/MenuEditorView'
import ProductForm from './ProductForm'

// Editor de menú del panel real. La interfaz (MenuEditorView) es la misma que usa la demo.
export default function MenuEditor({ restaurant }) {
  const rid = restaurant.id
  const toast = useToast()
  const [cats, setCats] = useState(null)
  const [prods, setProds] = useState([])
  const [editing, setEditing] = useState(null)   // { product?, category_id? }
  const [catModal, setCatModal] = useState(null) // { cat? }
  const [catBusy, setCatBusy] = useState(false)
  const [catErr, setCatErr] = useState('')

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', rid).order('position'),
      supabase.from('products').select('*').eq('restaurant_id', rid).order('position'),
    ])
    if (c.error || p.error) toast(friendlyError(c.error || p.error), 'error')
    setCats(c.data || [])
    setProds((p.data || []).map((x) => ({ ...x, image_url: imageUrl(x.image_path) })))
  }, [rid, toast])
  useEffect(() => { load() }, [load])

  async function move(table, list, i, dir) {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const arr = [...list];[arr[i], arr[j]] = [arr[j], arr[i]]
    const updates = arr.map((x, idx) => ({ id: x.id, position: idx })).filter((u, idx) => list[idx]?.id !== u.id || list[idx].position !== idx)
    const pos = Object.fromEntries(updates.map((u) => [u.id, u.position]))
    const apply = (all) => all.map((x) => (x.id in pos ? { ...x, position: pos[x.id] } : x))
    if (table === 'categories') setCats(apply); else setProds(apply)
    const res = await Promise.all(updates.map((u) => supabase.from(table).update({ position: u.position }).eq('id', u.id)))
    if (res.some((r) => r.error)) { toast('No se pudo reordenar', 'error'); load() }
  }

  async function patch(table, item, change) {
    const set = table === 'categories' ? setCats : setProds
    set((all) => all.map((x) => (x.id === item.id ? { ...x, ...change } : x)))
    const { error } = await supabase.from(table).update(change).eq('id', item.id)
    if (error) { toast(friendlyError(error), 'error'); load() }
  }

  async function deleteProduct(p) {
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) return toast(friendlyError(error), 'error')
    if (p.image_path) supabase.storage.from(BUCKET).remove([p.image_path])
    toast('Producto eliminado'); load()
  }

  async function deleteCategory(c) {
    const imgs = prods.filter((p) => p.category_id === c.id).map((p) => p.image_path).filter(Boolean)
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return toast(friendlyError(error), 'error')
    if (imgs.length) supabase.storage.from(BUCKET).remove(imgs)
    toast('Categoría eliminada'); load()
  }

  async function savePrices(list) {
    const now = new Date().toISOString()
    const res = await Promise.all(list.map((x) => supabase.from('products').update({ price: x.price, updated_at: now }).eq('id', x.id)))
    const failed = res.filter((r) => r.error).length
    if (failed) { toast(`No se pudieron guardar ${failed} precios. Revisá la conexión.`, 'error'); load(); return false }
    const pos = Object.fromEntries(list.map((x) => [x.id, x.price]))
    setProds((all) => all.map((p) => (p.id in pos ? { ...p, price: pos[p.id] } : p)))
    toast(list.length === 1 ? 'Precio actualizado' : `${list.length} precios actualizados`)
    return true
  }

  async function saveCategory(name) {
    setCatBusy(true); setCatErr('')
    const c = catModal.cat
    const { error } = c
      ? await supabase.from('categories').update({ name }).eq('id', c.id)
      : await supabase.from('categories').insert({ restaurant_id: rid, name, position: cats.length })
    setCatBusy(false)
    if (error) return setCatErr(friendlyError(error))
    setCatModal(null); toast(c ? 'Categoría actualizada' : 'Categoría creada'); load()
  }

  if (!cats) return <Spinner label="Cargando menú…" />

  return (
    <>
      <MenuEditorView
        categories={cats} products={prods}
        onEditProduct={setEditing}
        onNewCategory={() => { setCatErr(''); setCatModal({}) }}
        onRenameCategory={(cat) => { setCatErr(''); setCatModal({ cat }) }}
        onPatchProduct={(p, c) => patch('products', p, c)}
        onPatchCategory={(cat, c) => patch('categories', cat, c)}
        onMoveCategory={(list, i, dir) => move('categories', list, i, dir)}
        onMoveProduct={(list, i, dir) => move('products', list, i, dir)}
        onDeleteProduct={deleteProduct}
        onDeleteCategory={deleteCategory}
        onSavePrices={savePrices}
      />
      {editing && (
        <ProductForm
          restaurantId={rid} categories={cats} products={prods} product={editing.product} defaultCategory={editing.category_id}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); toast(msg); load() }}
        />
      )}
      {catModal && (
        <CategoryModalView cat={catModal.cat} saving={catBusy} error={catErr}
          onClose={() => setCatModal(null)} onSubmit={saveCategory} />
      )}
    </>
  )
}
