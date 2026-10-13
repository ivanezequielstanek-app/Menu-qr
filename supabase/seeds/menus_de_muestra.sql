-- =====================================================================
--  MENÚS DE MUESTRA · 8 locales, uno por diseño
--  Pegar completo en: Supabase > SQL Editor > New query > Run
--
--  IMPORTANTE: antes ejecutá migrations/003_sabores.sql, 004_descripcion_sabores.sql y 005_promos_combinadas.sql
--  (la heladería usa sabores con descripción).
--
--  Crea (o vuelve a crear) estos menús:
--    /don-ramon      Brasa     (parrilla)
--    /casa-albeniz   Elegante  (restaurante de autor)
--    /la-mordida     Urbano    (hamburguesería)
--    /bar-niebla     Nocturno  (bar y coctelería)
--    /lumbre-cafe    Café      (cafetería y brunch)
--    /kaito          Zen       (sushi y nikkei)
--    /verde-raiz     Fresco    (comida saludable)
--    /estudio-norte  Galería   (bistró de autor)
--    /heladeria-polar Café     (heladería, con elección de sabores)
--
--  Se puede ejecutar las veces que quieras: si el local ya existe,
--  lo borra (con su menú y sus pedidos) y lo carga de nuevo.
--  Los productos quedan sin foto: se agregan desde el panel.
--  Cada producto es: ["Nombre", "Descripción", precio, recomendado, disponible, sabores (opcional)]
--  sabores = {"parts":[{"label":"Kilo","min":1,"max":4},{"label":"1/4 de regalo","min":1,"max":3}]}
--            (o, para potes iguales, {"units":3,"min":1,"max":2,"label":"Pote de 1/4"})
-- =====================================================================

create or replace function pg_temp.cargar_menu(
  p_slug text, p_name text, p_tagline text, p_theme text, p_options jsonb, p_menu jsonb, p_sabores jsonb default null
) returns void language plpgsql as $$
declare
  rid uuid; cid uuid; cat jsonb; it jsonb; ci int := 0; pi int; g jsonb; fl jsonb; fname text; fdesc text; fi int := 0;
