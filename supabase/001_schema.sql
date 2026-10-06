-- =====================================================================
--  MENÚS QR · Esquema multi-cliente para Supabase
--  Pegar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

-- ---------- 1. ADMINISTRADORES DE LA PLATAFORMA (vos) ----------
create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function is_platform_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

-- ---------- 2. RESTAURANTES ----------
create table restaurants (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null
              check (slug ~ '^[a-z0-9-]{3,40}$'
                     and slug not in ('login','panel','admin','cuenta','api','assets')),
  name        text not null,
  tagline     text,
  whatsapp    text,                 -- internacional sin +: 5491112345678
  logo_path   text,
  active      boolean not null default true,
  plan        text not null default 'free' check (plan in ('free','pro')),
  created_at  timestamptz not null default now()
);

create table restaurant_members (
  restaurant_id uuid references restaurants(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  role          text not null default 'owner' check (role in ('owner','staff')),
  primary key (restaurant_id, user_id)
);
create index on restaurant_members (user_id);

create or replace function is_member(rid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from restaurant_members
                 where restaurant_id = rid and user_id = auth.uid());
$$;

-- ---------- 3. DISEÑO (solo lo edita el administrador) ----------
-- options guarda: heroStyle, showLogo, categoryMode, layout, photoSize,
-- showDescriptions, lightbox, showFeatured, accent, ordering, whatsapp,
-- orderTypes{table,pickup,delivery}
create table restaurant_design (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  theme         text not null default 'elegante'
                check (theme in ('elegante','burger','bar','parrilla','cafe','zen','fresco','galeria')),
  options       jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ---------- 4. MENÚ (lo edita el dueño) ----------
create table categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  position      int  not null default 0,
  visible       boolean not null default true
);
create index on categories (restaurant_id, position);

create table products (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id   uuid not null references categories(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(12,2) not null check (price >= 0),
  image_path    text,
  available     boolean not null default true,
  featured      boolean not null default false,
  position      int not null default 0,
  updated_at    timestamptz not null default now()
);
create index on products (restaurant_id, category_id, position);

-- ---------- 5. PEDIDOS ----------
create table orders (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_type    text not null check (order_type in ('mesa','retiro','delivery')),
  table_number  text,
  customer_name text,
  address       text,
  notes         text,
  total         numeric(12,2) not null,
  status        text not null default 'nuevo'
                check (status in ('nuevo','preparando','listo','entregado','cancelado')),
  created_at    timestamptz not null default now()
);
create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name       text not null,
  unit_price numeric(12,2) not null,
  qty        int not null check (qty between 1 and 50)
);
create index on orders (restaurant_id, created_at desc);
create index on order_items (order_id);

-- =====================================================================
--  SEGURIDAD (Row Level Security)
-- =====================================================================
alter table platform_admins    enable row level security;
alter table restaurants        enable row level security;
alter table restaurant_members enable row level security;
alter table restaurant_design  enable row level security;
alter table categories         enable row level security;
alter table products           enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;

create policy "admin lee admins" on platform_admins for select using (is_platform_admin());

-- Restaurantes: el público ve los activos; el dueño el suyo; vos todos
create policy "ver restaurantes" on restaurants for select
  using (active or is_member(id) or is_platform_admin());
create policy "admin gestiona restaurantes" on restaurants for all
  using (is_platform_admin()) with check (is_platform_admin());
create policy "dueño edita datos basicos" on restaurants for update
  using (is_member(id)) with check (is_member(id));

-- El dueño no puede cambiar dirección, estado ni plan
create or replace function protect_restaurant_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() and (
       new.slug   is distinct from old.slug  or
       new.active is distinct from old.active or
       new.plan   is distinct from old.plan) then
    raise exception 'Solo el administrador puede cambiar la dirección, el estado o el plan';
  end if;
  return new;
end $$;
create trigger trg_protect_restaurant before update on restaurants
  for each row execute function protect_restaurant_fields();

create policy "ver mi membresia" on restaurant_members for select
  using (user_id = auth.uid() or is_platform_admin());
create policy "admin gestiona miembros" on restaurant_members for all
  using (is_platform_admin()) with check (is_platform_admin());

-- Diseño: todos lo leen, SOLO vos lo escribís
create policy "publico lee diseño" on restaurant_design for select using (true);
create policy "solo admin edita diseño" on restaurant_design for all
  using (is_platform_admin()) with check (is_platform_admin());

-- Menú: público lee, dueño y vos editan
create policy "publico lee categorias" on categories for select using (true);
create policy "dueño edita categorias" on categories for all
  using (is_member(restaurant_id) or is_platform_admin())
  with check (is_member(restaurant_id) or is_platform_admin());

create policy "publico lee productos" on products for select using (true);
create policy "dueño edita productos" on products for all
  using (is_member(restaurant_id) or is_platform_admin())
  with check (is_member(restaurant_id) or is_platform_admin());

-- Pedidos: el público NO inserta directo (usa place_order)
create policy "dueño ve pedidos" on orders for select
  using (is_member(restaurant_id) or is_platform_admin());
create policy "dueño cambia estado" on orders for update
  using (is_member(restaurant_id) or is_platform_admin())
  with check (is_member(restaurant_id) or is_platform_admin());
create policy "dueño ve items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id
                 and (is_member(o.restaurant_id) or is_platform_admin())));

