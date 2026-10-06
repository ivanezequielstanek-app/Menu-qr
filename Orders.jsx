import { useEffect, useRef, useState } from 'react'
import { supabase, friendlyError } from '../../lib/supabase'
import { money, timeAgo } from '../../lib/format'
import { Empty, Segmented, Spinner, useToast } from '../../components/ui'
import { Bell } from '../../components/icons'

const STATUS = {
  nuevo: { label: 'Nuevo', next: 'preparando', action: 'Empezar a preparar' },
  preparando: { label: 'Preparando', next: 'listo', action: 'Marcar listo' },
  listo: { label: 'Listo', next: 'entregado', action: 'Marcar entregado' },
  entregado: { label: 'Entregado' },
  cancelado: { label: 'Cancelado' },
}
const TYPE = { mesa: 'Mesa', retiro: 'Retiro', delivery: 'Envío' }

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.18].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination)
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.15)
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.16)
    })
  } catch { /* sin audio */ }
}

export default function Orders({ restaurant }) {
  const rid = restaurant.id
  const toast = useToast()
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('active')
  const [sound, setSound] = useState(false)
  const soundRef = useRef(sound)
  soundRef.current = sound
  const [, tick] = useState(0)

  useEffect(() => {
    let alive = true
    const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString()
    supabase.from('orders').select('*, order_items(*)').eq('restaurant_id', rid)
      .gte('created_at', since).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return
        if (error) toast(friendlyError(error), 'error')
        setOrders(data || [])
      })

    const channel = supabase.channel(`orders-${rid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rid}` },
        async ({ new: row }) => {
          // Los ítems se graban en la misma transacción; los traemos completos
          const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', row.id).single()
          setOrders((l) => [data || { ...row, order_items: [] }, ...(l || []).filter((o) => o.id !== row.id)])
          if (soundRef.current) beep()
          toast('Llegó un pedido nuevo')
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rid}` },
        ({ new: row }) => setOrders((l) => (l || []).map((o) => (o.id === row.id ? { ...o, ...row } : o))))
      .subscribe()

    const t = setInterval(() => tick((n) => n + 1), 30000)
    return () => { alive = false; supabase.removeChannel(channel); clearInterval(t) }
  }, [rid, toast])

  async function setStatus(o, status) {
    setOrders((l) => l.map((x) => (x.id === o.id ? { ...x, status } : x)))
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id)
    if (error) toast(friendlyError(error), 'error')
  }

  if (!orders) return <Spinner label="Cargando pedidos…" />
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
          <Segmented value={filter} onChange={setFilter} options={[['active', 'En curso'], ['all', 'Últimas 36 h']]} ariaLabel="Filtro" />
          <button className={`btn ${sound ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setSound(!sound); if (!sound) beep() }}>
            <Bell /> {sound ? 'Sonido activado' : 'Activar sonido'}
          </button>
        </div>
      </div>

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
                    <span className="muted">{timeAgo(o.created_at)}</span>
                  </div>
                  <span className={`status status-${o.status}`}>{st.label}</span>
                </header>
                {o.address && <p className="order-addr">{o.address}</p>}
                <ul className="order-items">
                  {(o.order_items || []).map((it) => (
                    <li key={it.id}><b>{it.qty}×</b> {it.name}<span>{money(it.unit_price * it.qty)}</span></li>
                  ))}
                </ul>
                {o.notes && <p className="order-notes">{o.notes}</p>}
                <footer>
                  <strong>{money(o.total)}</strong>
                  <div className="order-btns">
                    {['nuevo', 'preparando'].includes(o.status) && (
                      <button className="btn btn-ghost btn-sm btn-danger-text" onClick={() => confirm('¿Cancelar este pedido?') && setStatus(o, 'cancelado')}>Cancelar</button>
                    )}
                    {st.next && <button className="btn btn-primary btn-sm" onClick={() => setStatus(o, st.next)}>{st.action}</button>}
                  </div>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