begin
  delete from restaurants where slug = p_slug;

  insert into restaurants (slug, name, tagline, whatsapp)
  values (p_slug, p_name, p_tagline, '5491100000000')
  returning id into rid;

  insert into restaurant_design (restaurant_id, theme, options)
  values (rid, p_theme, p_options);

  for cat in select value from jsonb_array_elements(p_menu) loop
    insert into categories (restaurant_id, name, position)
    values (rid, cat->>'categoria', ci) returning id into cid;
    pi := 0;
    for it in select value from jsonb_array_elements(cat->'productos') loop
      insert into products (restaurant_id, category_id, name, description, price, featured, available, position, choice)
      values (rid, cid, it->>0, it->>1, (it->>2)::numeric,
              coalesce((it->>3)::boolean, false), coalesce((it->>4)::boolean, true), pi,
              case when jsonb_typeof(it->5) = 'object' then it->5 end);
      pi := pi + 1;
    end loop;
    ci := ci + 1;
  end loop;

  -- Sabores: [{"grupo":"Cremas","sabores":["Vainilla","Pistacho*",["Chocotorta","Descripción"]]}]
  -- (* al final del nombre = agotado · ["Nombre","Descripción"] = sabor con descripción)
  if p_sabores is not null then
    for g in select value from jsonb_array_elements(p_sabores) loop
      for fl in select value from jsonb_array_elements(g->'sabores') loop
        if jsonb_typeof(fl) = 'array' then fname := fl->>0; fdesc := fl->>1;
        else fname := fl #>> '{}'; fdesc := null; end if;
        insert into flavors (restaurant_id, name, grp, available, position, description)
        values (rid, rtrim(fname, '*'), g->>'grupo', right(fname, 1) <> '*', fi, fdesc);
        fi := fi + 1;
      end loop;
    end loop;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 1. BRASA · Parrilla
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('don-ramon', 'Don Ramón', 'Parrilla a leña desde 1987', 'parrilla',
'{"layout":"list","photoSize":"md","categoryMode":"tabs","showFeatured":true,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":true,"pickup":true,"delivery":false}}',
'[
 {"categoria":"Entradas","productos":[
   ["Provoleta clásica","Con orégano, ají molido y aceite de oliva",9800,false,true],
   ["Empanada de carne cortada a cuchillo","Frita o al horno. Precio por unidad",2900,false,true],
   ["Matambre a la pizza","Matambre tiernizado con salsa de tomate, muzzarella y orégano",14500,false,true],
   ["Provoleta con tomates asados","Tomates confitados, albahaca y pimienta negra",11200,false,true]]},
 {"categoria":"Achuras","productos":[
   ["Chorizo","Casero, de cerdo y vaca",4500,false,true],
   ["Morcilla","Dulce o salada",4200,false,true],
   ["Chinchulines","Bien crocantes, con limón",8900,false,true],
   ["Mollejas al limón","Doradas por fuera, tiernas por dentro",16800,true,true],
   ["Riñones al verdeo","Salteados con cebolla de verdeo y vino blanco",9500,false,true]]},
 {"categoria":"Cortes","productos":[
   ["Bife de chorizo","400 g. Jugoso, con sal gruesa",24500,true,true],
   ["Ojo de bife","400 g. El corte más tierno de la casa",26900,false,true],
   ["Vacío","Tierno y jugoso, con su grasita crocante",21800,false,true],
   ["Entraña","La favorita de los habitués",25500,false,true],
   ["Asado de tira","Tira ancha, cocción lenta a la leña",19800,false,true]]},
 {"categoria":"Para compartir","productos":[
   ["Parrillada para 2","Asado, vacío, chorizo, morcilla, chinchulines y mollejas",52000,true,true],
   ["Parrillada para 4","La parrillada completa con doble porción de cortes",98000,false,true]]},
 {"categoria":"Guarniciones","productos":[
   ["Papas fritas","Cortadas a mano",6500,false,true],
   ["Papas a la provenzal","Con ajo y perejil",7200,false,true],
   ["Puré de papas","Con manteca y nuez moscada",5500,false,true],
   ["Ensalada mixta","Lechuga, tomate y cebolla",5800,false,true],
   ["Calabaza asada","Al rescoldo, con queso fundido",5900,false,true]]},
 {"categoria":"Postres","productos":[
   ["Flan casero","Con dulce de leche y crema",6200,false,true],
   ["Panqueque con dulce de leche","Flambeado al ron",6500,false,true],
   ["Queso y dulce","Queso fresco con dulce de batata o membrillo",5900,false,true],
   ["Helado","Dos bochas a elección",5500,false,true]]},
 {"categoria":"Bebidas","productos":[
   ["Agua mineral","500 ml, con o sin gas",2500,false,true],
   ["Gaseosa","500 ml",3200,false,true],
   ["Cerveza tirada","Pinta",5200,false,true],
   ["Malbec de la casa","Botella 750 ml",18000,false,true]]}
]');


-- ---------------------------------------------------------------------
-- 2. ELEGANTE · Restaurante de autor
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('casa-albeniz', 'Casa Albéniz', 'Cocina de estación en Palermo', 'elegante',
'{"layout":"list","photoSize":"sm","categoryMode":"tabs","showFeatured":true,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":true,"pickup":false,"delivery":false}}',
'[
 {"categoria":"Para empezar","productos":[
   ["Pan de masa madre","Manteca de hierbas y sal de escamas",4800,false,true],
   ["Ostras frescas","Media docena, mignonette de chalota y limón",21000,false,true],
   ["Croquetas de jamón crudo","Cuatro unidades, alioli suave",8900,false,true],
   ["Aceitunas marinadas","Cítricos, hinojo y oliva virgen",4200,false,true]]},
 {"categoria":"Entradas","productos":[
   ["Burrata con tomates reliquia","Pesto de albahaca morada y pan tostado",14800,true,true],
   ["Tartar de trucha","Palta, pepino encurtido y crocante de alcaparras",15600,false,true],
   ["Langostinos al ajillo","Ajo confitado, guindilla y perejil",17900,false,true],
   ["Carpaccio de lomo","Rúcula, parmesano y alcaparras",13900,false,true],
   ["Crema de calabaza asada","Semillas tostadas y aceite de salvia",9800,false,true]]},
 {"categoria":"Principales","productos":[
   ["Merluza negra","Puré de coliflor ahumada y manteca de avellanas",32900,true,true],
   ["Ojo de bife madurado","30 días de maduración, papas confitadas y chimichurri",34500,true,true],
   ["Pato confitado","Puré de batata y reducción de frutos rojos",31200,false,true],
   ["Cordero patagónico","Cocción lenta, cous cous y menta",33800,false,false],
   ["Pesca del día","Según disponibilidad. Consultar al personal",28800,false,true]]},
 {"categoria":"Pastas y arroces","productos":[
   ["Risotto de hongos de pino","Parmesano de 24 meses y aceite de trufa",24800,false,true],
   ["Sorrentinos de cordero","Jugo de cocción y romero",22600,false,true],
   ["Tagliatelle al nero","Langostinos, tomates cherry y lima",26900,false,true]]},
 {"categoria":"Postres","productos":[
   ["Volcán de chocolate","Helado de crema americana",9800,false,true],
   ["Flan de dulce de leche","Crema batida sin azúcar",8400,false,true],
   ["Crème brûlée","Vainilla de Madagascar",8900,false,true],
   ["Tabla de quesos","Selección de quesos argentinos, frutos secos y miel",14500,false,true]]},
 {"categoria":"Vinos por copa","productos":[
   ["Malbec Reserva","Valle de Uco, Mendoza",9500,false,true],
   ["Cabernet Franc","Gualtallary, Mendoza",10200,false,true],
   ["Chardonnay","Tupungato, Mendoza",8800,false,true],
   ["Rosé de Pinot Noir","Patagonia",8600,false,true],
   ["Espumante Nature","Método tradicional",9900,false,true]]}
]');


