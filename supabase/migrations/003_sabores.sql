-- =====================================================================
--  Actualización: elegir sabores (heladerías, y cualquier producto con gustos)
--  Ejecutar UNA vez en Supabase > SQL Editor > New query > Run
--
--  · Cada local tiene su lista de sabores (se pueden marcar agotados).
--  · Un producto puede pedir sabores, por ejemplo:
--      1 kg de helado       → 1 unidad,  de 1 a 4 sabores
--      Promo 3x2 de 1/4 kg  → 3 unidades (potes), de 1 a 2 sabores cada uno
--  · El pedido guarda los sabores elegidos en cada ítem.
-- =====================================================================

-- ---------- Sabores de cada local ----------
create table if not exists flavors (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null check (length(name) between 1 and 60),
  grp           text,                      -- grupo: Cremas, Chocolates, Frutales…
  available     boolean not null default true,
  position      int not null default 0
);
create index if not exists flavors_restaurant_idx on flavors (restaurant_id, position);

alter table flavors enable row level security;
drop policy if exists "publico lee sabores" on flavors;
create policy "publico lee sabores" on flavors for select using (true);
drop policy if exists "dueño edita sabores" on flavors;
create policy "dueño edita sabores" on flavors for all
  using (is_member(restaurant_id) or is_platform_admin())
  with check (is_member(restaurant_id) or is_platform_admin());

-- ---------- Productos que piden sabores ----------
-- choice = null (producto común) o {"units":3,"min":1,"max":2,"label":"Pote de 1/4"}
alter table products add column if not exists choice jsonb;

-- ---------- Detalle del ítem en el pedido (los sabores elegidos) ----------
alter table order_items add column if not exists details text;

-- ---------- Crear pedido: ahora valida y guarda los sabores ----------
create or replace function place_order(
  p_slug text, p_type text, p_table text, p_name text,
  p_address text, p_notes text, p_items jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_rest uuid; v_opts jsonb; v_key text; v_order uuid; v_total numeric := 0;
  it jsonb; v_prod products%rowtype; v_qty int;
  v_has_flavors boolean; v_choice jsonb; v_units int; v_min int; v_max int;
  v_fl jsonb; v_unit jsonb; v_n int; v_cnt int; v_distinct int; v_names text;
  v_label text; v_parts text[]; v_details text;
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

  select exists (select 1 from flavors where restaurant_id = v_rest) into v_has_flavors;

  insert into orders (restaurant_id, order_type, table_number, customer_name, address, notes, total)
  values (v_rest, p_type, left(p_table,10), left(p_name,60), left(p_address,200), left(p_notes,300), 0)
  returning id into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it->>'qty')::int;
    select * into v_prod from products
     where id = (it->>'product_id')::uuid and restaurant_id = v_rest and available;
    if not found then raise exception 'Un producto ya no está disponible'; end if;

    v_details := null;
    v_choice := v_prod.choice;
    if v_choice is not null and v_has_flavors then
      v_units := least(greatest(coalesce((v_choice->>'units')::int, 1), 1), 10);
      v_min   := greatest(coalesce((v_choice->>'min')::int, 1), 1);
      v_max   := greatest(coalesce((v_choice->>'max')::int, v_min), v_min);
      v_label := coalesce(nullif(trim(v_choice->>'label'), ''), case when v_units > 1 then 'Unidad' else 'Sabores' end);
      v_fl := it->'flavors';
      if v_fl is null or jsonb_typeof(v_fl) <> 'array' or jsonb_array_length(v_fl) <> v_units then
        raise exception 'Elegí los sabores de %', v_prod.name;
      end if;
      v_parts := array[]::text[];
      for i in 0 .. v_units - 1 loop
        v_unit := v_fl->i;
        if jsonb_typeof(v_unit) <> 'array' then raise exception 'Elegí los sabores de %', v_prod.name; end if;
        v_n := jsonb_array_length(v_unit);
        if v_n < v_min or v_n > v_max then
          raise exception 'La cantidad de sabores de % no es válida', v_prod.name;
        end if;
        select string_agg(f.name, ', ' order by e.ord), count(*), count(distinct f.id)
          into v_names, v_cnt, v_distinct
          from jsonb_array_elements_text(v_unit) with ordinality as e(fid, ord)
          join flavors f on f.id::text = e.fid and f.restaurant_id = v_rest and f.available;
        if v_cnt <> v_n or v_distinct <> v_n then
          raise exception 'Un sabor de % ya no está disponible', v_prod.name;
        end if;
        v_parts := v_parts || (case when v_units > 1 then (i + 1) || '° ' || v_label else v_label end || ': ' || v_names);
      end loop;
      v_details := array_to_string(v_parts, ' · ');
    end if;

    insert into order_items (order_id, product_id, name, unit_price, qty, details)
    values (v_order, v_prod.id, v_prod.name, v_prod.price, v_qty, v_details);
    v_total := v_total + v_prod.price * v_qty;
  end loop;

  update orders set total = v_total where id = v_order;
  return v_order;
end $$;
revoke all on function place_order from public;
grant execute on function place_order to anon, authenticated;
