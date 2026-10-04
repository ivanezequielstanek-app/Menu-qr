# MenúQR · Plataforma de menús digitales

Una sola app y un solo proyecto de Supabase para todos tus clientes.

- **Menú público** → `tudominio.com/nombre-del-local` (lo que abre el QR). Con `?mesa=5` el pedido llega con la mesa cargada.
- **Panel del dueño** → `tudominio.com/panel`: productos, precios, fotos (subir o sacar con la cámara), categorías, pedidos en vivo, datos del local y códigos QR.
- **Tu panel de administrador** → `tudominio.com/admin`: clientes, alta, invitaciones, pausar menús y **diseño de cada cliente** (solo vos).

## 1. Supabase

1. Creá un proyecto en supabase.com.
2. **SQL Editor → New query**: pegá `supabase/migrations/001_schema.sql` y ejecutalo.
3. **Authentication → Users → Add user**: creá tu usuario (email + contraseña).
4. Copiá su **User UID** y en el SQL Editor ejecutá:
   ```sql
   insert into platform_admins (user_id) values ('TU-USER-UID');
   ```
5. **Authentication → URL Configuration**:
   - Site URL: `https://tudominio.com`
   - Redirect URLs: agregá `https://tudominio.com/cuenta` y `http://localhost:5173/cuenta`
6. **Authentication → Providers → Email**: desactivá "Allow new users to sign up" (solo entran los que vos invitás).

### Función para invitar dueños
Instalá la CLI de Supabase y desde la carpeta del proyecto:
```bash
npx supabase login
npx supabase link --project-ref TU-PROJECT-REF
npx supabase functions deploy invite-owner
```

> Los emails de invitación salen del servidor de prueba de Supabase, que tiene un límite bajo por hora. Para producción configurá un SMTP propio en **Authentication → SMTP Settings** (Resend o Brevo tienen planes gratis).

## 2. Correr en tu computadora
```bash
npm install
cp .env.example .env     # completá URL y anon key (Project Settings → API)
npm run dev              # http://localhost:5173
```

## 3. Publicar en Cloudflare Pages (sin cartel, gratis)
1. Subí el proyecto a un repositorio de GitHub.
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command: `npm run build` · Output directory: `dist`
4. Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. **Custom domains**: conectá tu dominio.

Cada `git push` publica la nueva versión automáticamente para todos los clientes.

## Flujo para un cliente nuevo
1. `/admin` → **Nuevo cliente** (nombre, dirección, WhatsApp, diseño inicial).
2. **Diseño** → elegís diseño y opciones con vista previa en vivo → **Publicar cambios**.
3. **Invitar** → el dueño recibe un email, crea su contraseña y carga su menú.
4. También podés cargarle el menú vos desde **Menú** (modo administrador).

## Seguridad
- Cada dueño solo ve y edita su propio local (Row Level Security en la base de datos, no solo en la app).
- El dueño **no puede** cambiar el diseño, la dirección del menú ni pausar su cuenta.
- Las fotos se comprimen en el navegador a menos de 200 KB y además el servidor rechaza cualquier archivo más grande.
- Los pedidos se crean con una función que recalcula los precios desde la base de datos.

## Estructura
```
src/
  menu/MenuView.jsx        Menú público + carrito (lo usan el menú real, la vista previa y la demo)
  styles/menu.css          Los 4 diseños
  lib/designs.js           Diseños y opciones disponibles
  lib/image.js             Compresión de fotos
  components/PhotoPicker   Subir / sacar foto / arrastrar
  pages/panel/*            Panel del dueño
  pages/admin/*            Panel del administrador
supabase/
  migrations/001_schema.sql
  functions/invite-owner/
```

## Agregar un diseño nuevo
1. Sumalo en `THEMES` y `THEME_PRESETS` (`src/lib/designs.js`).
2. Agregá su bloque `.t-nombre { ... }` en `src/styles/menu.css`.
3. Sumá el nombre al `check (theme in (...))` de `restaurant_design` en Supabase.
