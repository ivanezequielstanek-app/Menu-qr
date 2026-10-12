// Editor de menú de la demo: misma interfaz que el panel real, pero en memoria
import { useMemo, useState } from 'react'
import { money, parsePrice } from '../lib/format'
import { Empty, Modal, Switch, useToast } from '../components/ui'
import { Plus, Edit, Trash, Up, Down, Eye, EyeOff, ImageIcon, Search, Star } from '../components/icons'
import PhotoPicker from '../components/PhotoPicker'
import { useDemo, uid } from './store'

export function ConfirmModal({ title = 'Confirmar', text, yes = 'Eliminar', onYes, onClose }) {
  return (
    <Modal title={title} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary btn-danger-fill" onClick={() => { onYes(); onClose() }} autoFocus>{yes}</button>
      </>}>
      <p className="confirm-text">{text}</p>
    </Modal>
  )
}

const byPos = (a, b) => (a.position ?? 0) - (b.position ?? 0)

export default function DemoMenuEditor() {
  const { state, update } = useDemo()
  const toast = useToast()
  const cats = [...state.categories].sort(byPos)
  const prods = [...state.products].sort(byPos)
  const [editing, setEditing] = useState(null)
  const [catModal, setCatModal] = useState(null)
  const [ask, setAsk] = useState(null)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? prods.filter((p) => p.name.toLowerCase().includes(s)) : prods
  }, [prods, q])

  function moveCategory(i, dir) {
    const j = i + dir
    if (j < 0 || j >= cats.length) return
    const arr = [...cats];[arr[i], arr[j]] = [arr[j], arr[i]]
    update('categories', arr.map((c, idx) => ({ ...c, position: idx })))
  }
  function moveProduct(list, i, dir) {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const arr = [...list];[arr[i], arr[j]] = [arr[j], arr[i]]
    const pos = Object.fromEntries(arr.map((p, idx) => [p.id, idx]))
    update('products', (all) => all.map((p) => (p.id in pos ? { ...p, position: pos[p.id] } : p)))
  }
  const patchProduct = (p, patch) => update('products', (all) => all.map((x) => (x.id === p.id ? { ...x, ...patch } : x)))
  const patchCategory = (c, patch) => update('categories', (all) => all.map((x) => (x.id === c.id ? { ...x, ...patch } : x)))

  function deleteProduct(p) {
    setAsk({
      text: `¿Eliminar "${p.name}"? En el panel real esta acción no se puede deshacer.`,
      onYes: () => { update('products', (all) => all.filter((x) => x.id !== p.id)); toast('Producto eliminado') },
    })
  }
  function deleteCategory(c) {
    const n = prods.filter((p) => p.category_id === c.id).length
    setAsk({
      text: n ? `Se eliminará "${c.name}" junto con sus ${n} productos. ¿Continuar?` : `¿Eliminar la categoría "${c.name}"?`,
      onYes: () => {
        update('categories', (all) => all.filter((x) => x.id !== c.id))
        update('products', (all) => all.filter((p) => p.category_id !== c.id))
        toast('Categoría eliminada')
      },
    })
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Menú</h1>
          <p className="muted">{prods.length} productos en {cats.length} categorías · tocá un producto para editarlo</p>
        </div>
        <div className="page-actions">
          {prods.length > 6 && (
            <label className="search">
              <Search /><input id="demo-search" placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto" />
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
                <button className="icon-btn" onClick={() => moveCategory(i, -1)} disabled={i === 0} aria-label="Subir categoría"><Up /></button>
                <button className="icon-btn" onClick={() => moveCategory(i, 1)} disabled={i === cats.length - 1} aria-label="Bajar categoría"><Down /></button>
                <button className="icon-btn" onClick={() => patchCategory(c, { visible: !c.visible })} aria-label={c.visible ? 'Ocultar categoría' : 'Mostrar categoría'} title={c.visible ? 'Ocultar del menú' : 'Mostrar en el menú'}>{c.visible ? <Eye /> : <EyeOff />}</button>
                <button className="icon-btn" onClick={() => setCatModal({ cat: c })} aria-label="Renombrar"><Edit /></button>
                <button className="icon-btn danger" onClick={() => deleteCategory(c)} aria-label="Eliminar categoría"><Trash /></button>
              </div>
            </header>
            <ul className="prod-list">
              {items.map((p, pi) => (
                <li key={p.id} className={`prod-row ${p.available ? '' : 'is-out'}`}>
                  <button className="prod-main" onClick={() => setEditing({ product: p })}>
                    <span className="thumb">{p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <ImageIcon />}</span>
                    <span className="prod-info">
                      <strong>{p.name}</strong>
                      {p.description && <span className="muted">{p.description}</span>}
                    </span>
                    <span className="prod-price">{money(p.price)}</span>
                  </button>
                  <div className="prod-tools">
                    <Switch checked={p.available} onChange={(v) => patchProduct(p, { available: v })} label={p.available ? 'Disponible' : 'Agotado'} />
                    <div className="row-actions">
                      <button className={`icon-btn star-btn ${p.featured ? 'is-on' : ''}`} onClick={() => patchProduct(p, { featured: !p.featured })}
                        aria-pressed={!!p.featured} aria-label={p.featured ? 'Quitar de recomendados' : 'Marcar como recomendado'}
                        title={p.featured ? 'Recomendado' : 'Marcar como recomendado'}><Star filled={p.featured} /></button>
                      {!q && <>
                        <button className="icon-btn" onClick={() => moveProduct(all, pi, -1)} disabled={pi === 0} aria-label="Subir"><Up /></button>
                        <button className="icon-btn" onClick={() => moveProduct(all, pi, 1)} disabled={pi === all.length - 1} aria-label="Bajar"><Down /></button>
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
        <DemoProductForm categories={cats} products={prods} product={editing.product} defaultCategory={editing.category_id}
          onClose={() => setEditing(null)}
          onSave={(item, isNew) => {
            update('products', (all) => (isNew ? [...all, item] : all.map((x) => (x.id === item.id ? item : x))))
            setEditing(null); toast(isNew ? 'Producto agregado' : 'Producto actualizado')
          }} />
      )}
      {catModal && (
        <CategoryModal cat={catModal.cat} onClose={() => setCatModal(null)}
          onSave={(name) => {
            if (catModal.cat) patchCategory(catModal.cat, { name })
            else update('categories', (all) => [...all, { id: uid('c'), name, position: all.length, visible: true }])
            setCatModal(null); toast(catModal.cat ? 'Categoría actualizada' : 'Categoría creada')
          }} />
      )}
      {ask && <ConfirmModal text={ask.text} onYes={ask.onYes} onClose={() => setAsk(null)} />}
    </div>
  )
}

function DemoProductForm({ categories, products, product, defaultCategory, onClose, onSave }) {
  const [f, setF] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product ? String(product.price).replace('.', ',') : '',
    category_id: product?.category_id || defaultCategory || categories[0]?.id || '',
    available: product?.available ?? true,
    featured: product?.featured ?? false,
  })
  const [photo, setPhoto] = useState({ url: product?.image_url || null })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))

  function save(e) {
    e.preventDefault()
    const price = parsePrice(f.price)
    if (!f.name.trim()) return setError('Escribí el nombre del producto.')
    if (!Number.isFinite(price) || price < 0) return setError('Revisá el precio. Ejemplo: 12500 o 12.500,50')
    if (!f.category_id) return setError('Elegí una categoría.')
    const moved = !product || product.category_id !== f.category_id
    const position = moved ? products.filter((p) => p.category_id === f.category_id).length : product.position
    onSave({
      ...(product || { id: uid('p') }),
      name: f.name.trim(), description: f.description.trim() || null, price,
      category_id: f.category_id, available: f.available, featured: f.featured,
      image_url: photo.url || null, position,
    }, !product)
  }

  return (
    <Modal title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose} size="lg"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="product-form" className="btn btn-primary">Guardar</button>
      </>}>
      <form id="product-form" className="form-grid" onSubmit={save}>
        <div className="form-col">
          <label className="field"><span>Nombre</span>
            <input id="pf-name" className="input" value={f.name} onChange={set('name')} placeholder="Ej: Milanesa napolitana" autoFocus />
          </label>
          <label className="field"><span>Descripción <em>(opcional)</em></span>
            <textarea id="pf-desc" className="input" rows={3} value={f.description} onChange={set('description')} placeholder="Ingredientes, tamaño, acompañamiento…" />
          </label>
          <div className="field-row">
            <label className="field"><span>Precio</span>
              <div className="input-prefix"><b>$</b><input id="pf-price" className="input" inputMode="decimal" value={f.price} onChange={set('price')} placeholder="0" /></div>
            </label>
            <label className="field"><span>Categoría</span>
              <select id="pf-cat" className="input" value={f.category_id} onChange={set('category_id')}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="switch-stack">
            <Switch checked={f.available} onChange={set('available')} label={f.available ? 'Disponible' : 'Agotado (se muestra pero no se puede pedir)'} />
            <Switch checked={f.featured} onChange={set('featured')} label="Recomendado (aparece destacado arriba del menú)" />
          </div>
        </div>
        <div className="form-col">
          <span className="field-label">Foto</span>
          <PhotoPicker url={photo.url} onChange={setPhoto} />
        </div>
        {error && <p className="form-error form-span">{error}</p>}
      </form>
    </Modal>
  )
}

function CategoryModal({ cat, onClose, onSave }) {
  const [name, setName] = useState(cat?.name || '')
  const [err, setErr] = useState('')
  function save(e) {
    e.preventDefault()
    if (!name.trim()) return setErr('Escribí un nombre.')
    onSave(name.trim())
  }
  return (
    <Modal title={cat ? 'Renombrar categoría' : 'Nueva categoría'} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="cat-form" className="btn btn-primary">Guardar</button>
      </>}>
      <form id="cat-form" onSubmit={save}>
        <label className="field"><span>Nombre</span>
          <input id="cat-name" className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Principales" />
        </label>
        {err && <p className="form-error">{err}</p>}
      </form>
    </Modal>
  )
}
