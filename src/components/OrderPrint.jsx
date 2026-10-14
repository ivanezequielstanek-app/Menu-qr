// Imprimir pedidos: comanda completa, etiqueta del paquete o una etiqueta por pote/producto.
// Funciona con impresoras térmicas (58 y 80 mm) y con hojas A4. Lo usan el panel real y la demo.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { money } from '../lib/format'
import { Modal, Segmented } from './ui'
import { Printer } from './icons'

const TYPE = { mesa: 'Consumo en el local', retiro: 'Retira en el local', delivery: 'Envío a domicilio' }
const KINDS = [['ticket', 'Comanda'], ['package', 'Etiqueta del paquete'], ['units', 'Etiqueta por pote']]
const PAPERS = [['80', 'Térmica 80 mm'], ['58', 'Térmica 58 mm'], ['a4', 'Hoja A4']]

/** Número corto para identificar el pedido: #4F2A */
export const orderCode = (o) => '#' + String(o.id || '').replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase()

const when = (d) => new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// "Kilo: Chocolate, Limón · 1/4 de regalo: Vainilla" → [['Kilo', 'Chocolate, Limón'], ['1/4 de regalo', 'Vainilla']]
function splitDetails(details) {
  if (!details) return []
  return details.split(' · ').map((s) => {
    const i = s.indexOf(': ')
    return i > 0 ? [s.slice(0, i), s.slice(i + 2)] : ['', s]
  })
}

function who(o) {
  if (o.order_type === 'mesa') return `Mesa ${o.table_number || '-'}${o.customer_name ? ` · ${o.customer_name}` : ''}`
  return o.customer_name || 'Sin nombre'
}

function useStored(key, initial) {
  const [v, setV] = useState(() => { try { return localStorage.getItem(key) || initial } catch { return initial } })
  const set = (x) => { setV(x); try { localStorage.setItem(key, x) } catch { /* sin almacenamiento */ } }
  return [v, set]
}

/* ---------- Contenido que se imprime ---------- */
function Ticket({ order: o, restaurant }) {
  return (
    <div className="pr-ticket">
      <div className="pr-center">
        <strong className="pr-shop">{restaurant?.name}</strong>
        <div className="pr-code">{orderCode(o)}</div>
        <div>{when(o.created_at)}</div>
      </div>
      <div className="pr-rule" />
      <div className="pr-big">{TYPE[o.order_type]}</div>
      <div className="pr-who">{who(o)}</div>
      {o.address && <div className="pr-addr">{o.address}</div>}
      <div className="pr-rule" />
      {(o.order_items || []).map((it) => (
        <div key={it.id} className="pr-item">
          <div className="pr-line"><b>{it.qty}× {it.name}</b><span>{money(it.unit_price * it.qty)}</span></div>
          {splitDetails(it.details).map(([l, f], k) => (
            <div key={k} className="pr-fl">{l && <b>{l}: </b>}{f}</div>
          ))}
        </div>
      ))}
      {o.notes && <><div className="pr-rule" /><div className="pr-notes"><b>Aclaraciones:</b> {o.notes}</div></>}
      <div className="pr-rule" />
      <div className="pr-line pr-total"><b>TOTAL</b><b>{money(o.total)}</b></div>
    </div>
  )
}

function PackageLabel({ order: o, restaurant }) {
  const count = (o.order_items || []).reduce((s, it) => s + it.qty, 0)
  return (
    <div className="pr-pack">
      <div className="pr-line"><strong className="pr-shop">{restaurant?.name}</strong><strong className="pr-code">{orderCode(o)}</strong></div>
      <div className="pr-rule" />
      <div className="pr-small">{o.order_type === 'delivery' ? 'ENTREGAR A' : o.order_type === 'retiro' ? 'RETIRA' : 'PARA'}</div>
      <div className="pr-name">{who(o)}</div>
      {o.address && <div className="pr-addr pr-addr-big">{o.address}</div>}
      <div className="pr-rule" />
      <div className="pr-line"><span>{TYPE[o.order_type]}</span><span>{count} {count === 1 ? 'producto' : 'productos'}</span></div>
      <div className="pr-line"><span>{when(o.created_at)}</span><b>{money(o.total)}</b></div>
      {o.notes && <div className="pr-notes"><b>Nota:</b> {o.notes}</div>}
    </div>
  )
}

