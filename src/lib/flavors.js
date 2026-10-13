// Productos con elección de sabores (helados por kilo, promos de potes, etc.)

const int = (v) => Math.trunc(Number(v)) || 0

// Cada producto con sabores tiene una lista de "partes" (potes, cucuruchos…), cada una con su nombre
// y su mínimo/máximo de sabores. Ej: promo 1 kg + 1/4 de regalo →
//   { parts: [{ label: 'Kilo', min: 1, max: 4 }, { label: '1/4 de regalo', min: 1, max: 3 }] }
// También se acepta el formato anterior { units: 3, min: 1, max: 2, label: 'Pote de 1/4' }.
export const MAX_PARTS = 10

function normPart(x) {
  const min = Math.max(int(x?.min) || 1, 1)
  const max = Math.max(int(x?.max) || min, min)
  return { label: String(x?.label || '').trim(), min, max }
}

/** Devuelve { units, parts } o null si el producto no pide sabores */
export function choiceOf(p) {
  const c = p?.choice
  if (!c || typeof c !== 'object') return null
  const parts = Array.isArray(c.parts)
    ? c.parts.slice(0, MAX_PARTS).map(normPart)
    : Array.from({ length: Math.min(Math.max(int(c.units) || 1, 1), MAX_PARTS) }, () => normPart(c))
  return parts.length ? { units: parts.length, parts } : null
}

/** "Kilo", "1/4 de regalo", o "1° Pote de 1/4", "2° Pote de 1/4" cuando el nombre se repite */
export function unitLabel(c, i) {
  const l = c.parts[i].label
  if (!l) return c.units > 1 ? `Unidad ${i + 1}` : 'Sabores'
  const same = c.parts.filter((x) => x.label === l).length
  if (same < 2) return l
  return `${c.parts.slice(0, i + 1).filter((x) => x.label === l).length}° ${l}`
}

/** "hasta 4 sabores", "2 sabores", "de 2 a 3 sabores" (recibe una parte) */
export function rangeText(part) {
  const s = (n) => `${n} ${n === 1 ? 'sabor' : 'sabores'}`
  if (part.min === part.max) return s(part.max)
  if (part.min === 1) return `hasta ${s(part.max)}`
  return `de ${part.min} a ${part.max} sabores`
}

/** true si todas las partes piden lo mismo (ej. 3 potes de 1/4 iguales) */
export const isUniform = (c) => c.parts.every((x) => x.min === c.parts[0].min && x.max === c.parts[0].max && x.label === c.parts[0].label)

/** Resumen corto para mostrar en el menú: "hasta 4 sabores", "3 × hasta 2 sabores", "Kilo + 1/4 de regalo" */
export function summaryText(c) {
  if (isUniform(c)) return `${c.units > 1 ? `${c.units} × ` : ''}${rangeText(c.parts[0])}`
  return c.parts.map((x, i) => x.label || `Unidad ${i + 1}`).join(' + ')
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
