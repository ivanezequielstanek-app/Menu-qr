import { useState } from 'react'
import { supabase, imageUrl, friendlyError, BUCKET } from '../../lib/supabase'
import { onlyDigits } from '../../lib/format'
import { useToast } from '../../components/ui'
import PhotoPicker from '../../components/PhotoPicker'

export default function Settings({ restaurant, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState({ name: restaurant.name, tagline: restaurant.tagline || '', whatsapp: restaurant.whatsapp || '' })
  const [logo, setLogo] = useState({ url: imageUrl(restaurant.logo_path) })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    if (!f.name.trim()) return setErr('El nombre no puede quedar vacío.')
    const wa = onlyDigits(f.whatsapp)
    if (wa && wa.length < 10) return setErr('Revisá el WhatsApp: código de país + área + número, sin espacios.')
    setErr(''); setBusy(true)
    try {
      const patch = { name: f.name.trim(), tagline: f.tagline.trim() || null, whatsapp: wa || null }
      const old = restaurant.logo_path
      if (logo.file) {
        const path = `${restaurant.id}/logo-${Date.now()}.${logo.file.type === 'image/webp' ? 'webp' : 'jpg'}`
        const { error: up } = await supabase.storage.from(BUCKET).upload(path, logo.file, { contentType: logo.file.type })
        if (up) throw up
        patch.logo_path = path
      } else if (logo.removed) patch.logo_path = null
      const { error } = await supabase.from('restaurants').update(patch).eq('id', restaurant.id)
      if (error) throw error
      if (old && (logo.file || logo.removed)) supabase.storage.from(BUCKET).remove([old])
      toast('Datos guardados'); onSaved?.()
    } catch (e2) { setErr(friendlyError(e2)) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save}>
      <div className="page-head"><div><h1>Mi local</h1><p className="muted">Datos que se muestran en tu menú</p></div></div>
      <div className="card form-grid">
        <div className="form-col">
          <label className="field"><span>Nombre del local</span><input className="input" value={f.name} onChange={set('name')} /></label>
          <label className="field"><span>Frase o descripción <em>(opcional)</em></span>
            <input className="input" value={f.tagline} onChange={set('tagline')} placeholder="Ej: Parrilla a leña desde 1987" maxLength={80} />
          </label>
          <label className="field"><span>WhatsApp para recibir pedidos</span>
            <input className="input" inputMode="tel" value={f.whatsapp} onChange={set('whatsapp')} placeholder="5491123456789" />
            <small className="hint">Con código de país y área, sin + ni espacios. Argentina: 549 + área + número.</small>
          </label>
          <label className="field"><span>Dirección de tu menú</span>
            <input className="input" value={`${window.location.origin}/${restaurant.slug}`} readOnly onFocus={(e) => e.target.select()} />
          </label>
        </div>
        <div className="form-col">
          <span className="field-label">Logo</span>
          <PhotoPicker url={logo.url} onChange={setLogo} shape="round" />
        </div>
        {err && <p className="form-error form-span">{err}</p>}
        <div className="form-span form-end"><button className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div>
      </div>
    </form>
  )
}