-- ---------------------------------------------------------------------
-- 3. URBANO · Hamburguesería
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('la-mordida', 'La Mordida', 'Smash burgers a la plancha. Sin vueltas.', 'burger',
'{"layout":"grid","photoSize":"lg","categoryMode":"tabs","showFeatured":true,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":true,"pickup":true,"delivery":true}}',
'[
 {"categoria":"Burgers","productos":[
   ["Clásica","Doble smash, cheddar, cebolla, pepinos y salsa de la casa",11900,true,true],
   ["Bacon","Doble carne, doble cheddar y panceta crocante",13800,true,true],
   ["Triple Mordida","Triple carne, triple cheddar y cebolla caramelizada",16500,false,true],
   ["Blue","Roquefort, cebolla caramelizada y rúcula",14200,false,true],
   ["Veggie","Medallón de garbanzos y quinoa, lechuga, tomate y alioli",12500,false,true]]},
 {"categoria":"Combos","productos":[
   ["Combo Clásica","Clásica, papas fritas y gaseosa",16900,true,true],
   ["Combo Bacon","Bacon, papas fritas y gaseosa",18900,false,true],
   ["Combo para 2","Dos Clásicas, papas grandes y dos gaseosas",32000,false,true]]},
 {"categoria":"Papas","productos":[
   ["Papas fritas","Porción individual",5500,false,true],
   ["Papas cheddar y panceta","Con salsa cheddar y panceta crocante",8200,false,true],
   ["Papas rústicas","Con cáscara, romero y alioli",6900,false,true],
   ["Aros de cebolla","Rebozados en cerveza",6500,false,true]]},
 {"categoria":"Para picar","productos":[
   ["Nuggets","Ocho unidades, con barbacoa",7500,false,true],
   ["Bastones de muzzarella","Seis unidades, con salsa de tomate",7900,false,true],
   ["Alitas BBQ","Seis unidades, picantes o suaves",8900,false,false]]},
 {"categoria":"Bebidas","productos":[
   ["Gaseosa","Lata 354 ml",3000,false,true],
   ["Agua mineral","500 ml",2500,false,true],
   ["Cerveza","Lata 473 ml",4200,false,true],
   ["Limonada de la casa","Con menta y jengibre",4500,false,true]]},
 {"categoria":"Postres","productos":[
   ["Brownie con helado","Brownie tibio y bocha de americana",6500,false,true],
   ["Milkshake","Vainilla, chocolate o frutilla",7200,false,true]]}
]');


