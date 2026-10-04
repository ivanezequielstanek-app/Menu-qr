import { THEMES, THEME_PRESETS, themeById } from '../lib/designs'
import { Segmented, Switch } from './ui'

/** Panel de opciones de diseño (solo lo ve el administrador). */
export default function DesignControls({ theme, options: o, onChange }) {
  const set = (patch) => onChange({ theme, options: { ...o, ...patch } })
  const setType = (k, v) => set({ orderTypes: { ...o.orderTypes, [k]: v } })
  const defaultAccent = themeById(theme).colors[1]

  function pickTheme(id) {
    onChange({ theme: id, options: { ...o, ...THEME_PRESETS[id], accent: null } })
  }

  return (
    <div className="dc">
      <section className="dc-group">
        <h3>Diseño</h3>
        <div className="theme-cards">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={`theme-card ${theme === t.id ? 'is-on' : ''}`}
              onClick={() => pickTheme(t.id)} aria-pressed={theme === t.id}>
              <span className="theme-sw" aria-hidden="true">
                {t.colors.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <strong>{t.name}</strong>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="dc-group">
        <h3>Color principal</h3>
        <div className="dc-row">
          <input type="color" className="color-input" value={o.accent || defaultAccent}
            onChange={(e) => set({ accent: e.target.value })} aria-label="Color principal" />
          <span className="muted">{o.accent ? o.accent.toUpperCase() : 'El del diseño'}</span>
          {o.accent && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ accent: null })}>Restablecer</button>}
        </div>
      </section>

      <section className="dc-group">
        <h3>Encabezado</h3>
        <Segmented ariaLabel="Encabezado" value={o.heroStyle} onChange={(v) => set({ heroStyle: v })}
          options={[['full', 'Grande'], ['compact', 'Compacto']]} />
        <Switch checked={o.showLogo} onChange={(v) => set({ showLogo: v })} label="Mostrar logo" />
      </section>

      <section className="dc-group">
        <h3>Categorías</h3>
        <Segmented ariaLabel="Categorías" value={o.categoryMode} onChange={(v) => set({ categoryMode: v })}
          options={[['tabs', 'Pestañas'], ['accordion', 'Desplegables'], ['none', 'Sin categorías']]} />
        <p className="hint">
          {o.categoryMode === 'tabs' && 'Barra fija arriba para saltar entre categorías.'}
          {o.categoryMode === 'accordion' && 'Cada categoría se abre y se cierra. Ideal para cartas largas.'}
          {o.categoryMode === 'none' && 'Todos los productos en una sola lista. Ideal para cartas cortas.'}
        </p>
      </section>

      <section className="dc-group">
        <h3>Productos</h3>
        <label className="dc-label">Distribución</label>
        <Segmented ariaLabel="Distribución" value={o.layout} onChange={(v) => set({ layout: v })}
          options={[['list', 'Lista'], ['grid', 'Cuadrícula']]} />
        <label className="dc-label">Tamaño de fotos</label>
        <Segmented ariaLabel="Tamaño de fotos" value={o.photoSize} onChange={(v) => set({ photoSize: v })}
          options={[['none', 'Sin fotos'], ['sm', 'Chicas'], ['md', 'Medianas'], ['lg', 'Grandes']]} />
        <Switch checked={o.showDescriptions} onChange={(v) => set({ showDescriptions: v })} label="Mostrar descripciones" />
      </section>

      <section className="dc-group">
        <h3>Pedidos</h3>
        <Switch checked={o.ordering} onChange={(v) => set({ ordering: v })} label="Permitir armar pedidos" />
        <Switch checked={o.whatsapp} onChange={(v) => set({ whatsapp: v })}
          label={o.ordering ? 'Enviar pedidos por WhatsApp' : 'Botón para consultar por WhatsApp'} />
        {o.ordering && (
          <div className="dc-checks">
            <Switch checked={o.orderTypes.table} onChange={(v) => setType('table', v)} label="En la mesa" />
            <Switch checked={o.orderTypes.pickup} onChange={(v) => setType('pickup', v)} label="Para retirar" />
            <Switch checked={o.orderTypes.delivery} onChange={(v) => setType('delivery', v)} label="Envío a domicilio" />
          </div>
        )}
        {o.ordering && !o.orderTypes.table && !o.orderTypes.pickup && !o.orderTypes.delivery && (
          <p className="form-error">Activá al menos un tipo de pedido o los clientes no podrán pedir.</p>
        )}
      </section>
    </div>
  )
}
