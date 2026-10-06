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
  { id: 'cafe', name: 'Café', hint: 'Cafeterías, brunch y pastelerías',
    colors: ['#eef1ea', '#2f6b4f', '#f3c6b6'], bg: '#eef1ea' },
  { id: 'zen', name: 'Zen', hint: 'Sushi, cocina asiática y nikkei',
    colors: ['#fbfaf6', '#171717', '#c8321f'], bg: '#fbfaf6' },
  { id: 'fresco', name: 'Fresco', hint: 'Comida saludable, bowls y jugos',
    colors: ['#1f7a45', '#ffe17a', '#f2f7ee'], bg: '#ffffff' },
  { id: 'galeria', name: 'Galería', hint: 'Bistrós y cocina contemporánea, foto protagonista',
    colors: ['#ffffff', '#0d0d0d', '#c9c9c4'], bg: '#ffffff' },
]

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0]

export const DEFAULT_OPTIONS = {
  heroStyle: 'full',          // full | compact
  showLogo: true,
  categoryMode: 'tabs',       // tabs | accordion | none
  layout: 'list',             // list | grid | carousel
  photoSize: 'md',            // none | sm | md | lg
  showDescriptions: true,
  lightbox: true,             // tocar un producto abre la ficha con foto grande
  showFeatured: true,         // fila de recomendados arriba
  accent: null,               // color propio o null = el del diseño
  ordering: true,
  whatsapp: true,
  orderTypes: { table: true, pickup: true, delivery: false },
}

export const THEME_PRESETS = {
  elegante: { layout: 'list', photoSize: 'sm', categoryMode: 'tabs', showFeatured: true },
  burger: { layout: 'grid', photoSize: 'lg', categoryMode: 'tabs', showFeatured: true },
  bar: { layout: 'list', photoSize: 'md', categoryMode: 'accordion', showFeatured: true },
  parrilla: { layout: 'list', photoSize: 'md', categoryMode: 'tabs', showFeatured: true },
  cafe: { layout: 'grid', photoSize: 'md', categoryMode: 'tabs', showFeatured: true },
  zen: { layout: 'list', photoSize: 'sm', categoryMode: 'tabs', showFeatured: true },
  fresco: { layout: 'carousel', photoSize: 'lg', categoryMode: 'tabs', showFeatured: false },
  galeria: { layout: 'list', photoSize: 'lg', categoryMode: 'tabs', showFeatured: true },
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