-- ---------------------------------------------------------------------
-- 4. NOCTURNO · Bar y coctelería
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('bar-niebla', 'Bar Niebla', 'Cócteles de autor y vinilos hasta tarde', 'bar',
'{"layout":"list","photoSize":"md","categoryMode":"accordion","showFeatured":true,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":true,"pickup":false,"delivery":false}}',
'[
 {"categoria":"Cócteles de autor","productos":[
   ["Niebla","Gin, pomelo rosado, romero y tónica de la casa",9500,true,true],
   ["Humo negro","Mezcal, café frío, cacao y piel de naranja",10500,false,true],
   ["Jardín","Vodka, pepino, albahaca y lima",9200,false,true],
   ["Ámbar","Bourbon, miel de caña, jengibre y limón",9800,false,true],
   ["Tropical sour","Ron, maracuyá, clara de huevo y canela",9600,false,true]]},
 {"categoria":"Clásicos","productos":[
   ["Negroni","Gin, vermut rosso y Campari",8900,false,true],
   ["Old Fashioned","Bourbon, azúcar, amargo de angostura y naranja",9200,false,true],
   ["Aperol Spritz","Aperol, espumante y soda",8500,true,true],
   ["Mojito","Ron blanco, lima, menta y soda",8200,false,true],
   ["Fernet con cola","El de siempre",6800,false,true]]},
 {"categoria":"Cervezas tiradas","productos":[
   ["IPA","Pinta. Amarga y aromática",5800,false,true],
   ["Honey","Pinta. Suave, con miel",5200,false,true],
   ["Stout","Pinta. Tostada, notas de café",5600,false,true],
   ["Lager","Pinta. Liviana y refrescante",4900,false,true]]},
 {"categoria":"Vinos y espumantes","productos":[
   ["Malbec","Copa",6200,false,true],
   ["Torrontés","Copa",5800,false,true],
   ["Espumante Extra Brut","Botella 750 ml",26000,false,true]]},
 {"categoria":"Sin alcohol","productos":[
   ["Limonada de jengibre","Con menta fresca",4800,false,true],
   ["Virgin mojito","Lima, menta y soda",5200,false,true],
   ["Tónica de la casa","Con pomelo y romero",3800,false,true]]},
 {"categoria":"Para picar","productos":[
   ["Tabla de fiambres y quesos","Para dos. Con panes y aceitunas",18500,true,true],
   ["Papas bravas","Salsa picante y alioli",7200,false,true],
   ["Nachos","Cheddar, guacamole y pico de gallo",9800,false,true],
   ["Croquetas de jamón","Seis unidades",8400,false,true],
   ["Bruschettas","Tomate, albahaca y burrata",7600,false,true]]}
]');


-- ---------------------------------------------------------------------
-- 5. CAFÉ · Cafetería y brunch
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('lumbre-cafe', 'Lumbre Café', 'Café de especialidad y brunch todo el día', 'cafe',
'{"layout":"grid","photoSize":"md","categoryMode":"tabs","showFeatured":true,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":true,"pickup":true,"delivery":false}}',
'[
 {"categoria":"Cafés","productos":[
   ["Espresso","Blend de la casa, tueste medio",2800,false,true],
   ["Cortado","Espresso con un toque de leche",3200,false,true],
   ["Flat white","Doble espresso y leche texturizada",4200,true,true],
   ["Capuccino","Con cacao o canela",4300,false,true],
   ["Cold brew","Infusión en frío de 18 horas",4800,false,true]]},
 {"categoria":"Otras bebidas","productos":[
   ["Té en hebras","Negro, verde o de hierbas",3500,false,true],
   ["Chai latte","Especiado, con leche a elección",4800,false,true],
   ["Chocolate caliente","Con chocolate semiamargo",4900,false,true],
   ["Jugo de naranja","Exprimido en el momento",4200,false,true],
   ["Limonada","Con menta y jengibre",4500,false,true]]},
 {"categoria":"Desayunos","productos":[
   ["Desayuno clásico","Café con leche, dos medialunas y jugo de naranja",6900,false,true],
   ["Tostadas con palta","Masa madre, palta, huevo poché y semillas",8900,true,true],
   ["Yogur con granola","Granola casera, frutas de estación y miel",6500,false,true],
   ["Tostado de jamón y queso","En pan de miga",6800,false,true]]},
 {"categoria":"Brunch","productos":[
   ["Brunch Lumbre","Huevos revueltos, masa madre, palta, panceta, jugo y café",15900,true,true],
   ["Pancakes","Frutos rojos, crema y maple",9800,false,true],
   ["Huevos benedictinos","Muffin inglés, jamón y salsa holandesa",11200,false,true],
   ["Shakshuka","Huevos en salsa de tomate especiada, con pan",10500,false,true]]},
 {"categoria":"Pastelería","productos":[
   ["Medialuna de manteca","Unidad",1200,false,true],
   ["Croissant de almendras","Relleno de crema de almendras",3900,false,true],
   ["Budín de limón","Porción, con glaseado",3500,false,true],
   ["Carrot cake","Con frosting de queso crema",5600,false,true],
   ["Cookie de chocolate","Con chips de chocolate semiamargo",2900,false,false]]},
 {"categoria":"Salados","productos":[
   ["Sándwich de pastrami","Pan de centeno, pickles y mostaza",9800,false,true],
   ["Croissant de jamón crudo y brie","Con rúcula",7800,false,true],
   ["Quiche del día","Con ensalada verde",7900,false,true]]}
]');


