// Pantalla del editor de menú. La usan el panel real (con Supabase) y la demo (en memoria):
// acá solo está la interfaz; cada uno le pasa sus funciones para guardar.
import { useMemo, useState } from 'react'
import { money, parsePrice } from '../lib/format'
import { ConfirmModal, Empty, Modal, Switch } from './ui'
import PhotoPicker from './PhotoPicker'
import { Plus, Edit, Trash, Up, Down, Eye, EyeOff, ImageIcon, Search, Star, Tag, Close } from './icons'

const byPos = (a, b) => (a.position ?? 0) - (b.position ?? 0)
const fmtInput = (n) => String(n ?? '').replace('.', ',')

/**
 * props:
 *  categories, products
 *  onEditProduct({ product } | { category_id }), onNewCategory(), onRenameCategory(cat)
 *  onPatchProduct(p, patch), onPatchCategory(c, patch)
 *  onMoveCategory(sortedCats, i, dir), onMoveProduct(sortedList, i, dir)
 *  onDeleteProduct(p), onDeleteCategory(c, count)
 *  onSavePrices([{ id, price }]) → Promise
 */
export default function MenuEditorView({
  categories, products, onEditProduct, onNewCategory, onRenameCategory,
  onPatchProduct, onPatchCategory, onMoveCategory, onMoveProduct, onDeleteProduct, onDeleteCategory, onSavePrices,
}) {
  const cats = useMemo(() => [...categories].sort(byPos), [categories])
  const prods = useMemo(() => [...products].sort(byPos), [products])
  const [q, setQ] = useState('')
  const [ask, setAsk] = useState(null)
  const [prices, setPrices] = useState(null) // modo precios rápidos: { [id]: texto }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? prods.filter((p) => p.name.toLowerCase().includes(s)) : prods
  }, [prods, q])

  const startPrices = () => setPrices(Object.fromEntries(prods.map((p) => [p.id, fmtInput(p.price)])))
  const changed = prices ? prods.filter((p) => {
    const v = parsePrice(prices[p.id])
    return Number.isFinite(v) && v !== Number(p.price)
  }) : []
  const invalid = prices ? prods.filter((p) => !Number.isFinite(parsePrice(prices[p.id])) || parsePrice(prices[p.id]) < 0) : []

  const confirmDeleteProduct = (p) => setAsk({
    text: `¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`, onYes: () => onDeleteProduct(p),
  })
  const confirmDeleteCategory = (c) => {
    const n = prods.filter((p) => p.category_id === c.id).length
    setAsk({
      text: n ? `Se eliminará "${c.name}" junto con sus ${n} productos. ¿Continuar?` : `¿Eliminar la categoría "${c.name}"?`,
      onYes: () => onDeleteCategory(c, n),
    })
  }

  return (
    <div className={prices ? 'is-pricing' : ''}>
      <div className="page-head">
        <div>
          <h1>{prices ? 'Precios' : 'Menú'}</h1>
          <p className="muted">
            {prices ? 'Cambiá los precios que necesites y guardá todo junto.'
              : `${prods.length} productos en ${cats.length} categorías · tocá un producto para editarlo`}
          </p>
        </div>
        {!prices && (
          <div className="page-actions menu-actions">
            {prods.length > 6 && (
              <label className="search">
                <Search /><input id="menu-search" type="search" placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto" />
                {q && <button type="button" className="search-clear" onClick={() => setQ('')} aria-label="Borrar búsqueda"><Close size={16} /></button>}
              </label>
            )}
            {prods.length > 0 && <button className="btn btn-secondary" onClick={() => { setQ(''); startPrices() }}><Tag /> Precios</button>}
            <button className="btn btn-secondary" onClick={onNewCategory}><Plus /> Categoría</button>
            {cats.length > 0 && <button className="btn btn-primary hide-mobile" onClick={() => onEditProduct({ category_id: cats[0].id })}><Plus /> Producto</button>}
          </div>
        )}
      </div>

      {prices && <BulkTools prods={prods} prices={prices} setPrices={setPrices} />}

      {cats.length === 0 && (
        <Empty title="Empezá creando una categoría" text="Por ejemplo: Entradas, Principales, Bebidas, Postres."
          action={<button className="btn btn-primary" onClick={onNewCategory}><Plus /> Crear categoría</button>} />
      )}

      {cats.map((c, i) => {
        const all = prods.filter((p) => p.category_id === c.id)
        const items = filtered.filter((p) => p.category_id === c.id)
        if (q && items.length === 0) return null
        if (prices && all.length === 0) return null
        return (
          <section key={c.id} className={`cat-card ${c.visible ? '' : 'is-hidden'}`}>
            <header className="cat-head">
              <div className="cat-title">
                <h2>{c.name}</h2>
                <span className="badge">{all.length}</span>
                {!c.visible && <span className="badge badge-warn">Oculta</span>}
              </div>
              {!prices && (
                <div className="row-actions">
                  <button className="icon-btn" onClick={() => onMoveCategory(cats, i, -1)} disabled={i === 0} aria-label="Subir categoría"><Up /></button>
                  <button className="icon-btn" onClick={() => onMoveCategory(cats, i, 1)} disabled={i === cats.length - 1} aria-label="Bajar categoría"><Down /></button>
                  <button className="icon-btn" onClick={() => onPatchCategory(c, { visible: !c.visible })} aria-label={c.visible ? 'Ocultar categoría' : 'Mostrar categoría'} title={c.visible ? 'Ocultar del menú' : 'Mostrar en el menú'}>{c.visible ? <Eye /> : <EyeOff />}</button>
                  <button className="icon-btn" onClick={() => onRenameCategory(c)} aria-label="Renombrar"><Edit /></button>
                  <button className="icon-btn danger" onClick={() => confirmDeleteCategory(c)} aria-label="Eliminar categoría"><Trash /></button>
                </div>
              )}
            </header>

            <ul className="prod-list">
              {items.map((p, pi) => prices ? (
                <li key={p.id} className="prod-row price-row">
                  <span className="thumb">{p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <ImageIcon />}</span>
                  <label className="price-name" htmlFor={`price-${p.id}`}>
                    <strong>{p.name}</strong>
                    {changed.some((x) => x.id === p.id) && <span className="muted">antes {money(p.price)}</span>}
                  </label>
                  <div className={`input-prefix price-input ${invalid.some((x) => x.id === p.id) ? 'is-bad' : ''}`}>
                    <b>$</b>
                    <input id={`price-${p.id}`} className="input" inputMode="decimal" enterKeyHint="next" value={prices[p.id] ?? ''}
                      onChange={(e) => setPrices((s) => ({ ...s, [p.id]: e.target.value }))} onFocus={(e) => e.target.select()} />
                  </div>
                </li>
              ) : (
                <li key={p.id} className={`prod-row ${p.available ? '' : 'is-out'}`}>
                  <button className="prod-main" onClick={() => onEditProduct({ product: p })}>
                    <span className="thumb">{p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <ImageIcon />}</span>
                    <span className="prod-info">
                      <strong>{p.name}</strong>
                      {p.description && <span className="muted">{p.description}</span>}
                    </span>
                    <span className="prod-price">{money(p.price)}</span>
                  </button>
                  <div className="prod-tools">
                    <Switch checked={p.available} onChange={(v) => onPatchProduct(p, { available: v })} label={p.available ? 'Disponible' : 'Agotado'} />
                    <div className="row-actions">
                      <button className={`icon-btn star-btn ${p.featured ? 'is-on' : ''}`} onClick={() => onPatchProduct(p, { featured: !p.featured })}
                        aria-pressed={!!p.featured} aria-label={p.featured ? 'Quitar de recomendados' : 'Marcar como recomendado'}
                        title={p.featured ? 'Recomendado' : 'Marcar como recomendado'}><Star filled={p.featured} /></button>
                      {!q && <>
                        <button className="icon-btn" onClick={() => onMoveProduct(all, pi, -1)} disabled={pi === 0} aria-label="Subir"><Up /></button>
                        <button className="icon-btn" onClick={() => onMoveProduct(all, pi, 1)} disabled={pi === all.length - 1} aria-label="Bajar"><Down /></button>
                      </>}
                      <button className="icon-btn danger" onClick={() => confirmDeleteProduct(p)} aria-label="Eliminar"><Trash /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {!q && !prices && <button className="add-row" onClick={() => onEditProduct({ category_id: c.id })}><Plus /> Agregar producto en {c.name}</button>}
          </section>
        )
      })}

      {prices ? (
        <PriceBar changed={changed.length} invalid={invalid.length} onCancel={() => setPrices(null)}
          onSave={async () => {
            const list = changed.map((p) => ({ id: p.id, price: parsePrice(prices[p.id]) }))
            const ok = await onSavePrices(list)
            if (ok !== false) setPrices(null)
          }} />
      ) : cats.length > 0 && (
        <button type="button" className="fab show-mobile" onClick={() => onEditProduct({ category_id: cats[0].id })}><Plus /> Producto</button>
      )}

      {ask && <ConfirmModal text={ask.text} onYes={ask.onYes} onClose={() => setAsk(null)} />}
    </div>
  )
}

// Aumento por porcentaje para todos los precios (ideal cuando hay que actualizar la carta entera)
function BulkTools({ prods, prices, setPrices }) {
  const [pct, setPct] = useState('')
  const [round, setRound] = useState('100')
  const [open, setOpen] = useState(false)
  function apply() {
    const n = parsePrice(pct)
    if (!Number.isFinite(n) || n === 0) return
    const step = Number(round) || 1
    setPrices(Object.fromEntries(prods.map((p) => {
      const v = Math.round((Number(p.price) * (1 + n / 100)) / step) * step
      return [p.id, fmtInput(v)]
    })))
    setOpen(false)
  }
  return (
    <div className="card bulk">
      {open ? (
        <div className="bulk-form">
          <label className="field"><span>Aumentar todo un</span>
            <div className="input-suffix"><input id="bulk-pct" className="input" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="10" autoFocus /><b>%</b></div>
          </label>
          <label className="field"><span>Redondear a</span>
            <select id="bulk-round" className="input" value={round} onChange={(e) => setRound(e.target.value)}>
              <option value="1">Sin redondear</option>
              <option value="10">$ 10</option>
              <option value="50">$ 50</option>
              <option value="100">$ 100</option>
              <option value="500">$ 500</option>
            </select>
          </label>
          <div className="bulk-btns">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={apply}>Aplicar</button>
          </div>
          <p className="hint">Para bajar precios, poné un número negativo (ej: -5). Podés revisar cada precio antes de guardar.</p>
        </div>
      ) : (
        <div className="bulk-closed">
          <span className="muted">¿Hay que actualizar toda la carta?</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>Aumentar por %</button>
        </div>
      )}
    </div>
  )
}

function PriceBar({ changed, invalid, onCancel, onSave }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="price-bar">
      <div className="price-bar-in">
        <span className={invalid ? 'form-error' : 'muted'}>
          {invalid ? `Revisá ${invalid} ${invalid === 1 ? 'precio' : 'precios'}` : changed ? `${changed} ${changed === 1 ? 'cambio' : 'cambios'}` : 'Sin cambios'}
        </span>
        <div className="price-bar-btns">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>{changed ? 'Descartar' : 'Volver'}</button>
          <button type="button" className="btn btn-primary" disabled={!changed || invalid > 0 || busy}
            onClick={async () => { setBusy(true); try { await onSave() } finally { setBusy(false) } }}>
            {busy ? 'Guardando…' : 'Guardar precios'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Formulario de producto (solo interfaz). onSubmit({ values, photo }) */
export function ProductFormView({ categories, product, defaultCategory, onClose, onSubmit, saving, error: extError }) {
  const [f, setF] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product ? fmtInput(product.price) : '',
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
    setError('')
    onSubmit({
      values: {
        name: f.name.trim(), description: f.description.trim() || null, price,
        category_id: f.category_id, available: f.available, featured: f.featured,
      },
      photo,
    })
  }

  const shown = error || extError
  return (
    <Modal title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose} size="lg"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="product-form" className="btn btn-primary btn-grow" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </>}>
      <form id="product-form" className="form-grid product-form" onSubmit={save}>
        <div className="form-col">
          <label className="field"><span>Nombre</span>
            <input id="pf-name" className="input" value={f.name} onChange={set('name')} placeholder="Ej: Milanesa napolitana" autoFocus={!product} enterKeyHint="next" />
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
          <label className="field"><span>Descripción <em>(opcional)</em></span>
            <textarea id="pf-desc" className="input" rows={3} value={f.description} onChange={set('description')} placeholder="Ingredientes, tamaño, acompañamiento…" />
          </label>
          <div className="switch-stack">
            <Switch checked={f.available} onChange={set('available')} label={f.available ? 'Disponible' : 'Agotado (se muestra pero no se puede pedir)'} />
            <Switch checked={f.featured} onChange={set('featured')} label="Recomendado (aparece destacado arriba del menú)" />
          </div>
        </div>
        <div className="form-col">
          <span className="field-label">Foto</span>
          <PhotoPicker url={photo.url} onChange={setPhoto} />
        </div>
        {shown && <p className="form-error form-span">{shown}</p>}
      </form>
    </Modal>
  )
}

/** Crear o renombrar categoría (solo interfaz). onSubmit(name) */
export function CategoryModalView({ cat, onClose, onSubmit, saving, error: extError }) {
  const [name, setName] = useState(cat?.name || '')
  const [err, setErr] = useState('')
  function save(e) {
    e.preventDefault()
    if (!name.trim()) return setErr('Escribí un nombre.')
    setErr(''); onSubmit(name.trim())
  }
  return (
    <Modal title={cat ? 'Renombrar categoría' : 'Nueva categoría'} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="cat-form" className="btn btn-primary btn-grow" disabled={saving}>Guardar</button>
      </>}>
      <form id="cat-form" onSubmit={save}>
        <label className="field"><span>Nombre</span>
          <input id="cat-name" className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Principales" enterKeyHint="done" />
        </label>
        {(err || extError) && <p className="form-error">{err || extError}</p>}
      </form>
    </Modal>
  )
}
