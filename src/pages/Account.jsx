import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { BRAND } from '../lib/brand'

// Se llega acá desde el email de invitación o de recuperación de contraseña
export default function Account() {
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (pw.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres.')
    if (pw !== pw2) return setErr('Las contraseñas no coinciden.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setErr(friendlyError(error))
    nav('/', { replace: true })
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand brand-lg"><span className="brand-mark" />{BRAND}</div>
        <h1>Creá tu contraseña</h1>
        <p className="muted">La vas a usar para ingresar a tu panel y editar tu menú.</p>
        <label className="field"><span>Nueva contraseña</span>
          <input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        <label className="field"><span>Repetir contraseña</span>
          <input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </label>
        {err && <p className="form-error">{err}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Guardando…' : 'Guardar y continuar'}</button>
      </form>
    </div>
  )
}
