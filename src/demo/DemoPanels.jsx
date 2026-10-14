// Mi local, Códigos QR y Pedidos en versión demo (en memoria)
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { money, onlyDigits, readableOn, slugify, timeAgo } from '../lib/format'
import { themeById } from '../lib/designs'
import { MENU_BASE_URL } from '../lib/brand'
import { ConfirmModal, Empty, Segmented, useToast } from '../components/ui'
import PhotoPicker from '../components/PhotoPicker'
import { useDemo, uid } from './store'
import FlavorsEditorView from '../components/FlavorsEditorView'
import { PrintButton, PrintModal, orderCode } from '../components/OrderPrint'

/* ---------------- Mi local ---------------- */
export function DemoSettings() {
  const { state, update } = useDemo()
  const r = state.restaurant
  const toast = useToast()
  const [f, setF] = useState({ name: r.name, tagline: r.tagline || '', whatsapp: r.whatsapp || '' })
  const [logo, setLogo] = useState({ url: r.logo_url })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  function save(e) {
    e.preventDefault()
    if (!f.name.trim()) return setErr('El nombre no puede quedar vacío.')
    const wa = onlyDigits(f.whatsapp)
    if (wa && wa.length < 10) return setErr('Revisá el WhatsApp: código de país + área + número, sin espacios.')
    setErr('')
    update('restaurant', (x) => ({
      ...x, name: f.name.trim(), tagline: f.tagline.trim() || null, whatsapp: wa || null,
      slug: slugify(f.name) || x.slug, logo_url: logo.url || null,
    }))
    toast('Datos actualizados en el menú')
  }

  return (
    <form onSubmit={save}>
      <div className="page-head"><div><h1>Mi local</h1><p className="muted">Datos que se muestran en tu menú</p></div></div>
      <div className="card form-grid">
        <div className="form-col">
          <label className="field"><span>Nombre del local</span><input id="st-name" className="input" value={f.name} onChange={set('name')} /></label>
          <label className="field"><span>Frase o descripción <em>(opcional)</em></span>
            <input id="st-tagline" className="input" value={f.tagline} onChange={set('tagline')} placeholder="Ej: Parrilla a leña desde 1987" maxLength={80} />
          </label>
          <label className="field"><span>WhatsApp para recibir pedidos</span>
            <input id="st-wa" className="input" inputMode="tel" value={f.whatsapp} onChange={set('whatsapp')} placeholder="5491123456789" />
            <small className="hint">Con código de país y área, sin + ni espacios. Argentina: 549 + área + número.</small>
          </label>
          <label className="field"><span>Dirección de tu menú</span>
            <input id="st-url" className="input" value={`${MENU_BASE_URL}/${slugify(f.name) || r.slug}`} readOnly onFocus={(e) => e.target.select()} />
          </label>
        </div>
        <div className="form-col">
          <span className="field-label">Logo</span>
          <PhotoPicker url={logo.url} onChange={setLogo} shape="round" />
          <p className="hint">Probá subir el logo de tu negocio: se ve en el encabezado del menú.</p>
        </div>
        {err && <p className="form-error form-span">{err}</p>}
        <div className="form-span form-end"><button className="btn btn-primary">Guardar cambios</button></div>
      </div>
    </form>
  )
}

/* ---------------- Códigos QR ---------------- */
const toQr = (text, dark) => QRCode.toDataURL(text, { width: 720, margin: 2, errorCorrectionLevel: 'M', color: { dark, light: '#ffffff' } })

