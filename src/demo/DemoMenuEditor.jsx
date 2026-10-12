// Editor de menú de la demo: la misma pantalla que el panel real, pero guarda en memoria
import { useState } from 'react'
import { useToast } from '../components/ui'
import MenuEditorView, { ProductFormView, CategoryModalView } from '../components/MenuEditorView'
import { useDemo, uid } from './store'

export default function DemoMenuEditor() {
  const { state, update } = useDemo()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [catModal, setCatModal] = useState(null)

  const reorder = (key) => (list, i, dir) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const arr = [...list];[arr[i], arr[j]] = [arr[j], arr[i]]
    const pos = Object.fromEntries(arr.map((x, idx) => [x.id, idx]))
    update(key, (all) => all.map((x) => (x.id in pos ? { ...x, position: pos[x.id] } : x)))
  }
  const patch = (key) => (item, change) => update(key, (all) => all.map((x) => (x.id === item.id ? { ...x, ...change } : x)))

  function saveProduct({ values, photo }) {
    const p = editing.product
    const prods = state.products
    const moved = !p || p.category_id !== values.category_id
    const position = moved ? prods.filter((x) => x.category_id === values.category_id).length : p.position
    const item = { ...(p || { id: uid('p') }), ...values, position, image_url: photo.url || null }
    update('products', (all) => (p ? all.map((x) => (x.id === item.id ? item : x)) : [...all, item]))
    setEditing(null); toast(p ? 'Producto actualizado' : 'Producto agregado')
  }

  function saveCategory(name) {
    const c = catModal.cat
    if (c) patch('categories')(c, { name })
    else update('categories', (all) => [...all, { id: uid('c'), name, position: all.length, visible: true }])
    setCatModal(null); toast(c ? 'Categoría actualizada' : 'Categoría creada')
  }

  return (
    <>
      <MenuEditorView
        categories={state.categories} products={state.products}
        onEditProduct={setEditing}
        onNewCategory={() => setCatModal({})}
        onRenameCategory={(cat) => setCatModal({ cat })}
        onPatchProduct={patch('products')}
        onPatchCategory={patch('categories')}
        onMoveCategory={reorder('categories')}
        onMoveProduct={reorder('products')}
        onDeleteProduct={(p) => { update('products', (all) => all.filter((x) => x.id !== p.id)); toast('Producto eliminado') }}
        onDeleteCategory={(c) => {
          update('categories', (all) => all.filter((x) => x.id !== c.id))
          update('products', (all) => all.filter((x) => x.category_id !== c.id))
          toast('Categoría eliminada')
        }}
        onSavePrices={async (list) => {
          const pos = Object.fromEntries(list.map((x) => [x.id, x.price]))
          update('products', (all) => all.map((p) => (p.id in pos ? { ...p, price: pos[p.id] } : p)))
          toast(list.length === 1 ? 'Precio actualizado' : `${list.length} precios actualizados`)
          return true
        }}
      />
      {editing && (
        <ProductFormView categories={[...state.categories].sort((a, b) => a.position - b.position)}
          product={editing.product} defaultCategory={editing.category_id}
          onClose={() => setEditing(null)} onSubmit={saveProduct} />
      )}
      {catModal && <CategoryModalView cat={catModal.cat} onClose={() => setCatModal(null)} onSubmit={saveCategory} />}
    </>
  )
}
