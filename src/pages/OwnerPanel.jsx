import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import AppShell from '../components/AppShell'
import { Empty, Spinner } from '../components/ui'
import { External, Edit, Bell, Store, QrIcon, IceCream } from '../components/icons'
import MenuEditor from './panel/MenuEditor'
import Orders from './panel/Orders'
import Settings from './panel/Settings'
import QrCodes from './panel/QrCodes'
import Flavors from './panel/Flavors'

const TABS = [
  ['menu', 'Menú', Edit, 'Menú'],
  ['sabores', 'Sabores', IceCream, 'Sabores'],
  ['pedidos', 'Pedidos', Bell, 'Pedidos'],
  ['local', 'Mi local', Store, 'Local'],
  ['qr', 'Códigos QR', QrIcon, 'QR'],
]

export default function OwnerPanel() {
  const { session, isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'menu'
  const forced = isAdmin ? params.get('r') : null // el admin puede entrar al panel de cualquier cliente
  const [list, setList] = useState(null)
  const [rid, setRid] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const cols = 'id, slug, name, tagline, whatsapp, logo_path, active'
    let rows = []
    if (forced) {
      const { data, error: e } = await supabase.from('restaurants').select(cols).eq('id', forced)
      if (e) setError(friendlyError(e))
      rows = data || []
    } else {
      const { data, error: e } = await supabase.from('restaurant_members')
        .select(`restaurants(${cols})`).eq('user_id', session.user.id)
      if (e) setError(friendlyError(e))
      rows = (data || []).map((m) => m.restaurants).filter(Boolean)
    }
    setList(rows)
    setRid((cur) => (rows.some((r) => r.id === cur) ? cur : rows[0]?.id || null))
  }, [forced, session.user.id])
  useEffect(() => { load() }, [load])

  const restaurant = list?.find((r) => r.id === rid)
  const goTab = (t) => { const p = new URLSearchParams(params); p.set('tab', t); setParams(p, { replace: true }) }

  if (!list) return <AppShell><Spinner /></AppShell>
  if (!restaurant) return (
    <AppShell>
      <Empty title="Todavía no tenés un local asignado"
        text={error || 'Pedile al administrador que te dé acceso a tu menú.'} />
    </AppShell>
  )

  return (
    <AppShell actions={
      <a className="btn btn-secondary btn-sm" href={`/${restaurant.slug}`} target="_blank" rel="noopener noreferrer"><External /> Ver menú</a>
    }>
      <div className="panel-head">
        {list.length > 1 ? (
          <select className="input input-title" value={rid} onChange={(e) => setRid(e.target.value)} aria-label="Elegir local">
            {list.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        ) : <h2 className="panel-name">{restaurant.name}</h2>}
        {forced && <span className="badge badge-info">Modo administrador</span>}
        {!restaurant.active && <span className="badge badge-warn">Menú pausado</span>}
      </div>
      <nav className="tabs app-tabs no-print" aria-label="Secciones">
        {TABS.map(([id, label, Icon, short]) => (
          <button key={id} className={tab === id ? 'is-on' : ''} onClick={() => goTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon /> <span className="tab-long">{label}</span><span className="tab-short">{short}</span>
          </button>
        ))}
      </nav>
      {tab === 'menu' && <MenuEditor key={rid} restaurant={restaurant} />}
      {tab === 'sabores' && <Flavors key={rid} restaurant={restaurant} />}
      {tab === 'pedidos' && <Orders key={rid} restaurant={restaurant} />}
      {tab === 'local' && <Settings key={rid} restaurant={restaurant} onSaved={load} />}
      {tab === 'qr' && <QrCodes key={rid} restaurant={restaurant} />}
    </AppShell>
  )
}