function UnitLabels({ order: o }) {
  // Una etiqueta por cada pote (si el producto tiene sabores) o por cada unidad del producto
  const labels = []
  ;(o.order_items || []).forEach((it) => {
    const parts = splitDetails(it.details)
    for (let q = 0; q < it.qty; q++) {
      if (parts.length) parts.forEach(([l, f]) => labels.push({ product: it.name, part: l, flavors: f }))
      else labels.push({ product: it.name })
    }
  })
  return labels.map((l, i) => (
    <div key={i} className="pr-unit">
      <div className="pr-line"><strong>{who(o)}</strong><span>{orderCode(o)} · {i + 1}/{labels.length}</span></div>
      <div className="pr-unit-name">{l.part || l.product}</div>
      {l.part && <div className="pr-small">{l.product}</div>}
      {l.flavors && <div className="pr-unit-fl">{l.flavors}</div>}
    </div>
  ))
}

function PrintContent({ kind, ...props }) {
  if (kind === 'package') return <PackageLabel {...props} />
  if (kind === 'units') return <UnitLabels {...props} />
  return <Ticket {...props} />
}

/* ---------- Ventana de impresión ---------- */
export function PrintModal({ order, restaurant, onClose }) {
  const [kind, setKind] = useStored('mq-print-kind', 'ticket')
  const [paper, setPaper] = useStored('mq-print-paper', '80')
  const [printing, setPrinting] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (!printing) return
    // Tamaño de página según el papel elegido
    // Papel térmico: la hoja mide lo mismo que el contenido (se mide la vista previa, que tiene el mismo ancho)
    const style = document.createElement('style')
    const prev = document.querySelector('.pr-preview .pr-sheet')
    const mm = prev ? Math.ceil(prev.scrollHeight * 25.4 / 96) + 6 : 200
    style.textContent = paper === 'a4' ? '@page{size:A4;margin:12mm}' : `@page{size:${paper}mm ${Math.max(mm, 40)}mm;margin:2mm}`
    document.head.appendChild(style)
    document.body.classList.add('is-printing')
    const done = () => { document.body.classList.remove('is-printing'); style.remove(); setPrinting(false) }
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => {
      try { window.print() } catch { setHint('Este navegador no permite imprimir desde acá.') }
    }, 50)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done); document.body.classList.remove('is-printing'); style.remove() }
  }, [printing, paper])

  const props = { order, restaurant }
  return (
    <>
      <Modal title={`Imprimir pedido ${orderCode(order)}`} onClose={onClose}
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          <button type="button" className="btn btn-primary btn-grow" onClick={() => { setHint(''); setPrinting(true) }}><Printer /> Imprimir</button>
        </>}>
        <div className="pr-opts">
          <div><span className="dc-label">Qué imprimir</span><Segmented ariaLabel="Qué imprimir" value={kind} onChange={setKind} options={KINDS} /></div>
          <div><span className="dc-label">Papel</span><Segmented ariaLabel="Papel" value={paper} onChange={setPaper} options={PAPERS} /></div>
          <p className="hint">
            {kind === 'ticket' && 'Todo el pedido, con los sabores de cada pote. Ideal para la cocina o para adjuntar al envío.'}
            {kind === 'package' && 'Nombre y dirección grandes, para pegar en la bolsa o la caja del envío.'}
            {kind === 'units' && 'Una etiqueta por cada pote o producto, con sus sabores, para no confundir los potes al armar el pedido.'}
          </p>
          {hint && <p className="form-error">{hint}</p>}
        </div>
        <div className={`pr-preview pr-paper-${paper}`}>
          <div className={`pr-sheet pr-${paper} pr-k-${kind}`}><PrintContent kind={kind} {...props} /></div>
        </div>
      </Modal>
      {createPortal(
        <div className="print-root" aria-hidden="true">
          <div className={`pr-sheet pr-${paper} pr-k-${kind}`}><PrintContent kind={kind} {...props} /></div>
        </div>,
        document.body,
      )}
    </>
  )
}

/** Botón para las tarjetas de pedido */
export function PrintButton({ onClick }) {
  return <button type="button" className="btn btn-ghost btn-sm" onClick={onClick} aria-label="Imprimir pedido" title="Imprimir"><Printer /></button>
}
