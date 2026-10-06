import { useState } from 'react'
import { supabase, imageUrl, friendlyError, BUCKET } from '../../lib/supabase'
import { parsePrice } from '../../lib/format'
import { Modal, Switch } from '../../components/ui'
import PhotoPicker from '../../components/PhotoPicker'

export default function ProductForm({ restaurantId, categories, product, defaultCategory, nextPosition, onClose, onSaved }) {
  const [f, setF] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product ? String(product.price).replace('.', ',') : '',
    category_id: product?.category_id || defaultCategory || categories[0]?.id || '',
    available: product?.available ?? true,
    featured: product?.featured ?? false,
  })
  const [photo, setPhoto] = useState({ url: imageUrl(product?.image_path) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))

  async function save(e) {
    e.preventDefault()
    const price = parsePrice(f.price)
    if (!f.name.trim()) return setError('Escribí el nombre del producto.')
    if (!Number.isFinite(price) || price < 0) return setError('Revisá el precio. Ejemplo: 12500 o 12.500,50')
    if (!f.category_id) return setError('Elegí una categoría.')
    setError(''); setSaving(true)
    try {
      const payload = {
        name: f.name.trim(), description: f.description.trim() || null, price,
        category_id: f.category_id, available: f.available, featured: f.featured, updated_at: new Date().toISOString(),
      }
      let id = product?.id
      if (!id) {
        const { data, error: e1 } = await supabase.from('products')
          .insert({ ...payload, restaurant_id: restaurantId, position: nextPosition }).select('id').single()
        if (e1) throw e1
        id = data.id
      } else {
        const { error: e2 } = await supabase.from('products').update(payload).eq('id', id)
        if (e2) throw e2
      }

      const old = product?.image_path
      if (photo.file) {
        const ext = photo.file.type === 'image/webp' ? 'webp' : 'jpg'
        const path = `${restaurantId}/${id}-${Date.now()}.${ext}`
        const { error: up } = await supabase.storage.from(BUCKET).upload(path, photo.file, { contentType: photo.file.type, cacheControl: '31536000' })
        if (up) throw up
        const { error: e3 } = await supabase.from('products').update({ image_path: path }).eq('id', id)
        if (e3) throw e3
        if (old) await supabase.storage.from(BUCKET).remove([old])
      } else if (photo.removed && old) {
        await supabase.from('products').update({ image_path: null }).eq('id', id)
        await supabase.storage.from(BUCKET).remove([old])
      }
      onSaved(product ? 'Producto actualizado' : 'Producto agregado')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose} size="lg"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </>}>
      <form id="product-form" className="form-grid" onSubmit={save}>
        <div className="form-col">
          <label className="field"><span>Nombre</span>
            <input className="input" value={f.name} onChange={set('name')} placeholder="Ej: Milanesa napolitana" autoFocus />
          </label>
          <label className="field"><span>Descripción <em>(opcional)</em></span>
            <textarea className="input" rows={3} value={f.description} onChange={set('description')} placeholder="Ingredientes, tamaño, acompañamiento…" />
          </label>
          <div className="field-row">
            <label className="field"><span>Precio</span>
              <div className="input-prefix"><b>$</b><input className="input" inputMode="decimal" value={f.price} onChange={set('price')} placeholder="0" /></div>
            </label>
            <label className="field"><span>Categoría</span>
              <select className="input" value={f.category_id} onChange={set('category_id')}>
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