export function DemoQr({ onTryTable }) {
  const { state } = useDemo()
  const r = state.restaurant
  const theme = themeById(state.design.theme)
  const accent = state.design.options.accent || theme.colors[1]
  // Solo se puede usar el color del diseño si es lo bastante oscuro para que el QR se lea
  const accentOk = readableOn(accent) === '#ffffff'
  const [ink, setInk] = useState('black')
  const dark = ink === 'accent' && accentOk ? accent : '#111111'
  const base = `${MENU_BASE_URL}/${r.slug}`
  const [main, setMain] = useState('')
  const [tables, setTables] = useState(10)
  const [tableQrs, setTableQrs] = useState([])

  useEffect(() => { toQr(base, dark).then(setMain) }, [base, dark])
  useEffect(() => {
    const n = Math.max(0, Math.min(40, Number(tables) || 0))
    Promise.all(Array.from({ length: n }, (_, i) => toQr(`${base}?mesa=${i + 1}`, dark))).then(setTableQrs)
  }, [tables, base, dark])

  const tentBg = theme.bg
  const tentInk = readableOn(tentBg)

  return (
    <div>
      <div className="page-head">
        <div><h1>Códigos QR</h1><p className="muted">Uno general para la vidriera y uno por mesa. En el panel real se descargan en PNG o se imprimen.</p></div>
      </div>

      <div className="qr-demo">
        <div className="card qr-main">
          {main && <img src={main} alt={`Código QR del menú de ${r.name}`} />}
          <strong>{r.name}</strong>
          <span className="muted qr-url">{base.replace(/^https?:\/\//, '')}</span>
          <div className="qr-ink">
            <span className="dc-label">Color del QR</span>
            <Segmented ariaLabel="Color del QR" value={accentOk ? ink : 'black'} onChange={setInk}
              options={accentOk ? [['black', 'Negro'], ['accent', 'Color del menú']] : [['black', 'Negro']]} />
            {!accentOk && <small className="hint">El color de este diseño es muy claro para un QR; se usa negro para que se lea bien.</small>}
          </div>
        </div>

        <div className="qr-tent-wrap">
          <span className="dc-label">Así queda el cartelito de mesa</span>
          <div className="qr-tent" style={{ background: tentBg, color: tentInk, '--tent-accent': accent }}>
            <div className="qr-tent-top">
              {r.logo_url ? <img className="qr-tent-logo" src={r.logo_url} alt="" /> : <span className="qr-tent-initial" style={{ background: accent, color: readableOn(accent) }}>{r.name.trim()[0]}</span>}
              <strong>{r.name}</strong>
            </div>
            <div className="qr-tent-code">{tableQrs[0] && <img src={tableQrs[0]} alt="QR de la mesa 1" />}</div>
            <p className="qr-tent-cta">Escaneá y mirá el menú</p>
            <p className="qr-tent-sub">Pedí desde tu celular</p>
            <span className="qr-tent-table" style={{ background: accent, color: readableOn(accent) }}>Mesa 1</span>
          </div>
        </div>
      </div>

      <div className="card qr-tables-head">
        <div>
          <h3 className="card-title">QR por mesa</h3>
          <p className="muted">Cada código abre el menú con el número de mesa ya cargado. Tocá uno para probarlo en la vista previa.</p>
        </div>
        <label className="field field-inline"><span>Cantidad de mesas</span>
          <input id="qr-tables" className="input" type="number" min="0" max="40" value={tables} onChange={(e) => setTables(e.target.value)} />
        </label>
      </div>
      {tableQrs.length > 0 && (
        <div className="qr-grid">
          {tableQrs.map((src, i) => (
            <button key={i} type="button" className={`qr-cell ${state.table === String(i + 1) ? 'is-on' : ''}`} onClick={() => onTryTable(String(i + 1))} title={`Probar el QR de la mesa ${i + 1}`}>
              <img src={src} alt={`QR mesa ${i + 1}`} />
              <strong>Mesa {i + 1}</strong>
              <small>Probar</small>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Pedidos ---------------- */
const STATUS = {
  nuevo: { label: 'Nuevo', next: 'preparando', action: 'Empezar a preparar' },
  preparando: { label: 'Preparando', next: 'listo', action: 'Marcar listo' },
  listo: { label: 'Listo', next: 'entregado', action: 'Marcar entregado' },
  entregado: { label: 'Entregado' },
  cancelado: { label: 'Cancelado' },
}
const TYPE = { mesa: 'Mesa', retiro: 'Retiro', delivery: 'Envío' }

export function DemoOrders({ onGoPreview }) {
  const { state, update } = useDemo()
  const [filter, setFilter] = useState('active')
  const [ask, setAsk] = useState(null)
  const [print, setPrint] = useState(null)
  const [, tick] = useState(0)
  const seen = useRef(false)

  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t) }, [])
  // Al entrar a la pestaña, los pedidos nuevos dejan de marcarse como "sin ver"
  useEffect(() => {
    if (seen.current) return
    seen.current = true
    if (state.orders.some((o) => o.fresh)) update('orders', (l) => l.map((o) => (o.fresh ? { ...o, fresh: false } : o)))
  }, [state.orders, update])

  const setStatus = (o, status) => update('orders', (l) => l.map((x) => (x.id === o.id ? { ...x, status } : x)))
  const orders = state.orders
  const list = filter === 'active' ? orders.filter((o) => ['nuevo', 'preparando', 'listo'].includes(o.status)) : orders
  const newCount = orders.filter((o) => o.status === 'nuevo').length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Pedidos</h1>
          <p className="muted"><span className="live-dot" /> En vivo · {newCount} {newCount === 1 ? 'nuevo' : 'nuevos'}</p>
        </div>
        <div className="page-actions">
          <Segmented value={filter} onChange={setFilter} options={[['active', 'En curso'], ['all', 'Todos']]} ariaLabel="Filtro" />
        </div>
      </div>
      <p className="demo-tip">Armá un pedido desde el menú de la vista previa y aparece acá al instante, como le llega al local.
        {onGoPreview && <> <button type="button" className="link-btn" onClick={onGoPreview}>Ir a la vista previa</button></>}</p>

      {list.length === 0 ? (
        <Empty title={filter === 'active' ? 'No hay pedidos en curso' : 'Todavía no hay pedidos'}
          text="Los pedidos aparecen acá al instante, sin recargar la página." />
      ) : (
        <div className="orders">
          {list.map((o) => {
            const st = STATUS[o.status]
            return (
              <article key={o.id} className={`order st-${o.status}`}>
                <header>
                  <div>
                    <strong className="order-who">
                      {TYPE[o.order_type]}{o.order_type === 'mesa' && o.table_number ? ` ${o.table_number}` : ''}
                      {o.customer_name ? ` · ${o.customer_name}` : ''}
                    </strong>
                    <span className="muted">{orderCode(o)} · {timeAgo(o.created_at)}</span>
                  </div>
                  <span className={`status status-${o.status}`}>{st.label}</span>
                </header>
                {o.address && <p className="order-addr">{o.address}</p>}
                <ul className="order-items">
                  {o.order_items.map((it) => (
                    <li key={it.id}><b>{it.qty}×</b> <div className="oi-name">{it.name}{it.details && <small>{it.details.split(' · ').map((d, k) => <i key={k}>{d}</i>)}</small>}</div><span>{money(it.unit_price * it.qty)}</span></li>
                  ))}
                </ul>
                {o.notes && <p className="order-notes">{o.notes}</p>}
                <footer>
                  <strong>{money(o.total)}</strong>
                  <div className="order-btns">
                    <PrintButton onClick={() => setPrint(o)} />
                    {['nuevo', 'preparando'].includes(o.status) && (
                      <button className="btn btn-ghost btn-sm btn-danger-text" onClick={() => setAsk(o)}>Cancelar</button>
                    )}
                    {st.next && <button className="btn btn-primary btn-sm" onClick={() => setStatus(o, st.next)}>{st.action}</button>}
                  </div>
                </footer>
              </article>
            )
          })}
        </div>
      )}
      {print && <PrintModal order={print} restaurant={state.restaurant} onClose={() => setPrint(null)} />}
      {ask && <ConfirmModal title="Cancelar pedido" text="¿Cancelar este pedido?" yes="Cancelar pedido"
        onYes={() => setStatus(ask, 'cancelado')} onClose={() => setAsk(null)} />}
    </div>
  )
}


/* ---------------- Sabores ---------------- */
export function DemoFlavors() {
  const { state, update } = useDemo()
  const toast = useToast()
  return (
    <FlavorsEditorView
      flavors={state.flavors}
      onAdd={(items) => {
        update('flavors', (l) => {
          const start = l.reduce((m, f) => Math.max(m, f.position ?? 0), -1) + 1
          return [...l, ...items.map((x, i) => ({ id: uid('f'), name: x.name, grp: x.grp, available: true, position: start + i }))]
        })
        toast(items.length === 1 ? 'Sabor agregado' : `${items.length} sabores agregados`)
      }}
      onPatch={(f, patch) => update('flavors', (l) => l.map((x) => (x.id === f.id ? { ...x, ...patch } : x)))}
      onDelete={(f) => { update('flavors', (l) => l.filter((x) => x.id !== f.id)); toast('Sabor eliminado') }}
      onMove={(group, i, dir) => {
        const j = i + dir
        if (j < 0 || j >= group.length) return
        const a = group[i], b = group[j]
        update('flavors', (l) => l.map((x) => (x.id === a.id ? { ...x, position: b.position } : x.id === b.id ? { ...x, position: a.position } : x)))
      }}
      onAllAvailable={() => { update('flavors', (l) => l.map((x) => ({ ...x, available: true }))); toast('Todos los sabores disponibles') }}
    />
  )
}
