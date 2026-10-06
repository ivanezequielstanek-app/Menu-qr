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


function cup(bg, coffee = '#8a5a3b', art = '#f3e3cc', saucer = '#ffffff') {
  return svg(`<circle cx="206" cy="212" r="150" fill="rgba(0,0,0,.12)"/><circle cx="200" cy="200" r="150" fill="${saucer}"/>
  <circle cx="200" cy="200" r="118" fill="none" stroke="rgba(0,0,0,.06)" stroke-width="3"/>
  <rect x="300" y="186" width="60" height="28" rx="14" fill="${saucer}" stroke="rgba(0,0,0,.08)" stroke-width="2"/>
  <circle cx="200" cy="200" r="104" fill="${saucer}" stroke="rgba(0,0,0,.08)" stroke-width="3"/>
  <circle cx="200" cy="200" r="88" fill="${coffee}"/>
  <path d="M200 236c-30-20-48-36-48-56a22 22 0 0 1 48-8 22 22 0 0 1 48 8c0 20-18 36-48 56z" fill="${art}"/>`, bg)
}
function rolls(bg, fill = ['#f28c6b', '#7ac27a', '#f5d36b']) {
  let r = ''
  ;[[130, 200], [200, 200], [270, 200]].forEach(([x, y], i) => {
    r += `<circle cx="${x}" cy="${y + 6}" r="38" fill="rgba(0,0,0,.25)"/><circle cx="${x}" cy="${y}" r="38" fill="#1d2a22"/>
    <circle cx="${x}" cy="${y}" r="32" fill="#fbf8f1"/><circle cx="${x}" cy="${y}" r="15" fill="${fill[i % fill.length]}"/>
    <circle cx="${x - 5}" cy="${y - 4}" r="6" fill="${fill[(i + 1) % fill.length]}"/>`
  })
  return svg(`<rect x="50" y="130" width="300" height="140" rx="10" fill="#2a2a2a"/>${r}`, bg)
}
function nigiri(bg, fish = '#f28c6b') {
  return svg(`<rect x="60" y="150" width="280" height="110" rx="10" fill="#2a2a2a"/>
  ${[120, 230].map((x) => `<ellipse cx="${x + 25}" cy="216" rx="56" ry="26" fill="#fbf8f1"/><path d="M${x - 34} 206q59-46 118 0q-59 22-118 0z" fill="${fish}"/><path d="M${x - 10} 196l18 8M${x + 20} 190l18 8M${x + 50} 194l14 8" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-linecap="round"/>`).join('')}`, bg)
}
function tumbler(bg, liquid, fruit = '#ffffff') {
  return svg(`<ellipse cx="200" cy="336" rx="80" ry="10" fill="rgba(0,0,0,.15)"/>
  <rect x="236" y="56" width="10" height="150" rx="5" fill="#ff7aa2" transform="rotate(12 241 130)"/>
  <path d="M138 100h124l-12 236H150z" fill="rgba(255,255,255,.55)" stroke="rgba(0,0,0,.08)" stroke-width="3"/>
  <path d="M144 140h112l-10 190H154z" fill="${liquid}"/>
  <circle cx="160" cy="124" r="30" fill="${fruit}"/><circle cx="160" cy="124" r="22" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3"/>`, bg)
}

