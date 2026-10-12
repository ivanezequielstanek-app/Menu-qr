// Estado de la demo: todo vive en memoria. Nada se guarda; al recargar vuelve al ejemplo.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { getSample } from './mockData'
import { resolveOptions } from '../lib/designs'
import { slugify } from '../lib/format'

// Ejemplos disponibles (cada uno usa su diseño recomendado)
export const SAMPLE_LIST = [
  ['parrilla', 'Parrilla'],
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

function makeOrder(products, { type, table, name, address, notes, status, at }, picks) {
  const order_items = picks.map(([idx, qty]) => {
    const p = products[Math.min(idx, products.length - 1)]
    return { id: uid('it'), product_id: p.id, name: p.name, qty, unit_price: Number(p.price) }
  })
  return {
    id: uid('o'), order_type: type, table_number: table || null, customer_name: name || null,
    address: address || null, notes: notes || null, status, created_at: at,
    order_items, total: order_items.reduce((s, it) => s + it.unit_price * it.qty, 0),
  }
}

function seedOrders(products) {
  if (!products.length) return []
  const last = products.length - 1
  return [
    makeOrder(products, { type: 'mesa', table: '4', status: 'nuevo', at: minutesAgo(2) }, [[0, 2], [3, 1]]),
    makeOrder(products, { type: 'retiro', name: 'Lucía', notes: 'Sin sal, por favor', status: 'preparando', at: minutesAgo(11) }, [[1, 1], [last, 2]]),
    makeOrder(products, { type: 'mesa', table: '7', status: 'entregado', at: minutesAgo(48) }, [[4, 1], [2, 1]]),
  ]
}

function fresh(theme) {
  const s = getSample(theme) // viene cacheado: lo copiamos para no tocar el original
  const products = s.products.map((p) => ({ ...p }))
  return {
    sample: theme,
    restaurant: { ...s.restaurant, slug: slugify(s.restaurant.name), logo_url: null },
    design: { theme, options: resolveOptions(theme) },
    categories: s.categories.map((c) => ({ ...c })),
    products,
    orders: seedOrders(products),
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
      const order_items = order.items.map((it) => {
        const p = byId[it.product_id]
        return { id: uid('it'), product_id: it.product_id, name: p?.name || 'Producto', qty: it.qty, unit_price: Number(p?.price) || 0 }
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
