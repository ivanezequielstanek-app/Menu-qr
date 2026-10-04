// Diseños disponibles. Cada uno tiene opciones recomendadas que se aplican
// al elegirlo, pero todas las opciones funcionan con todos los diseños.

export const THEMES = [
  { id: 'elegante', name: 'Elegante', hint: 'Restaurantes de autor y cocina de estación',
    colors: ['#111920', '#c6a66b', '#ece5d3'], bg: '#111920' },
  { id: 'burger', name: 'Urbano', hint: 'Hamburgueserías, pizzerías y comida rápida',
    colors: ['#ffc629', '#e63b1f', '#1c1410'], bg: '#fff8e6' },
  { id: 'bar', name: 'Nocturno', hint: 'Bares, cervecerías y coctelerías',
    colors: ['#16121d', '#f0a646', '#7b5cc4'], bg: '#16121d' },
  { id: 'parrilla', name: 'Brasa', hint: 'Parrillas, asadores y bodegones',
    colors: ['#ffffff', '#c4261b', '#231a15'], bg: '#ffffff' },
]

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0]

export const DEFAULT_OPTIONS = {
  heroStyle: 'full',          // full | compact
  showLogo: true,
  categoryMode: 'tabs',       // tabs | accordion | none
  layout: 'list',             // list | grid
  photoSize: 'md',            // none | sm | md | lg
  showDescriptions: true,
  accent: null,               // color propio o null = el del diseño
  ordering: true,             // permitir armar pedido
  whatsapp: true,             // enviar el pedido por WhatsApp
  orderTypes: { table: true, pickup: true, delivery: false },
}

export const THEME_PRESETS = {
  elegante: { layout: 'list', photoSize: 'sm', categoryMode: 'tabs' },
  burger: { layout: 'grid', photoSize: 'lg', categoryMode: 'tabs' },
  bar: { layout: 'list', photoSize: 'md', categoryMode: 'accordion' },
  parrilla: { layout: 'list', photoSize: 'md', categoryMode: 'tabs' },
}

export function resolveOptions(theme, opts) {
  const o = opts || {}
  return {
    ...DEFAULT_OPTIONS,
    ...(THEME_PRESETS[theme] || {}),
    ...o,
    orderTypes: { ...DEFAULT_OPTIONS.orderTypes, ...(o.orderTypes || {}) },
  }
}
