// Productos con elección de sabores (helados por kilo, promos de potes, etc.)
// choice = { units, min, max, label }  ·  units = cuántos potes/unidades trae el producto

const int = (v) => Math.trunc(Number(v)) || 0

/** Devuelve la configuración normalizada, o null si el producto no pide sabores */
export function choiceOf(p) {
  const c = p?.choice
  if (!c || typeof c !== 'object') return null
  const units = Math.min(Math.max(int(c.units) || 1, 1), 10)
  const min = Math.max(int(c.min) || 1, 1)
  const max = Math.max(int(c.max) || min, min)
  return { units, min, max, label: String(c.label || '').trim() }
}

/** "Kilo", "1° Pote de 1/4", "2° Pote de 1/4"… */
export function unitLabel(c, i) {
  const l = c.label || (c.units > 1 ? 'Unidad' : 'Sabores')
  return c.units > 1 ? `${i + 1}° ${l}` : l
}

/** "hasta 4 sabores", "2 sabores", "de 2 a 3 sabores" */
export function rangeText(c) {
  const s = (n) => `${n} ${n === 1 ? 'sabor' : 'sabores'}`
  if (c.min === c.max) return s(c.max)
  if (c.min === 1) return `hasta ${s(c.max)}`
  return `de ${c.min} a ${c.max} sabores`
}

/** Texto con los sabores elegidos: "1° Pote de 1/4: Chocolate · 2° Pote de 1/4: Limón, Frutilla" */
export function describePicks(c, picks, nameById) {
  return picks.map((ids, i) => `${unitLabel(c, i)}: ${ids.map((id) => nameById[id] || '?').join(', ')}`).join(' · ')
}

/** Agrupa los sabores por grupo respetando el orden */
export function groupFlavors(flavors) {
  const sorted = [...flavors].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const map = new Map()
  sorted.forEach((f) => {
    const g = (f.grp || '').trim() || 'Sabores'
    if (!map.has(g)) map.set(g, [])
    map.get(g).push(f)
  })
  return [...map.entries()].map(([name, items]) => ({ name, items }))
}

export const FLAVOR_GROUPS = ['Cremas', 'Chocolates', 'Dulce de leche', 'Frutales', 'Al agua', 'Especiales', 'Sin TACC', 'Veganos']
