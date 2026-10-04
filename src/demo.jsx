// Demo sin Supabase: editor de diseño con datos de ejemplo
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './styles/app.css'
import './styles/menu.css'
import { resolveOptions } from './lib/designs'
import { BRAND } from './lib/brand'
import DesignControls from './components/DesignControls'
import PhonePreview from './components/PhonePreview'
import { getSample } from './demo/mockData'

function Demo() {
  const [design, setDesign] = useState({ theme: 'parrilla', options: resolveOptions('parrilla') })
  const s = getSample(design.theme)
  return (
    <div className="shell">
      <header className="topbar"><div className="topbar-in">
        <span className="brand"><span className="brand-mark" />{BRAND}</span>
        <span className="topbar-title">Editor de diseño · demo</span>
      </div></header>
      <main className="container">
        <div className="page-head"><div>
          <h1>Diseño del menú</h1>
          <p className="muted">Probá los diseños y sus opciones. La vista previa es interactiva: podés armar un pedido.</p>
        </div></div>
        <div className="editor">
          <aside className="editor-controls card"><DesignControls theme={design.theme} options={design.options} onChange={setDesign} /></aside>
          <div className="editor-preview">
            <PhonePreview restaurant={s.restaurant} theme={design.theme} options={design.options} categories={s.categories} products={s.products} />
          </div>
        </div>
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Demo />)