function build(restaurant, cats) {
  const categories = cats.map((c, i) => ({ id: `c${i}`, name: c.name, position: i, visible: true }))
  const products = cats.flatMap((c, ci) => c.items.map((it, ii) => ({
    id: `p${ci}-${ii}`, category_id: `c${ci}`, position: ii,
    name: it[0], description: it[1], price: it[2], image_url: it[3], available: it[4] !== false, featured: it[5] === true,
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
        ['Merluza negra', 'Puré de coliflor ahumada y manteca de avellanas', 28900, P(4, ['#f3ead8', '#d7c49e', '#7f9c5a']), true, true],
        ['Ojo de bife madurado', '30 días de maduración, papas confitadas y chimichurri de hierbas', 31500, P(5, ['#6e2e1f', '#9c4a2c', '#e8c27a', '#4f7a2e']), true, true],
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
        ['Bacon Bomb', 'Triple carne, bacon crocante y cebolla caramelizada', 12900, burger('#ffd27a'), true, true],
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
        ['Niebla', 'Pisco, maracuyá, clara y bitter de lavanda', 9200, glass('#30263f', '#f2c94c', '#b49be0'), true, true],
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
        ['Mollejas al limón', 'Crocantes por fuera, tiernas por dentro', 11800, P(23, ['#d9a35a', '#f2d48a', '#4f7a2e']), true, true],
      ] },
      { name: 'Cortes', items: [
        ['Vacío', '400 g, jugoso por dentro', 17500, P(24, ['#7a2c1a', '#a8442a', '#4f7a2e', '#e9c27c']), true, true],
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
  cafe: () => {
    const bg = '#dfe8d9', P = (s, c) => plate(s, '#f4ddd3', c)
    return build({ name: 'Lumbre Café', tagline: 'Café de especialidad y brunch todo el día', whatsapp: '5491100000000' }, [
      { name: 'Café', items: [
        ['Flat white', 'Doble ristretto y leche texturizada', 4200, cup(bg), true, true],
        ['Latte de avellanas', 'Con jarabe casero de avellanas tostadas', 4800, cup('#f4ddd3', '#a5714b')],
        ['Espresso', 'Blend de Brasil y Colombia', 2900, cup(bg, '#3d2216', '#a5714b')],
        ['Cold brew', 'Infusionado 18 horas, con tónica opcional', 4500, tumbler(bg, '#5a3622', '#f2c94c')],
      ] },
      { name: 'Brunch', items: [
        ['Tostón de palta', 'Pan de masa madre, palta, huevo poché y semillas', 9800, P(31, ['#8bbf5a', '#f5d36b', '#c9a066', '#ffffff']), true, true],
        ['Huevos benedictinos', 'Jamón natural, salsa holandesa y papas rústicas', 11200, P(32, ['#f5d36b', '#f2b45a', '#e8c27a'])],
        ['Pancakes con frutos rojos', 'Miel de maple, crema y frutos del bosque', 9400, P(33, ['#d9a35a', '#c2264b', '#6b2a8a', '#f3e3cc'])],
      ] },
      { name: 'Pastelería', items: [
        ['Medialunas de manteca', 'Tres unidades, recién horneadas', 3600, P(34, ['#e3a14c', '#d48a35', '#f2c27a'])],
        ['Budín de limón', 'Con glasé de limón y amapolas', 3900, P(35, ['#f2d48a', '#f7e7b0', '#8bbf5a'])],
        ['Cheesecake de frutos rojos', 'Base de galletas y coulis casero', 6200, P(36, ['#f7efe0', '#c2264b', '#d9a35a'])],
      ] },
    ])
  },
  zen: () => {
    const bg = '#ece7dc'
    return build({ name: 'Kaito', tagline: 'Sushi y cocina nikkei', whatsapp: '5491100000000' }, [
      { name: 'Rolls', items: [
        ['Philadelphia roll', 'Salmón, queso crema y palta · 8 piezas', 12800, rolls(bg), true, true],
        ['Spicy tuna', 'Atún rojo, mayo picante y cebolla de verdeo · 8 piezas', 14200, rolls(bg, ['#c8321f', '#f5d36b', '#7ac27a'])],
        ['Acevichado', 'Langostino furai, salmón flameado y salsa acevichada · 8 piezas', 15600, rolls(bg, ['#f5a46b', '#c8321f', '#f5d36b']), true, true],
        ['Tempura roll', 'Rebozado en panko, salmón y queso · 8 piezas', 13400, rolls(bg, ['#e9b872', '#f28c6b', '#ffffff'])],
      ] },
      { name: 'Nigiri y sashimi', items: [
        ['Nigiri de salmón', '2 piezas', 6400, nigiri(bg)],
        ['Nigiri de pesca blanca', '2 piezas, con ralladura de lima', 6200, nigiri(bg, '#f4ede4')],
        ['Sashimi de salmón', '6 cortes', 11800, nigiri('#e2ddd1', '#f5845c')],
      ] },
      { name: 'Calientes', items: [
        ['Gyozas de cerdo', 'Cinco unidades, salsa ponzu', 8900, plate(41, bg, ['#f2e3c4', '#d9a35a', '#4f7a2e'])],
        ['Ramen tonkotsu', 'Caldo de cerdo, chashu, huevo marinado y nori', 16400, plate(42, bg, ['#e8c27a', '#f5d36b', '#3b2a20', '#4f7a2e'])],
        ['Yakitori', 'Brochetas de pollo glaseadas con tare', 9200, plate(43, bg, ['#9c4a2c', '#c26a35', '#4f7a2e'])],
      ] },
    ])
  },
  fresco: () => {
    const bg = '#e4f0dd', P = (s, c) => plate(s, bg, c)
    return build({ name: 'Verde Raíz', tagline: 'Bowls, jugos y comida real', whatsapp: '5491100000000' }, [
      { name: 'Bowls', items: [
        ['Poke de salmón', 'Arroz de sushi, salmón, palta, edamame y mango', 13900, P(51, ['#f28c6b', '#8bbf5a', '#f5d36b', '#ffffff']), true, true],
        ['Bowl de quinoa', 'Quinoa, garbanzos crocantes, hummus y vegetales asados', 11200, P(52, ['#e8c27a', '#c2264b', '#5fa83a', '#f5d36b'])],
        ['Buddha bowl', 'Batata, kale, tofu marinado y salsa de maní', 11800, P(53, ['#f2a03d', '#3f8f3a', '#f3e3cc', '#7a3e12'])],
        ['Bowl mediterráneo', 'Falafel, tabulé, pepino, tomate y tzatziki', 11500, P(54, ['#a0703a', '#8bbf5a', '#d8432c', '#ffffff'])],
      ] },
      { name: 'Ensaladas', items: [
        ['César con pollo grillado', 'Hojas verdes, parmesano, croutones y aderezo césar', 10900, P(55, ['#7ac27a', '#f3e3cc', '#e2b06a'])],
        ['Caprese', 'Tomates, mozzarella fresca, albahaca y oliva', 9800, P(56, ['#d8432c', '#ffffff', '#3f8f3a'])],
      ] },
      { name: 'Jugos', items: [
        ['Verde detox', 'Manzana verde, espinaca, pepino y jengibre', 5200, tumbler(bg, '#7ac27a', '#b8e07a')],
        ['Naranja y zanahoria', 'Exprimido en el momento', 4800, tumbler('#fbe9cf', '#f2973d', '#f7c25a')],
        ['Frutos rojos', 'Frutilla, arándanos, banana y yogur', 5600, tumbler('#f6dde4', '#c2264b', '#f28cb0')],
      ] },
    ])
  },
  galeria: () => {
    const bg = '#e8e8e4', P = (s, c) => plate(s, bg, c)
    return build({ name: 'Estudio Norte', tagline: 'Cocina de autor. El menú cambia con cada estación.', whatsapp: '5491100000000' }, [
      { name: 'Para empezar', items: [
        ['Crudo de pesca blanca', 'Leche de tigre de ají amarillo, choclo y cilantro', 13800, P(61, ['#f4ede4', '#f5d36b', '#5fa83a', '#c8321f']), true, true],
        ['Remolacha asada', 'Labneh, avellanas tostadas y aceite de eneldo', 10400, P(62, ['#8a1c3b', '#b4385e', '#f3e3cc', '#5fa83a'])],
        ['Pan de masa madre', 'Manteca ahumada y sal de escamas', 5200, P(63, ['#c58b4a', '#e2b06a', '#f7efe0'])],
      ] },
      { name: 'Principales', items: [
        ['Cordero braseado', '12 horas de cocción, puré de apio y jugo de cocción', 29800, P(64, ['#5c2a1c', '#8a4a2c', '#f3e3cc', '#4f7a2e']), true, true],
        ['Ñoquis de calabaza', 'Manteca de salvia y parmesano', 18600, P(65, ['#f2a03d', '#f5c46b', '#4f7a2e'])],
        ['Pesca del día', 'Hinojo asado, cítricos y beurre blanc', 26400, P(66, ['#f4ede4', '#e9d9b8', '#7fa05a', '#f5d36b'])],
      ] },
      { name: 'Postres', items: [
        ['Helado de leche quemada', 'Crumble de cacao y sal', 8200, P(67, ['#e2b06a', '#3b2016', '#f3e3cc'])],
        ['Tarta de peras', 'Masa quebrada de almendras y crema de vainilla', 8900, P(68, ['#e9c27c', '#c58b4a', '#f7efe0'])],
      ] },
    ])
  },
}

const cache = {}
export function getSample(theme) {
  if (!cache[theme]) cache[theme] = (SAMPLES[theme] || SAMPLES.elegante)()
  return cache[theme]
}
