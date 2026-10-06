import { useEffect, useMemo, useRef, useState } from 'react'
import { resolveOptions } from '../lib/designs'
import { money, readableOn, waLink } from '../lib/format'
import { Plus, Close, Chevron, Check, WhatsApp, Left, Right } from '../components/icons'

const TYPES = [
  ['mesa', 'table', 'En la mesa'],
  ['retiro', 'pickup', 'Para retirar'],
  ['delivery', 'delivery', 'Envío'],
]
const TYPE_LABEL = { mesa: 'Consumo en el local', retiro: 'Retira en el local', delivery: 'Envío a domicilio' }

/**
 * Menú público. Se usa en la página real (/:slug), en la vista previa del
 * editor de diseño (embedded) y en la demo.
 */
export default function MenuView({
  restaurant, theme = 'elegante', options, categories = [], products = [],
  embedded = false, initialTable = '', onSubmitOrder, onOpenWhatsApp,
}) {
  const o = resolveOptions(theme, options)
  const scrollRef = useRef(null)
  const tabsBarRef = useRef(null)
  const tabsRef = useRef(null)
  const secRefs = useRef({})

  const sections = useMemo(() => {
    const sorted = [...categories].filter((c) => c.visible !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    return sorted.map((c) => ({
      ...c,
      items: products.filter((p) => p.category_id === c.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    })).filter((c) => c.items.length > 0)
  }, [categories, products])

  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections])
  const featured = useMemo(() => (o.showFeatured ? flat.filter((p) => p.featured).slice(0, 12) : []), [flat, o.showFeatured])
  const [detail, setDetail] = useState(null) // { list: 'all' | 'feat', i, dir }
  const [cart, setCart] = useState({})
  const [sheetOpen, setSheetOpen] = useState(false)
  const [active, setActive] = useState(null)
  const [openCats, setOpenCats] = useState(() => new Set())

  useEffect(() => {
    setOpenCats(new Set(sections[0] ? [sections[0].id] : []))
    setActive(sections[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.categoryMode, sections.length])

  const lines = Object.entries(cart).map(([id, q]) => ({ p: byId[id], q })).filter((l) => l.p && l.q > 0)
  const count = lines.reduce((s, l) => s + l.q, 0)
  const total = lines.reduce((s, l) => s + Number(l.p.price) * l.q, 0)
  const hasWa = o.whatsapp && !!restaurant?.whatsapp
  const enabledTypes = TYPES.filter(([, key]) => o.orderTypes[key]).map(([t]) => t)
  const canOrder = o.ordering && enabledTypes.length > 0

  const add = (id, n = 1) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + n }))
  const openDetail = (list, i) => setDetail({ list, i, dir: 0 })
  const detailItems = detail?.list === 'feat' ? featured : flat
  function navDetail(step) {
    setDetail((d) => {
      const len = (d.list === 'feat' ? featured : flat).length
      const i = d.i + step
      return i < 0 || i >= len ? d : { ...d, i, dir: step }
    })
  }
  const sub = (id) => setCart((c) => {
    const n = { ...c }; n[id] = (n[id] || 0) - 1
    if (n[id] <= 0) delete n[id]
    return n
  })

  // Resalta la pestaña de la sección visible
  useEffect(() => {
    if (o.categoryMode !== 'tabs' || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && setActive(e.target.dataset.id))
    }, { root: embedded ? scrollRef.current : null, rootMargin: '-25% 0px -65% 0px' })
    Object.values(secRefs.current).forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [o.categoryMode, sections, embedded])

  useEffect(() => {
    const bar = tabsRef.current
    const tab = bar?.querySelector(`[data-id="${active}"]`)
    if (bar && tab) bar.scrollTo({ left: tab.offsetLeft - 24, behavior: 'smooth' })
  }, [active])

  useEffect(() => {
    if (embedded || (!sheetOpen && !detail)) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [sheetOpen, detail, embedded])

  function goTo(id) {
    const el = secRefs.current[id]
    if (!el) return
    const offset = (tabsBarRef.current?.offsetHeight || 0) + 4
    if (embedded) scrollRef.current.scrollTo({ top: el.offsetTop - offset, behavior: 'smooth' })
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' })
    setActive(id)
  }

  function toggleCat(id) {
    setOpenCats((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function renderItem(p) {
    const q = cart[p.id] || 0
    const out = p.available === false
    const img = p.image_url
    const showPhoto = o.photoSize !== 'none' && (img || o.layout === 'grid')
    const cls = ['mq-item', out && 'is-out', showPhoto && 'has-photo', canOrder && !out && 'can-order'].filter(Boolean).join(' ')
    const open = o.lightbox ? () => openDetail('all', flat.indexOf(p)) : null
    const tap = open ? {
      role: 'button', tabIndex: 0, onClick: open, 'aria-label': `Ver ${p.name}`,
      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } },
    } : {}
    const tapCls = open ? ' mq-tap' : ''
    return (
      <article key={p.id} className={cls}>
        {showPhoto && (
          <div className={'mq-photo' + tapCls} {...tap}>
            {img ? <img src={img} alt="" loading="lazy" decoding="async" />
              : <span className="mq-ph" aria-hidden="true">{p.name?.[0]}</span>}
          </div>
        )}
        <div className={'mq-body' + tapCls} {...tap} aria-label={undefined}>
          <div className="mq-head">
            <h3 className="mq-name">{p.name}</h3>
            <span className="mq-lead" aria-hidden="true" />
            <span className="mq-price">{money(p.price)}</span>
          </div>
          {o.showDescriptions && p.description && <p className="mq-desc">{p.description}</p>}
          {out && <span className="mq-out">Agotado</span>}
        </div>
        {canOrder && !out && (
          <div className="mq-actions">
            {q === 0 ? (
              <button type="button" className="mq-add" onClick={() => add(p.id)} aria-label={`Agregar ${p.name}`}><Plus /></button>
            ) : (
              <div className="mq-step">
                <button type="button" onClick={() => sub(p.id)} aria-label={`Quitar un ${p.name}`}>−</button>
                <span aria-live="polite">{q}</span>
                <button type="button" onClick={() => add(p.id)} aria-label={`Agregar otro ${p.name}`}>+</button>
              </div>
            )}
          </div>
        )}
      </article>
    )
  }

  let content
  if (sections.length === 0) {
    content = <p className="mq-empty">Este menú todavía no tiene productos.</p>
  } else if (o.categoryMode === 'none') {
    content = <div className="mq-sec"><div className="mq-list">{sections.flatMap((s) => s.items).map(renderItem)}</div></div>
  } else if (o.categoryMode === 'accordion') {
    content = sections.map((s) => {
      const isOpen = openCats.has(s.id)
      return (
        <section key={s.id} className="mq-acc">
          <button type="button" className="mq-acc-head" aria-expanded={isOpen} onClick={() => toggleCat(s.id)}>
            <span className="mq-sec-title">{s.name}</span>
            <span className="mq-acc-meta">{s.items.length}<Chevron /></span>
          </button>
          {isOpen && <div className="mq-acc-body"><div className="mq-list">{s.items.map(renderItem)}</div></div>}
        </section>
      )
    })
  } else {
    content = sections.map((s) => (
      <section key={s.id} ref={(el) => { secRefs.current[s.id] = el }} data-id={s.id} className="mq-sec">
        <h2 className="mq-sec-title">{s.name}</h2>
        <div className="mq-list">{s.items.map(renderItem)}</div>
      </section>
    ))
  }

  const style = o.accent ? { '--accent': o.accent, '--price': o.accent, '--accent-fg': readableOn(o.accent) } : undefined
  const rootCls = ['mq', `t-${theme}`, `layout-${o.layout}`, `photos-${o.photoSize}`,
    `cats-${o.categoryMode}`, `hero-${o.heroStyle}`, embedded && 'mq-embedded'].filter(Boolean).join(' ')

  return (
    <div className={rootCls} style={style}>
      <div className="mq-scroll" ref={scrollRef}>
        <header className="mq-hero">
          <div className="mq-hero-in">
            {o.showLogo && restaurant?.logo_url && <img className="mq-logo" src={restaurant.logo_url} alt="" />}
            <div>
              <h1 data-initial={restaurant?.name?.trim()?.[0] || ''}>{restaurant?.name}</h1>
              {restaurant?.tagline && <p>{restaurant.tagline}</p>}
              {initialTable && canOrder && <span className="mq-chip">Mesa {initialTable}</span>}
            </div>
          </div>
        </header>

        {o.categoryMode === 'tabs' && sections.length > 1 && (
          <nav className="mq-tabs" ref={tabsBarRef} aria-label="Categorías">
            <div className="mq-tabs-in" ref={tabsRef}>
              {sections.map((s) => (
                <button key={s.id} type="button" data-id={s.id}
                  className={`mq-tab ${active === s.id ? 'is-active' : ''}`} onClick={() => goTo(s.id)}>{s.name}</button>
              ))}
            </div>
          </nav>
        )}

        <main className="mq-main">
          {featured.length > 0 && (
            <section className="mq-feat" aria-label="Recomendados">
              <h2 className="mq-feat-title">Recomendados</h2>
              <div className="mq-feat-row">
                {featured.map((p, i) => (
                  <button key={p.id} type="button" className="mq-feat-card" onClick={() => openDetail('feat', i)}>
                    {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span className="mq-ph" aria-hidden="true">{p.name?.[0]}</span>}
                    <span className="mq-feat-info"><strong>{p.name}</strong><span>{money(p.price)}</span></span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {content}
        </main>

        {canOrder && count > 0 && (
          <div className="mq-dock">
            <button type="button" className="mq-cartbar" onClick={() => setSheetOpen(true)}>
              <span className="mq-count">{count}</span>
              <span>Ver pedido</span>
              <strong>{money(total)}</strong>
            </button>
          </div>
        )}
        {!o.ordering && hasWa && (
          <div className="mq-dock">
            <a className="mq-cartbar mq-wa" target="_blank" rel="noopener noreferrer"
              href={waLink(restaurant.whatsapp, `Hola ${restaurant.name}, quería hacer una consulta.`)}>
              <WhatsApp /> <span>Consultar por WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {detail && detailItems[detail.i] && (
        <Detail
          items={detailItems} index={detail.i} dir={detail.dir} canOrder={canOrder}
          inCart={cart[detailItems[detail.i].id] || 0}
          onAdd={add} onNav={navDetail} onClose={() => setDetail(null)}
        />
      )}
      {sheetOpen && (
        <Checkout
          restaurant={restaurant} lines={lines} total={total} types={enabledTypes} hasWa={hasWa}
          initialTable={initialTable} onAdd={add} onSub={sub}
          onClose={() => setSheetOpen(false)} onDone={() => setCart({})}
          onSubmitOrder={onSubmitOrder} onOpenWhatsApp={onOpenWhatsApp}
        />
      )}
    </div>
  )
}

function Detail({ items, index, dir, canOrder, inCart, onAdd, onNav, onClose }) {
  const p = items[index]
  const out = p.available === false
  const [qty, setQty] = useState(1)
  const touch = useRef(null)
  useEffect(() => { setQty(1) }, [p.id])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNav(-1)
      if (e.key === 'ArrowRight') onNav(1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onNav])

  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY } }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) onNav(dx < 0 ? 1 : -1)
  }

  return (
    <div className="mq-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mq-detail" role="dialog" aria-modal="true" aria-label={p.name} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div key={p.id} className={`mq-detail-slide ${dir > 0 ? 'from-r' : dir < 0 ? 'from-l' : ''}`}>
          <div className={`mq-detail-img ${p.image_url ? '' : 'is-empty'}`}>
            {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span className="mq-ph" aria-hidden="true">{p.name?.[0]}</span>}
            {items.length > 1 && <>
              <button type="button" className="mq-detail-nav is-prev" onClick={() => onNav(-1)} disabled={index === 0} aria-label="Producto anterior"><Left /></button>
              <button type="button" className="mq-detail-nav is-next" onClick={() => onNav(1)} disabled={index === items.length - 1} aria-label="Producto siguiente"><Right /></button>
              <span className="mq-detail-count">{index + 1} / {items.length}</span>
            </>}
          </div>
          <div className="mq-detail-body">
            <div className="mq-detail-head">
              <h2>{p.name}</h2>
              <span className="mq-detail-price">{money(p.price)}</span>
            </div>
            {p.description && <p className="mq-detail-desc">{p.description}</p>}
            {out && <span className="mq-out">Agotado</span>}
            {inCart > 0 && <p className="mq-detail-incart">Ya tenés {inCart} en tu pedido</p>}
            {canOrder && !out && (
              <div className="mq-detail-actions">
                <div className="mq-mini-step mq-big-step">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Más">+</button>
                </div>
                <button type="button" className="mq-submit mq-detail-add" onClick={() => { onAdd(p.id, qty); onClose() }}>
                  Agregar · {money(Number(p.price) * qty)}
                </button>
              </div>
            )}
          </div>
        </div>
        <button type="button" className="mq-detail-x" onClick={onClose} aria-label="Cerrar"><Close /></button>
      </div>
    </div>
  )
}

function buildMessage(restaurant, order, lines, total) {
  const out = [`*Nuevo pedido · ${restaurant.name}*`, TYPE_LABEL[order.type] + (order.type === 'mesa' ? ` · Mesa ${order.table}` : '')]
  if (order.name) out.push(`Cliente: ${order.name}`)
  if (order.type === 'delivery') out.push(`Dirección: ${order.address}`)
  out.push('')
  lines.forEach((l) => out.push(`${l.q} × ${l.p.name} — ${money(Number(l.p.price) * l.q)}`))
  out.push('', `*Total: ${money(total)}*`)
  if (order.notes) out.push('', `Aclaraciones: ${order.notes}`)
  return out.join('\n')
}

function Checkout({ restaurant, lines, total, types, hasWa, initialTable, onAdd, onSub, onClose, onDone, onSubmitOrder, onOpenWhatsApp }) {
  const [type, setType] = useState(initialTable && types.includes('mesa') ? 'mesa' : types[0])
  const [table, setTable] = useState(initialTable || '')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    if (type === 'mesa' && !table.trim()) return setError('Indicá el número de mesa.')
    if (type !== 'mesa' && !name.trim()) return setError('Indicá tu nombre para identificar el pedido.')
    if (type === 'delivery' && !address.trim()) return setError('Indicá la dirección de entrega.')
    setError(''); setSending(true)
    const order = {
      type, table: table.trim(), name: name.trim(), address: address.trim(), notes: notes.trim(),
      items: lines.map((l) => ({ product_id: l.p.id, qty: l.q })),
    }
    try {
      await onSubmitOrder?.(order)
    } catch (err) {
      console.error(err)
      setSending(false)
      return setError('No pudimos enviar el pedido. Revisá tu conexión e intentá de nuevo.')
    }
    const url = hasWa ? waLink(restaurant.whatsapp, buildMessage(restaurant, order, lines, total)) : null
    setSent({ url })
    setSending(false)
    onDone()
    if (url) (onOpenWhatsApp || ((u) => window.location.assign(u)))(url)
  }

  return (
    <div className="mq-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mq-sheet" role="dialog" aria-modal="true" aria-label="Tu pedido">
        <div className="mq-grip" />
        {sent ? (
          <div className="mq-sent">
            <div className="mq-sent-icon"><Check size={30} /></div>
            <h2>¡Pedido enviado!</h2>
            <p>{sent.url ? 'Confirmalo en WhatsApp para que el local lo reciba.' : 'El local ya recibió tu pedido.'}</p>
            {sent.url && <a className="mq-submit is-wa" href={sent.url} target="_blank" rel="noopener noreferrer"><WhatsApp /> Abrir WhatsApp</a>}
            <button type="button" className="mq-link" onClick={onClose}>Volver al menú</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="mq-sheet-head">
              <h2>Tu pedido</h2>
              <button type="button" className="mq-close" onClick={onClose} aria-label="Cerrar"><Close /></button>
            </div>
            <ul className="mq-lines">
              {lines.map((l) => (
                <li key={l.p.id} className="mq-line">
                  <div className="mq-line-name">{l.p.name}<small>{money(l.p.price)} c/u</small></div>
                  <div className="mq-mini-step">
                    <button type="button" onClick={() => onSub(l.p.id)} aria-label="Quitar uno">−</button>
                    <span>{l.q}</span>
                    <button type="button" onClick={() => onAdd(l.p.id)} aria-label="Agregar uno">+</button>
                  </div>
                </li>
              ))}
            </ul>
            {lines.length === 0 && <p className="mq-muted">Tu pedido está vacío.</p>}
            <div className="mq-total"><span>Total</span><span>{money(total)}</span></div>

            {types.length > 1 && (
              <div className="mq-types" role="radiogroup" aria-label="Tipo de pedido">
                {TYPES.filter(([t]) => types.includes(t)).map(([t, , label]) => (
                  <button key={t} type="button" role="radio" aria-checked={type === t}
                    className="mq-type" aria-pressed={type === t} onClick={() => setType(t)}>{label}</button>
                ))}
              </div>
            )}

            {type === 'mesa' && (<>
              <label className="mq-label" htmlFor="mq-table">Número de mesa</label>
              <input id="mq-table" className="mq-input" inputMode="numeric" value={table} onChange={(e) => setTable(e.target.value)} />
            </>)}
            <label className="mq-label" htmlFor="mq-name">Tu nombre{type === 'mesa' ? ' (opcional)' : ''}</label>
            <input id="mq-name" className="mq-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            {type === 'delivery' && (<>
              <label className="mq-label" htmlFor="mq-addr">Dirección de entrega</label>
              <input id="mq-addr" className="mq-input" autoComplete="street-address" placeholder="Calle, número, piso" value={address} onChange={(e) => setAddress(e.target.value)} />
            </>)}
            <label className="mq-label" htmlFor="mq-notes">Aclaraciones</label>
            <textarea id="mq-notes" className="mq-input" rows={2} placeholder="Sin cebolla, punto de la carne…" value={notes} onChange={(e) => setNotes(e.target.value)} />

            {error && <p className="mq-error" role="alert">{error}</p>}
            <button type="submit" className={`mq-submit ${hasWa ? 'is-wa' : ''}`} disabled={sending || lines.length === 0}>
              {hasWa && <WhatsApp />}
              {sending ? 'Enviando…' : hasWa ? 'Enviar por WhatsApp' : 'Enviar pedido'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