-- =====================================================================
--  CREAR PEDIDO (recalcula precios en el servidor y respeta el diseño)
-- =====================================================================
create or replace function place_order(
  p_slug text, p_type text, p_table text, p_name text,
  p_address text, p_notes text, p_items jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_rest uuid; v_opts jsonb; v_key text; v_order uuid; v_total numeric := 0;
  it jsonb; v_prod products%rowtype; v_qty int;
begin
  select r.id, coalesce(d.options, '{}'::jsonb) into v_rest, v_opts
    from restaurants r left join restaurant_design d on d.restaurant_id = r.id
   where r.slug = p_slug and r.active;
  if v_rest is null then raise exception 'Restaurante no disponible'; end if;

  if coalesce((v_opts->>'ordering')::boolean, true) = false then
    raise exception 'Este local no recibe pedidos online';
  end if;
  v_key := case p_type when 'mesa' then 'table' when 'retiro' then 'pickup' when 'delivery' then 'delivery' end;
  if v_key is null or coalesce((v_opts->'orderTypes'->>v_key)::boolean, v_key <> 'delivery') = false then
    raise exception 'Tipo de pedido no habilitado';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 40 then
    raise exception 'Pedido inválido';
  end if;

  insert into orders (restaurant_id, order_type, table_number, customer_name, address, notes, total)
  values (v_rest, p_type, left(p_table,10), left(p_name,60), left(p_address,200), left(p_notes,300), 0)
  returning id into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it->>'qty')::int;
    select * into v_prod from products
     where id = (it->>'product_id')::uuid and restaurant_id = v_rest and available;
    if not found then raise exception 'Un producto ya no está disponible'; end if;
    insert into order_items (order_id, product_id, name, unit_price, qty)
    values (v_order, v_prod.id, v_prod.name, v_prod.price, v_qty);
    v_total := v_total + v_prod.price * v_qty;
  end loop;

  update orders set total = v_total where id = v_order;
  return v_order;
end $$;
revoke all on function place_order from public;
grant execute on function place_order to anon, authenticated;

-- Pedidos en tiempo real
alter publication supabase_realtime add table orders;

-- =====================================================================
--  FOTOS: límite DURO de 200 KB por archivo
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 204800, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Cada local solo puede escribir dentro de su carpeta {restaurant_id}/
create or replace function can_write_folder(obj_name text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_id uuid;
begin
  begin v_id := ((storage.foldername(obj_name))[1])::uuid;
  exception when others then return false; end;
  return is_member(v_id) or is_platform_admin();
end $$;

create policy "subir fotos propias" on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and can_write_folder(name));
create policy "reemplazar fotos propias" on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and can_write_folder(name));
create policy "borrar fotos propias" on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and can_write_folder(name));
