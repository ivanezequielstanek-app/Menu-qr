import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/app.css'
import './styles/menu.css'
import { supabase } from './lib/supabase'
import { AuthProvider, RequireAuth } from './lib/auth'
import { ToastProvider } from './components/ui'
import Home from './pages/Home'
import Login from './pages/Login'
import Account from './pages/Account'
import OwnerPanel from './pages/OwnerPanel'
import Admin from './pages/Admin'
import PublicMenu from './pages/PublicMenu'

function MissingConfig() {
  return (
    <div className="page-center">
      <div className="empty">
        <h3>Falta configurar Supabase</h3>
        <p>Copiá <code>.env.example</code> como <code>.env</code> y completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {!supabase ? <MissingConfig /> : (
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cuenta" element={<RequireAuth><Account /></RequireAuth>} />
              <Route path="/panel" element={<RequireAuth><OwnerPanel /></RequireAuth>} />
              <Route path="/admin/*" element={<RequireAuth admin><Admin /></RequireAuth>} />
              <Route path="/:slug" element={<PublicMenu />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    )}
  </React.StrictMode>,
)
