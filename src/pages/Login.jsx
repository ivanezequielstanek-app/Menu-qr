import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { BRAND } from '../lib/brand'

export default function Login() {
  const { session } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // login | reset
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to={loc.state?.from || '/'} replace />

  async function submit(e) {
    e.preventDefault()
    setErr(''); setMsg(''); setBusy(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      setBusy(false)
      if (error) return setErr(friendlyError(error))
      nav(loc.state?.from || '/', { replace: true })
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/cuenta` })
      setBusy(false)
      if (error) return setErr(friendlyError(error))
      setMsg('Te enviamos un email con un enlace para crear una nueva contraseña.')
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand brand-lg"><span className="brand-mark" />{BRAND}</div>
        <h1>{mode === 'login' ? 'Ingresá a tu panel' : 'Recuperar contraseña'}</h1>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode === 'login' && (
          <label className="field">
            <span>Contraseña</span>
            <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}
        {err && <p className="form-error">{err}</p>}
        {msg && <p className="form-ok">{msg}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Un momento…' : mode === 'login' ? 'Ingresar' : 'Enviar enlace'}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setErr(''); setMsg('') }}>
          {mode === 'login' ? 'Olvidé mi contraseña' : 'Volver a ingresar'}
        </button>
      </form>
    </div>
  )
}
