import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, imageUrl, friendlyError } from '../../lib/supabase'
import { resolveOptions } from '../../lib/designs'
import { Spinner, useToast } from '../../components/ui'
import { External } from '../../components/icons'
import DesignControls from '../../components/DesignControls'
import PhonePreview from '../../components/PhonePreview'
import { getSample } from '../../demo/mockData'

export default function DesignEditor() {
  const { id } = useParams()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [design, setDesign] = useState(null)
  const [saved, setSaved] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const [r, d, c, p] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', id).single(),
        supabase.from('restaurant_design').select('*').eq('restaurant_id', id).maybeSingle(),
        supabase.from('categories').select('*').eq('restaurant_id', id).order('position'),
        supabase.from('products').select('*').eq('restaurant_id', id).order('position'),
      ])
      if (r.error) return toast(friendlyError(r.error), 'error')
      const theme = d.data?.theme || 'elegante'
      const initial = { theme, options: resolveOptions(theme, d.data?.options) }
      setDesign(initial); setSaved(JSON.stringify(initial))
      setData({
        restaurant: { ...r.data, logo_url: imageUrl(r.data.logo_path) },
        categories: c.data || [],
        products: (p.data || []).map((x) => ({ ...x, image_url: imageUrl(x.image_path) })),
      })
    })()
  }, [id, toast])

  if (!data || !design) return <Spinner />
  const dirty = JSON.stringify(design) !== saved
  const usingSample = data.products.length === 0
  const sample = usingSample ? getSample(design.theme) : null

  async function save() {
    setBusy(true)
    const { error } = await supabase.from('restaurant_design').upsert({
      restaurant_id: id, theme: design.theme, options: design.options, updated_at: new Date().toISOString(),
    })
    setBusy(false)
    if (error) return toast(friendlyError(error), 'error')
    setSaved(JSON.stringify(design)); toast('Diseño publicado')
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <Link to="/admin" className="back-link">← Clientes</Link>
          <h1>Diseño · {data.restaurant.name}</h1>
        </div>
        <div className="page-actions">
          <a className="btn btn-secondary" href={`/${data.restaurant.slug}`} target="_blank" rel="noopener noreferrer"><External /> Ver en vivo</a>
          <button className="btn btn-ghost" disabled={!dirty} onClick={() => setDesign(JSON.parse(saved))}>Descartar</button>
          <button className="btn btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Publicando…' : dirty ? 'Publicar cambios' : 'Publicado'}</button>
        </div>
      </div>
      <div className="editor">
        <aside className="editor-controls card">
          <DesignControls theme={design.theme} options={design.options} onChange={setDesign} />
        </aside>
        <div className="editor-preview">
          {usingSample && <p className="hint center">Este local no tiene productos todavía: la vista previa usa productos de ejemplo.</p>}
          <PhonePreview
            restaurant={{ ...(sample?.restaurant || {}), ...data.restaurant, whatsapp: data.restaurant.whatsapp || sample?.restaurant.whatsapp }}
            theme={design.theme} options={design.options}
            categories={usingSample ? sample.categories : data.categories}
            products={usingSample ? sample.products : data.products}
          />
        </div>
      </div>
    </div>
  )
}
