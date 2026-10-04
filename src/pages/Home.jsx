import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { BRAND } from '../lib/brand'

export default function Home() {
  const { session, isAdmin } = useAuth()
  if (session === undefined || (session && isAdmin === null)) return <div className="page-center"><span className="spinner" /></div>
  if (session) return <Navigate to={isAdmin ? '/admin' : '/panel'} replace />
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand brand-lg"><span className="brand-mark" />{BRAND}</div>
        <h1>Menús digitales para tu local</h1>
        <p className="muted">Si ya sos cliente, ingresá para editar tu menú y ver tus pedidos.</p>
        <Link className="btn btn-primary btn-block" to="/login">Ingresar</Link>
      </div>
    </div>
  )
}