-- ---------------------------------------------------------------------
-- 6. ZEN · Sushi y cocina nikkei
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('kaito', 'Kaito', 'Sushi y cocina nikkei', 'zen',
'{"layout":"list","photoSize":"sm","categoryMode":"tabs","showFeatured":true,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":true,"pickup":true,"delivery":true}}',
'[
 {"categoria":"Entradas","productos":[
   ["Ceviche nikkei","Pesca blanca, leche de tigre, ají amarillo y batata",13800,true,true],
   ["Gyozas de cerdo","Cinco unidades, salsa ponzu",8500,false,true],
   ["Edamame","Con sal marina",5200,false,true],
   ["Tiradito de salmón","Salsa de maracuyá y ají limo",14200,false,true],
   ["Langostinos tempura","Cinco unidades, mayonesa spicy",11900,false,true]]},
 {"categoria":"Rolls","productos":[
   ["Philadelphia","Ocho piezas. Salmón, queso crema y palta",12500,false,true],
   ["New York","Ocho piezas. Salmón, palta y sésamo",11900,false,true],
   ["Acevichado","Ocho piezas. Langostino tempura y palta, cubierto de pesca blanca",14800,true,true],
   ["Spicy tuna","Ocho piezas. Atún picante, pepino y verdeo",15200,false,true],
   ["Veggie","Ocho piezas. Palta, pepino, zanahoria y queso crema",9800,false,true]]},
 {"categoria":"Nigiris y sashimi","productos":[
   ["Nigiri de salmón","Dos unidades",5800,false,true],
   ["Nigiri de atún","Dos unidades",7200,false,true],
   ["Nigiri flambeado","Dos unidades, salmón y salsa de anguila",6400,false,true],
   ["Sashimi de salmón","Seis cortes",12800,false,true]]},
 {"categoria":"Combinados","productos":[
   ["Combinado 15 piezas","Rolls, nigiris y sashimi a elección del chef",21900,false,true],
   ["Combinado 30 piezas","Para dos personas",39800,true,true],
   ["Combinado premium","24 piezas con atún, langostino y salmón flambeado",42500,false,false]]},
 {"categoria":"Calientes","productos":[
   ["Ramen de cerdo","Caldo tonkotsu, chashu, huevo marinado y verdeo",15800,false,true],
   ["Yakimeshi","Arroz salteado con pollo, vegetales y huevo",11200,false,true],
   ["Pollo teriyaki","Con arroz gohan y sésamo",12900,false,true]]},
 {"categoria":"Bebidas","productos":[
   ["Té verde","Sencha caliente",3200,false,true],
   ["Limonada de jengibre","Con lima y menta",4200,false,true],
   ["Cerveza japonesa","Botella 330 ml",6800,false,true],
   ["Sake","Copa",7500,false,true]]}
]');


