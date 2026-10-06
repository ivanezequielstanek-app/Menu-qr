import { Link, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { BRAND } from '../lib/brand'
import { Logout } from './icons'

export default function AppShell({ children, title, actions }) {
  const { session, isAdmin } = useAuth()
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-in">
          <Link to="/" className="brand"><span className="brand-mark" />{BRAND}</Link>
          {isAdmin && (
            <nav className="topnav">
              <NavLink to="/admin" end>Clientes</NavLink>
            </nav>
          )}
          <div className="topbar-right">
            {title && <span className="topbar-title">{title}</span>}
            {actions}
            <span className="topbar-user" title={session?.user?.email}>{session?.user?.email}</span>
            <button className="icon-btn" onClick={() => supabase.auth.signOut()} aria-label="Cerrar sesión" title="Cerrar sesión"><Logout /></button>
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  )
}
