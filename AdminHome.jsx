import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../../lib/supabase'
import { THEMES, THEME_PRESETS, themeById } from '../../lib/designs'
import { slugify, onlyDigits } from '../../lib/format'
import { Empty, Modal, Spinner, Switch, useToast } from '../../components/ui'
import { Plus, Palette, Edit, External, Mail } from '../../components/icons'

const RESERVED = ['login', 'panel', 'admin', 'cuenta', 'api', 'assets']

export default function AdminHome() {
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(null)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('restaurants')
      .select('*, restaurant_design(theme), restaurant_members(user_id)')
      .order('created_at', { ascending: false })
    if (error) toast(friendlyError(error), 'error')
    setRows(data || [])
  }, [toast])
  useEffect(() => { load() }, [load])

  async function toggleActive(r, active) {
    setRows((l) => l.map((x) => (x.id === r.id ? { ...x, active } : x)))
    const { error } = await supabase.from('restaurants').update({ active }).eq('id', r.id)
    if (error) { toast(friendlyError(error), 'error'); load() } else toast(active ? 'Menú activado' : 'Menú pausado')
  }

  if (!rows) return <Spinner />
  const list = rows.filter((r) => !q || (r.name + r.slug).toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <div className="page-head">
        <div><h1>Clientes</h1><p className="muted">{rows.length} locales · {rows.filter((r) => r.active).length} activos</p></div>
        <div className="page-actions">
          {rows.length > 5 && <input className="input" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cliente" />}
          <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus /> Nuevo cliente</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty title="Todavía no tenés clientes" text="Creá el primero y elegí su diseño."
          action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus /> Nuevo cliente</button>} />
      ) : (
        <div className="client-list">
          {list.map((r) => {
            const d = Array.isArray(r.restaurant_design) ? r.restaurant_design[0] : r.restaurant_design
            const t = themeById(d?.theme)
            const owners = r.restaurant_members?.length || 0
            return (
              <article key={r.id} className={`client ${r.active ? '' : 'is-off'}`}>
                <span className="client-sw" aria-hidden="true">{t.colors.map((c) => <i key={c} style={{ background: c }} />)}</span>
                <div className="client-info">
                  <strong>{r.name}</strong>
                  <span className="muted">/{r.slug} · {t.name} · {owners ? `${owners} ${owners === 1 ? 'dueño' : 'dueños'}` : 'sin dueño asignado'}</span>
                </div>
                <Switch checked={r.active} onChange={(v) => toggleActive(r, v)} label={r.active ? 'Activo' : 'Pausado'} />
                <div className="client-actions">
                  <Link className="btn btn-secondary btn-sm" to={`/admin/diseno/${r.id}`}><Palette /> Diseño</Link>
                  <Link className="btn btn-secondary btn-sm" to={`/panel?r=${r.id}`}><Edit /> Menú</Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => setInviting(r)}><Mail /> Invitar</button>
                  <a className="icon-btn" href={`/${r.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Ver menú"><External /></a>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {creating && <NewClient onClose={() => setCreating(false)} onSaved={() => { setCreating(false); toast('Cliente creado'); load() }} />}
      {inviting && <Invite restaurant={inviting} onClose={() => setInviting(null)} onSaved={(m) => { setInviting(null); toast(m); load() }} />}
    </div>
  )
}

function NewClient({ onClose, onSaved }) {
  const [f, setF] = useState({ name: '', slug: '', whatsapp: '', theme: 'parrilla' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    const slug = slugify(f.slug || f.name)
    if (!f.name.trim()) return setErr('Escribí el nombre del local.')
    if (slug.length < 3) return setErr('La dirección debe tener al menos 3 caracteres.')
    if (RESERVED.includes(slug)) return setErr('Esa dirección está reservada, elegí otra.')
    setBusy(true); setErr('')
    const { data, error } = await supabase.from('restaurants')
      .insert({ name: f.name.trim(), slug, whatsapp: onlyDigits(f.whatsapp) || null }).select('id').single()
    if (error) { setBusy(false); return setErr(friendlyError(error)) }
    const { error: e2 } = await supabase.from('restaurant_design')
      .insert({ restaurant_id: data.id, theme: f.theme, options: THEME_PRESETS[f.theme] })
    setBusy(false)
    if (e2) return setErr(friendlyError(e2))
    onSaved()
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="new-client" className="btn btn-primary" disabled={busy}>{busy ? 'Creando…' : 'Crear cliente'}</button>
      </>}>
      <form id="new-client" onSubmit={save}>
        <label className="field"><span>Nombre del local</span>
          <input className="input" autoFocus value={f.name}
            onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: slugTouched ? s.slug : slugify(e.target.value) }))} />
        </label>
        <label className="field"><span>Dirección del menú</span>
          <div className="input-prefix"><b>{window.location.host}/</b>
            <input className="input" value={f.slug} onChange={(e) => { setSlugTouched(true); setF((s) => ({ ...s, slug: slugify(e.target.value) })) }} />
          </div>
        </label>
        <label className="field"><span>WhatsApp <em>(opcional)</em></span>
          <input className="input" inputMode="tel" placeholder="5491123456789" value={f.whatsapp} onChange={(e) => setF((s) => ({ ...s, whatsapp: e.target.value }))} />
        </label>
        <span className="field-label">Diseño inicial</span>
        <div className="theme-cards theme-cards-compact">
          {THEMES.map((t) => (
            <button type="button" key={t.id} className={`theme-card ${f.theme === t.id ? 'is-on' : ''}`} onClick={() => setF((s) => ({ ...s, theme: t.id }))}>
              <span className="theme-sw">{t.colors.map((c) => <i key={c} style={{ background: c }} />)}</span>
              <strong>{t.name}</strong>
            </button>
          ))}
        </div>
        {err && <p className="form-error">{err}</p>}
      </form>
    </Modal>
  )
}

function Invite({ restaurant, onClose, onSaved }) {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function send(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Escribí un email válido.')
    setBusy(true); setErr('')
    const { data, error } = await supabase.functions.invoke('invite-owner', {
      body: { email: email.trim(), restaurant_id: restaurant.id, redirect_to: `${window.location.origin}/cuenta` },
    })
    setBusy(false)
    if (error) {
      let msg = error.message
      try { msg = (await error.context.json()).error || msg } catch { /* sin detalle */ }
      return setErr(msg)
    }
    onSaved(data?.invited ? `Invitación enviada a ${email.trim()}` : `${email.trim()} ya tenía cuenta: le dimos acceso a ${restaurant.name}`)
  }
  return (
    <Modal title={`Dar acceso a ${restaurant.name}`} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="invite" className="btn btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar invitación'}</button>
      </>}>
      <form id="invite" onSubmit={send}>
        <p className="muted">El dueño recibirá un email para crear su contraseña. Solo podrá editar los productos de este local.</p>
        <label className="field"><span>Email del dueño</span>
          <input className="input" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {err && <p className="form-error">{err}</p>}
      </form>
    </Modal>
  )
}
