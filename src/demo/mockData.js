// Datos de ejemplo. Las "fotos" son ilustraciones SVG generadas, para que la
// demo funcione sin imágenes externas. En producción se usan fotos reales.

function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647) }
const svg = (body, bg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/>${body}</svg>`)

function plate(seed, bg, colors) {
  const r = rng(seed * 97 + 13)
  let blobs = ''
  for (let i = 0; i < 5; i++) {
    const cx = 200 + (r() - 0.5) * 110, cy = 200 + (r() - 0.5) * 110
    blobs += `<ellipse cx="${cx}" cy="${cy}" rx="${30 + r() * 46}" ry="${20 + r() * 34}" transform="rotate(${r() * 180} ${cx} ${cy})" fill="${colors[i % colors.length]}"/>`
  }
  for (let i = 0; i < 9; i++) blobs += `<circle cx="${130 + r() * 140}" cy="${130 + r() * 140}" r="${3 + r() * 5}" fill="${colors[(i + 2) % colors.length]}" opacity=".9"/>`
  return svg(`<circle cx="206" cy="212" r="160" fill="rgba(0,0,0,.18)"/><circle cx="200" cy="200" r="160" fill="#fbfaf7"/><circle cx="200" cy="200" r="124" fill="none" stroke="rgba(0,0,0,.06)" stroke-width="3"/>${blobs}`, bg)
}
function burger(bg) {
  return svg(`<ellipse cx="200" cy="330" rx="150" ry="18" fill="rgba(0,0,0,.18)"/>
  <path d="M70 270h260a18 18 0 0 1-18 40H88a18 18 0 0 1-18-40z" fill="#d99a45"/>
  <rect x="62" y="236" width="276" height="40" rx="20" fill="#5b2f1d"/>
  <path d="M60 228h280l-24 22-26-14-28 16-30-16-30 16-30-16-28 16-26-14-28 16z" fill="#f4c22c"/>
  <path d="M56 214c30-14 50 10 80 0s50 10 80 0 50 10 80 0 30 6 48 0v12H56z" fill="#5fa83a"/>
  <path d="M64 206c0-80 60-118 136-118s136 38 136 118z" fill="#e3a14c"/>
  <g fill="#fff3d6"><ellipse cx="150" cy="140" rx="7" ry="4"/><ellipse cx="200" cy="120" rx="7" ry="4"/><ellipse cx="250" cy="142" rx="7" ry="4"/><ellipse cx="180" cy="165" rx="7" ry="4"/><ellipse cx="230" cy="168" rx="7" ry="4"/></g>`, bg)
}
function glass(bg, liquid, garnish = '#f2c94c') {
  return svg(`<ellipse cx="200" cy="338" rx="80" ry="10" fill="rgba(0,0,0,.25)"/>
  <path d="M100 110h200l-86 110v104h50v14H136v-14h50V220z" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.55)" stroke-width="3"/>
  <path d="M124 138h152l-76 80z" fill="${liquid}"/>
  <circle cx="268" cy="114" r="26" fill="${garnish}"/><circle cx="268" cy="114" r="18" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="3"/>`, bg)
}
function pint(bg, beer) {
  return svg(`<ellipse cx="200" cy="336" rx="80" ry="10" fill="rgba(0,0,0,.25)"/>
  <path d="M130 90h140l-14 240H144z" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.5)" stroke-width="3"/>
  <path d="M136 130h128l-11 196H147z" fill="${beer}"/>
  <path d="M132 92h136v38c-20 10-40-6-68 4s-48-6-68 4z" fill="#fff8e7"/>`, bg)
}
function fries(bg) {
  let sticks = ''
  const r = rng(7)
  for (let i = 0; i < 11; i++) { const x = 130 + i * 13; sticks += `<rect x="${x}" y="${92 + r() * 40}" width="14" height="150" rx="4" fill="#f5c84b" transform="rotate(${(r() - 0.5) * 18} ${x} 200)"/>` }
  return svg(`<ellipse cx="200" cy="340" rx="110" ry="12" fill="rgba(0,0,0,.2)"/>${sticks}<path d="M112 190h176l-22 146H134z" fill="#e63b1f"/><path d="M112 190h176l-4 26H116z" fill="#c22f17"/>`, bg)
}

function build(restaurant, cats) {
  const categories = cats.map((c, i) => ({ id: `c${i}`, name: c.name, position: i, visible: true }))
  const products = cats.flatMap((c, ci) => c.items.map((it, ii) => ({
    id: `p${ci}-${ii}`, category_id: `c${ci}`, position: ii,
    name: it[0], description: it[1], price: it[2], image_url: it[3], available: it[4] !== false,
  })))
  return { restaurant, categories, products }
}

const SAMPLES = {
  elegante: () => {
    const bg = '#1c2731', P = (s, c) => plate(s, bg, c)
    return build({ name: 'Casa Albéniz', tagline: 'Cocina de estación en Palermo', whatsapp: '5491100000000' }, [
      { name: 'Entradas', items: [
        ['Burrata con tomates reliquia', 'Pesto de albahaca morada, aceite de oliva y pan de masa madre', 12800, P(1, ['#e9e4d6', '#d8432c', '#f2a03d', '#4f7a2e'])],
        ['Langostinos al ajillo', 'Ajo confitado, guindilla y perejil fresco', 15900, P(2, ['#f08a5d', '#e9b872', '#4f7a2e'])],
        ['Tartar de trucha', 'Palta, pepino encurtido y crocante de alcaparras', 14200, P(3, ['#f19a7a', '#8bb174', '#e7d6a6'])],
      ] },
      { name: 'Principales', items: [
        ['Merluza negra', 'Puré de coliflor ahumada y manteca de avellanas', 28900, P(4, ['#f3ead8', '#d7c49e', '#7f9c5a'])],
        ['Ojo de bife madurado', '30 días de maduración, papas confitadas y chimichurri de hierbas', 31500, P(5, ['#6e2e1f', '#9c4a2c', '#e8c27a', '#4f7a2e'])],
        ['Risotto de hongos de pino', 'Parmesano de 24 meses y aceite de trufa', 22400, P(6, ['#e6d3a8', '#8a6a44', '#d9c7a0'])],
      ] },
      { name: 'Postres', items: [
        ['Flan de dulce de leche', 'Crema batida sin azúcar', 8200, P(7, ['#d9902e', '#f5e2b8', '#7a3e12'])],
        ['Chocolate amargo', 'Helado de café y sal en escamas', 9400, P(8, ['#3b2016', '#5c3324', '#e8d9c4'])],
      ] },
    ])
  },
  burger: () => {
    const bg = '#ffe08a'
    return build({ name: 'La Mordida', tagline: 'Smash burgers a la plancha. Sin vueltas.', whatsapp: '5491100000000' }, [
      { name: 'Burgers', items: [
        ['Clásica', 'Doble carne, cheddar, pepinos y salsa de la casa', 9800, burger(bg)],
        ['Bacon Bomb', 'Triple carne, bacon crocante y cebolla caramelizada', 12900, burger('#ffd27a')],
        ['La Picante', 'Jalapeños, pepper jack y mayo de chipotle', 11500, burger('#ffc9a8')],
        ['Veggie', 'Medallón de garbanzos, cheddar y lechuga', 9900, burger('#d9f0b8'), false],
      ] },
      { name: 'Para picar', items: [
        ['Papas con cheddar', 'Con verdeo y bacon', 6500, fries(bg)],
        ['Papas rústicas', 'Con piel, romero y alioli', 5900, fries('#ffd27a')],
      ] },
      { name: 'Bebidas', items: [
        ['Limonada de la casa', 'Menta y jengibre, 500 ml', 3200, glass('#d9f0b8', '#f6e27a')],
        ['Cerveza tirada', 'Pinta de rubia', 4800, pint('#ffd27a', '#f0a92e')],
      ] },
    ])
  },
  bar: () => {
    const bg = '#2a2138'
    return build({ name: 'Bar Niebla', tagline: 'Cócteles de autor y vinilos hasta tarde', whatsapp: '5491100000000' }, [
      { name: 'Cócteles', items: [
        ['Negroni', 'Gin, vermut rosso y Campari', 8500, glass(bg, '#c2241a', '#f28c28')],
        ['Niebla', 'Pisco, maracuyá, clara y bitter de lavanda', 9200, glass('#30263f', '#f2c94c', '#b49be0')],
        ['Old Fashioned', 'Bourbon, azúcar mascabo y piel de naranja', 9800, glass('#2c2233', '#b8652a', '#f28c28')],
        ['Gin tonic de pomelo', 'Pomelo rosado, romero y pimienta rosa', 8200, glass('#2e2440', '#f4a6a0', '#e05a6b')],
      ] },
      { name: 'Cervezas', items: [
        ['IPA tirada', 'Pinta, 6,5 % — lupulada y cítrica', 5200, pint(bg, '#e89a2c')],
        ['Stout tirada', 'Pinta, notas de café y cacao', 5200, pint('#30263f', '#2b140c')],
      ] },
      { name: 'Para compartir', items: [
        ['Tabla de quesos', 'Cuatro quesos, frutos secos y miel', 13500, plate(11, bg, ['#f2d27a', '#e8b04a', '#fff1c7', '#8a5a2b'])],
        ['Tacos de cerdo', 'Tres unidades, salsa verde y cebolla morada', 9600, plate(12, '#30263f', ['#e8c27a', '#7a3a1e', '#4f9a3a', '#b03a6b'])],
      ] },
    ])
  },
  parrilla: () => {
    const bg = '#f6ece4', P = (s, c) => plate(s, bg, c)
    return build({ name: 'Don Ramón', tagline: 'Parrilla a leña desde 1987', whatsapp: '5491100000000' }, [
      { name: 'Achuras', items: [
        ['Chorizo', 'Casero, con pan de campo', 3800, P(21, ['#8e2b1c', '#b5452c', '#e9c27c'])],
        ['Morcilla', 'Dulce o salada', 3500, P(22, ['#2f1410', '#4a1f17', '#e9c27c'])],
        ['Mollejas al limón', 'Crocantes por fuera, tiernas por dentro', 11800, P(23, ['#d9a35a', '#f2d48a', '#4f7a2e'])],
      ] },
      { name: 'Cortes', items: [
        ['Vacío', '400 g, jugoso por dentro', 17500, P(24, ['#7a2c1a', '#a8442a', '#4f7a2e', '#e9c27c'])],
        ['Asado de tira', '500 g, a la leña', 16200, P(25, ['#6e2617', '#9c3c24', '#e2b06a'])],
        ['Bife de chorizo', '450 g, con guarnición a elección', 19800, P(26, ['#6a2414', '#a0452a', '#4f7a2e'])],
      ] },
      { name: 'Guarniciones', items: [
        ['Papas fritas', 'Porción grande', 5200, P(27, ['#f2c14e', '#f6d47a', '#e6a93a'])],
        ['Ensalada mixta', 'Lechuga, tomate y cebolla', 4300, P(28, ['#5fa83a', '#d8432c', '#f3f0e6', '#88c057'])],
        ['Provoleta', 'Con orégano y aceite de oliva', 7400, P(29, ['#f2c96b', '#e19a3a', '#4f7a2e'])],
      ] },
    ])
  },
}

const cache = {}
export function getSample(theme) {
  if (!cache[theme]) cache[theme] = (SAMPLES[theme] || SAMPLES.elegante)()
  return cache[theme]
}
