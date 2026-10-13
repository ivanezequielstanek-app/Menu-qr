// Estado de la demo: todo vive en memoria. Nada se guarda; al recargar vuelve al ejemplo.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { getSample } from './mockData'
import { resolveOptions } from '../lib/designs'
import { slugify } from '../lib/format'
import { choiceOf, describePicks } from '../lib/flavors'

// Ejemplos disponibles (cada uno usa su diseño recomendado)
export const SAMPLE_LIST = [
  ['parrilla', 'Parrilla'],
  ['heladeria', 'Heladería'],
  ['burger', 'Hamburguesería'],
  ['cafe', 'Cafetería'],
  ['bar', 'Bar'],
  ['elegante', 'Restaurante'],
  ['zen', 'Sushi'],
  ['fresco', 'Saludable'],
  ['galeria', 'Bistró'],
]

let seq = 0
export const uid = (p) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`

const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString()

// Sabores de ejemplo para un producto que los pide (toma los primeros disponibles)
function samplePicks(p, flavors, seed) {
  const c = choiceOf(p)
  const ok = flavors.filter((f) => f.available !== false)
  if (!c || !ok.length) return null
  return Array.from({ length: c.units }, (_, u) => Array.from({ length: Math.min(c.parts[u].max, 2, ok.length) }, (_, k) => ok[(seed * 3 + u * 2 + k * 5) % ok.length].id)
    .filter((id, i, a) => a.indexOf(id) === i))
}

function makeOrder(products, flavors, { type, table, name, address, notes, status, at }, picks) {
  const nameById = Object.fromEntries(flavors.map((f) => [f.id, f.name]))
  const order_items = picks.map(([idx, qty], k) => {
    const p = products[Math.min(idx, products.length - 1)]
    const fl = samplePicks(p, flavors, k + idx)
    return { id: uid('it'), product_id: p.id, name: p.name, qty, unit_price: Number(p.price),
      details: fl ? describePicks(choiceOf(p), fl, nameById) : null }
  })
  return {
    id: uid('o'), order_type: type, table_number: table || null, customer_name: name || null,
    address: address || null, notes: notes || null, status, created_at: at,
    order_items, total: order_items.reduce((s, it) => s + it.unit_price * it.qty, 0),
  }
}

function seedOrders(products, flavors = []) {
  if (!products.length) return []
  const last = products.length - 1
  const ice = flavors.length > 0
  return [
    makeOrder(products, flavors, { type: 'mesa', table: '4', status: 'nuevo', at: minutesAgo(2) }, ice ? [[0, 1], [5, 2]] : [[0, 2], [3, 1]]),
    makeOrder(products, flavors, { type: 'retiro', name: 'Lucía', notes: ice ? 'Con cucharitas extra' : 'Sin sal, por favor', status: 'preparando', at: minutesAgo(11) }, ice ? [[3, 1]] : [[1, 1], [last, 2]]),
    makeOrder(products, flavors, { type: 'mesa', table: '7', status: 'entregado', at: minutesAgo(48) }, [[4, 1], [2, 1]]),
  ]
}

function fresh(sample) {
  const s = getSample(sample) // viene cacheado: lo copiamos para no tocar el original
  const theme = s.theme || sample
  const products = s.products.map((p) => ({ ...p }))
  const flavors = (s.flavors || []).map((f) => ({ ...f }))
  return {
    sample,
    restaurant: { ...s.restaurant, slug: slugify(s.restaurant.name), logo_url: null },
    design: { theme, options: resolveOptions(theme) },
    categories: s.categories.map((c) => ({ ...c })),
    products,
    flavors,
    orders: seedOrders(products, flavors),
    table: '', // mesa simulada al "escanear" un QR de mesa
  }
}

const Ctx = createContext(null)
export const useDemo = () => useContext(Ctx)

export function DemoProvider({ children }) {
  const [state, setState] = useState(() => fresh('parrilla'))

  const update = useCallback((key, v) => setState((s) => ({ ...s, [key]: typeof v === 'function' ? v(s[key]) : v })), [])
  const loadSample = useCallback((theme) => setState(fresh(theme)), [])

  const addOrder = useCallback((order) => new Promise((resolve) => {
    setState((s) => {
      const byId = Object.fromEntries(s.products.map((p) => [p.id, p]))
      const nameById = Object.fromEntries(s.flavors.map((f) => [f.id, f.name]))
      const order_items = order.items.map((it) => {
        const p = byId[it.product_id]
        const c = choiceOf(p)
        return { id: uid('it'), product_id: it.product_id, name: p?.name || 'Producto', qty: it.qty, unit_price: Number(p?.price) || 0,
          details: c && it.flavors ? describePicks(c, it.flavors, nameById) : null }
      })
      const o = {
        id: uid('o'), order_type: order.type, table_number: order.table || null, customer_name: order.name || null,
        address: order.address || null, notes: order.notes || null, status: 'nuevo', created_at: new Date().toISOString(),
        order_items, total: order_items.reduce((t, it) => t + it.unit_price * it.qty, 0), fresh: true,
      }
      return { ...s, orders: [o, ...s.orders] }
    })
    setTimeout(resolve, 450)
  }), [])

  const value = useMemo(() => ({ state, update, loadSample, addOrder }), [state, update, loadSample, addOrder])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