-- ---------------------------------------------------------------------
-- 7. FRESCO · Comida saludable
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('verde-raiz', 'Verde Raíz', 'Bowls, jugos y comida real', 'fresco',
'{"layout":"carousel","photoSize":"lg","categoryMode":"tabs","showFeatured":false,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":false,"pickup":true,"delivery":true}}',
'[
 {"categoria":"Bowls","productos":[
   ["Bowl de pollo","Arroz integral, pollo grillado, palta, hummus y vegetales asados",11900,true,true],
   ["Bowl de salmón","Quinoa, salmón, palta, edamame, pepino y salsa de sésamo",14800,false,true],
   ["Bowl veggie","Falafel, hummus, tabule y repollo morado",10500,false,true],
   ["Poke de atún","Arroz de sushi, atún, mango, palta y salsa ponzu",15200,false,true],
   ["Bowl de carne braseada","Arroz yamaní, carne desmechada, porotos negros y pico de gallo",12900,false,true]]},
 {"categoria":"Ensaladas","productos":[
   ["Caesar con pollo","Lechuga, pollo grillado, croutons, parmesano y aderezo caesar",10200,false,true],
   ["Ensalada de lentejas","Lentejas, tomate, pepino, cebolla morada y menta",9200,false,true],
   ["Calabaza y queso de cabra","Tibia, con rúcula, nueces y miel",9800,false,true]]},
 {"categoria":"Wraps y tostadas","productos":[
   ["Wrap de pollo y palta","Tortilla integral, lechuga y yogur con limón",8900,false,true],
   ["Wrap de falafel","Hummus, tomate, pepino y salsa tahini",8500,false,true],
   ["Tostada de palta","Pan de masa madre, palta, tomate y semillas",7200,false,true],
   ["Tostada de hummus","Hummus, huevo duro y pimentón",7400,false,true]]},
 {"categoria":"Jugos y licuados","productos":[
   ["Verde detox","Manzana verde, espinaca, pepino, apio y jengibre",5600,true,true],
   ["Naranja y zanahoria","Exprimido en el momento",4900,false,true],
   ["Frutos rojos","Licuado con banana y yogur",5600,false,true],
   ["Proteico de banana","Banana, avena, mantequilla de maní y leche",6200,false,true],
   ["Kombucha","De jengibre y limón",4800,false,true]]},
 {"categoria":"Snacks","productos":[
   ["Energy balls","Tres unidades, dátiles, cacao y coco",3900,false,true],
   ["Yogur con granola","Granola casera y frutas de estación",5200,false,true],
   ["Budín de banana","Sin azúcar agregada",3600,false,true],
   ["Mix de frutos secos","Porción de 80 g",3400,false,true]]}
]');


-- ---------------------------------------------------------------------
-- 8. GALERÍA · Bistró de autor
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('estudio-norte', 'Estudio Norte', 'Cocina de autor. El menú cambia con cada estación.', 'galeria',
'{"layout":"list","photoSize":"lg","categoryMode":"tabs","showFeatured":true,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":true,"pickup":false,"delivery":false}}',
'[
 {"categoria":"Para empezar","productos":[
   ["Crudo de pesca blanca","Leche de tigre de ají amarillo, choclo y cilantro",14800,true,true],
   ["Remolacha asada","Labneh, avellanas tostadas y aceite de eneldo",11200,false,true],
   ["Hongos asados","Crema de ajo negro y hierbas",12400,false,true],
   ["Mollejas glaseadas","Miel de caña y puré de hinojo",16900,false,true],
   ["Pan de masa madre","Manteca ahumada y sal de escamas",5600,false,true]]},
 {"categoria":"Principales","productos":[
   ["Cordero braseado","12 horas de cocción, puré de apio y jugo de cocción",31800,true,true],
   ["Ñoquis de calabaza","Manteca de salvia y parmesano",19800,false,true],
   ["Pesca del día","Hinojo asado, cítricos y beurre blanc",28400,false,true],
   ["Pollo de campo","Piel crocante, jugo de cocción y papines",24600,false,true],
   ["Bondiola de cerdo","Cocción lenta, manzana asada y mostaza antigua",25900,false,true]]},
 {"categoria":"Del huerto","productos":[
   ["Coliflor entera asada","Tahini, granada y menta",13800,false,true],
   ["Zanahorias glaseadas","Miel, comino y yogur",9600,false,true],
   ["Ensalada de hojas","Hojas de estación, vinagreta de mostaza",8900,false,true]]},
 {"categoria":"Postres","productos":[
   ["Helado de leche quemada","Crumble de cacao y sal",8600,true,true],
   ["Tarta de peras","Masa quebrada de almendras y crema de vainilla",9200,false,true],
   ["Mousse de chocolate","Aceite de oliva y sal en escamas",9400,false,true],
   ["Quesos de autor","Tres quesos argentinos, membrillo y pan de nuez",14200,false,true]]},
 {"categoria":"Bebidas","productos":[
   ["Vino de la semana","Copa. Preguntá por la etiqueta",8800,false,true],
   ["Vermut de la casa","Con soda y piel de naranja",7200,false,true],
   ["Agua saborizada","De estación, hecha en casa",4200,false,true],
   ["Café de especialidad","Filtrado o espresso",3600,false,true]]}
]');


