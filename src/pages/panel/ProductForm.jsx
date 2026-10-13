import { useEffect, useState } from 'react'
import { supabase, friendlyError, BUCKET } from '../../lib/supabase'
import { ProductFormView } from '../../components/MenuEditorView'

// Formulario de producto del panel real: la interfaz es compartida con la demo,
// acá solo se guarda en Supabase (datos + foto).
export default function ProductForm({ restaurantId, categories, products, product, defaultCategory, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flavorsCount, setFlavorsCount] = useState(null)
  useEffect(() => {
    supabase.from('flavors').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId)
      .then(({ count, error: e }) => setFlavorsCount(e ? null : count ?? 0))
  }, [restaurantId])

  async function submit({ values, photo }) {
    setError(''); setSaving(true)
    try {
      const payload = { ...values, updated_at: new Date().toISOString() }
      // Si el producto no usa sabores, no mandamos la columna (así funciona aunque falte la migración 003)
      if (!values.choice && !product?.choice) delete payload.choice
      let id = product?.id
      if (!id) {
        const position = products.filter((p) => p.category_id === values.category_id).length
        const { data, error: e1 } = await supabase.from('products')
          .insert({ ...payload, restaurant_id: restaurantId, position }).select('id').single()
        if (e1) throw e1
        id = data.id
      } else {
        if (product.category_id !== values.category_id) {
          payload.position = products.filter((p) => p.category_id === values.category_id).length
        }
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
    <ProductFormView categories={categories} product={product} defaultCategory={defaultCategory}
      onClose={onClose} onSubmit={submit} saving={saving} error={error} flavorsCount={flavorsCount} />
  )
}
