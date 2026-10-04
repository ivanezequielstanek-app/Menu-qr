const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

export const money = (n) => '$ ' + nf.format(Number(n) || 0)

// Acepta "12500", "12.500", "12.500,50", "12500.5"
export function parsePrice(input) {
  let s = String(input ?? '').replace(/[$\s]/g, '')
  if (!s) return NaN
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  return Number(s)
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

export const onlyDigits = (s) => String(s || '').replace(/\D/g, '')

export function waLink(number, text) {
  return `https://wa.me/${onlyDigits(number)}?text=${encodeURIComponent(text)}`
}

// Color de texto legible sobre un fondo dado
export function readableOn(hex) {
  const h = String(hex || '').replace('#', '')
  if (h.length !== 6) return '#ffffff'
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return L > 0.45 ? '#141414' : '#ffffff'
}

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'recién'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return new Date(date).toLocaleDateString('es-AR')
}