-- ---------------------------------------------------------------------
-- 9. CAFÉ · Heladería (con elección de sabores)
-- ---------------------------------------------------------------------
select pg_temp.cargar_menu('heladeria-polar', 'Heladería Polar', 'Helado artesanal desde 1994', 'cafe',
'{"layout":"grid","photoSize":"md","categoryMode":"tabs","showFeatured":true,"ordering":true,"whatsapp":true,
  "orderTypes":{"table":false,"pickup":true,"delivery":true}}',
'[
 {"categoria":"Helado por peso","productos":[
   ["1 kg","Elegí hasta 4 sabores",16000,true,true,{"units":1,"min":1,"max":4,"label":"Kilo"}],
   ["1/2 kg","Elegí hasta 3 sabores",9000,false,true,{"units":1,"min":1,"max":3,"label":"1/2 kg"}],
   ["1/4 kg","Elegí hasta 2 sabores",5200,false,true,{"units":1,"min":1,"max":2,"label":"1/4 kg"}]]},
 {"categoria":"Promos","productos":[
   ["3x2 en potes de 1/4","Llevá 3 potes de 1/4 y pagá 2. Hasta 2 sabores por pote",10400,true,true,{"units":3,"min":1,"max":2,"label":"Pote de 1/4"}],
   ["2 kilos","Dos potes de 1 kg con hasta 4 sabores cada uno",30000,true,true,{"units":2,"min":1,"max":4,"label":"Kilo"}],
   ["1 kg + 1/4 de regalo","Comprando 1 kg te llevás 1/4 gratis. Elegí los sabores de cada uno",16000,true,true,
    {"parts":[{"label":"Kilo","min":1,"max":4},{"label":"1/4 de regalo","min":1,"max":3}]}]]},
 {"categoria":"Cucuruchos y vasitos","productos":[
   ["Cucurucho","Hasta 2 sabores",3800,false,true,{"units":1,"min":1,"max":2,"label":"Cucurucho"}],
   ["Vasito","Hasta 2 sabores",3400,false,true,{"units":1,"min":1,"max":2,"label":"Vasito"}]]},
 {"categoria":"Postres helados","productos":[
   ["Almendrado","Porción, con almendras tostadas",4800,false,true],
   ["Bombón escocés","Unidad, bañado en chocolate",3900,false,true],
   ["Palito bombón","Crema americana bañada en chocolate",2600,false,true]]}
]',
'[
 {"grupo":"Cremas","sabores":["Crema americana","Vainilla","Frutilla a la crema","Sambayón",["Tramontana","Crema con dulce de leche y bombones crocantes"]]},
 {"grupo":"Chocolates","sabores":["Chocolate","Chocolate amargo","Chocolate con almendras","Chocolate suizo"]},
 {"grupo":"Dulce de leche","sabores":["Dulce de leche","Dulce de leche granizado","Súper dulce de leche",["Chocotorta","Dulce de leche con queso crema y galletitas Chocolinas"]]},
 {"grupo":"Frutales","sabores":["Limón","Frutilla al agua","Durazno","Maracuyá","Ananá*"]},
 {"grupo":"Especiales","sabores":["Pistacho*","Menta granizada",["Cookies","Crema de vainilla con trozos de galletitas de chocolate"],["Banana split","Banana con dulce de leche y salsa de chocolate"]]}
]');


-- Resumen: cuántas categorías y productos quedó cada local
select r.slug, d.theme,
       (select count(*) from categories c where c.restaurant_id = r.id) as categorias,
       (select count(*) from products p where p.restaurant_id = r.id) as productos,
       (select count(*) from flavors f where f.restaurant_id = r.id) as sabores
from restaurants r join restaurant_design d on d.restaurant_id = r.id
where r.slug in ('don-ramon','casa-albeniz','la-mordida','bar-niebla','lumbre-cafe','kaito','verde-raiz','estudio-norte','heladeria-polar')
order by r.slug;
