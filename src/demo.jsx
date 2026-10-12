// Demo para clientes (sin Supabase): diseño, menú, datos del local, QR y pedidos.
// Todo vive en memoria: se puede tocar todo y nada se guarda.
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './styles/app.css'
import './styles/menu.css'
import './styles/demo.css'
import { BRAND, CONTACT } from './lib/brand'
import { themeById } from './lib/designs'
import { waLink } from './lib/format'
import DesignControls from './components/DesignControls'
import PhonePreview from './components/PhonePreview'
import { ToastProvider, useToast } from './components/ui'
import { Edit, Bell, Store, QrIcon, Palette, Eye } from './components/icons'
import { DemoProvider, SAMPLE_LIST, useDemo } from './demo/store'
import DemoMenuEditor from './demo/DemoMenuEditor'
import { DemoSettings, DemoQr, DemoOrders } from './demo/DemoPanels'

function useWide(query = '(min-width: 1100px)') {
  const [wide, setWide] = useState(() => window.matchMedia?.(query).matches ?? true)
  useEffect(() => {
    const m = window.matchMedia?.(query)
    if (!m) return
    const h = () => setWide(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [query])
  return wide
}

function LivePreview() {
  const { state, update, addOrder } = useDemo()
  const toast = useToast()
  const { restaurant, design, categories, products, table } = state
  async function submit(order) {
    await addOrder(order)
    toast('Llegó un pedido nuevo · miralo en Pedidos')
  }
  return (
    <div className="demo-preview">
      {table && (
        <div className="demo-sim">
          <span><QrIcon size={16} /> Probando el QR de la <b>mesa {table}</b></span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => update('table', '')}>Quitar</button>
        </div>
      )}
      <PhonePreview restaurant={restaurant} theme={design.theme} options={design.options}
        categories={categories} products={products} initialTable={table} onSubmitOrder={submit} />
    </div>
  )
}

function SamplePicker() {
  const { state, loadSample } = useDemo()
  return (
    <div className="samples" role="group" aria-label="Elegir un negocio de ejemplo">
      <span className="samples-label">Ejemplo</span>
      <div className="samples-list">
        {SAMPLE_LIST.map(([id, label]) => {
          const t = themeById(id)
          return (
            <button key={id} type="button" className={`sample ${state.sample === id ? 'is-on' : ''}`}
              aria-pressed={state.sample === id} onClick={() => loadSample(id)}>
              <span className="sample-sw" aria-hidden="true">{t.colors.map((c) => <i key={c} style={{ background: c }} />)}</span>
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Demo() {
  const { state, update, loadSample } = useDemo()
  const wide = useWide()
  const [tab, setTab] = useState(() => (window.matchMedia?.('(min-width: 1100px)').matches ? 'menu' : 'preview'))
  const unseen = state.orders.filter((o) => o.fresh).length

  useEffect(() => { if (wide && tab === 'preview') setTab('menu') }, [wide, tab])

  const tabs = [
    ...(wide ? [] : [['preview', 'Vista previa', Eye, 'Ver']]),
    ['menu', 'Menú', Edit, 'Menú'],
    ['design', 'Diseño', Palette, 'Diseño'],
    ['local', 'Mi local', Store, 'Local'],
    ['qr', 'Códigos QR', QrIcon, 'QR'],
    ['orders', 'Pedidos', Bell, 'Pedidos'],
  ]
  const goPreview = wide ? null : () => { setTab('preview'); window.scrollTo({ top: 0 }) }
  const tryTable = (n) => { update('table', n); if (!wide) goPreview() }
  const contact = CONTACT.whatsapp
    ? waLink(CONTACT.whatsapp, `Hola! Vi la demo de ${BRAND} y quiero mi menú digital.`)
    : CONTACT.instagram ? `https://instagram.com/${CONTACT.instagram.replace('@', '')}` : null

  return (
    <div className="shell">
      <header className="topbar"><div className="topbar-in">
        <span className="brand"><span className="brand-mark" />{BRAND}</span>
        <span className="badge badge-info">Demo</span>
        <div className="topbar-right">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => loadSample(state.sample)}>Reiniciar</button>
          {contact && <a className="btn btn-primary btn-sm" href={contact} target="_blank" rel="noopener noreferrer">{CONTACT.label}</a>}
        </div>
      </div></header>

      <main className="container demo-container">
        <section className="demo-intro">
          <div className="demo-intro-text">
            <h1>Probá tu menú digital</h1>
            <p className="muted">Este es el panel que usa el dueño del local. Cambiá precios, fotos y productos, probá los diseños y armá un pedido como si fueras un cliente. <b>Nada de lo que hagas se guarda:</b> al recargar vuelve al ejemplo.</p>
          </div>
          <SamplePicker />
        </section>

        <div className={`demo-layout ${wide ? 'is-wide' : ''}`}>
          <div className="demo-work">
            <nav className="tabs app-tabs" aria-label="Secciones">
              {tabs.map(([id, label, Icon, short]) => (
                <button key={id} className={tab === id ? 'is-on' : ''} onClick={() => { setTab(id); window.scrollTo({ top: 0 }) }} aria-current={tab === id ? 'page' : undefined}>
                  <Icon /> <span className="tab-long">{label}</span><span className="tab-short">{short}</span>
                  {id === 'orders' && unseen > 0 && <span className="tab-count">{unseen}</span>}
                </button>
              ))}
            </nav>
            {tab === 'preview' && <LivePreview />}
            {tab === 'menu' && <DemoMenuEditor />}
            {tab === 'design' && (
              <div>
                <div className="page-head"><div>
                  <h1>Diseño</h1>
                  <p className="muted">Elegí el estilo que va con tu negocio. En tu menú real lo dejamos configurado juntos.</p>
                </div></div>
                <div className="card demo-design"><DesignControls theme={state.design.theme} options={state.design.options} onChange={(d) => update('design', d)} /></div>
              </div>
            )}
            {tab === 'local' && <DemoSettings key={state.sample + state.restaurant.name} />}
            {tab === 'qr' && <DemoQr onTryTable={tryTable} />}
            {tab === 'orders' && <DemoOrders onGoPreview={goPreview} />}
          </div>
          {wide && <aside className="demo-side"><LivePreview /></aside>}
        </div>
      </main>

    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <DemoProvider>
      <Demo />
    </DemoProvider>
  </ToastProvider>,
)
