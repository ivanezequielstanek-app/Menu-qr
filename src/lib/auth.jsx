import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import { Spinner } from '../components/ui'

const AuthCtx = createContext({ session: undefined, isAdmin: null })
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [isAdmin, setIsAdmin] = useState(null)       // null = verificando

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    if (session === undefined) return
    if (!uid) { setIsAdmin(false); return }
    setIsAdmin(null)
    supabase.from('platform_admins').select('user_id').eq('user_id', uid).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data))
  }, [uid, session === undefined])

  return <AuthCtx.Provider value={{ session, isAdmin }}>{children}</AuthCtx.Provider>
}

export function RequireAuth({ children, admin = false }) {
  const { session, isAdmin } = useAuth()
  const loc = useLocation()
  if (session === undefined || (session && isAdmin === null)) return <div className="page-center"><Spinner /></div>
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  if (admin && !isAdmin) return <Navigate to="/panel" replace />
  return children
}
