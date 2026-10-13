-- =====================================================================
--  Actualización: promos con potes distintos
--  Ej: 1 kg (hasta 4 sabores) + 1/4 de regalo (hasta 3 sabores) en un mismo producto.
--  Ejecutar UNA vez en Supabase > SQL Editor, después de 003_sabores.sql
--  (no cambia tablas: solo actualiza la función que crea los pedidos)
-- =====================================================================
create or replace function place_order(
  p_slug text, p_type text, p_table text, p_name text,
  p_address text, p_notes text, p_items jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_rest uuid; v_opts jsonb; v_key text; v_order uuid; v_total numeric := 0;
  it jsonb; v_prod products%rowtype; v_qty int;
  v_has_flavors boolean; v_choice jsonb; v_plist jsonb; v_part jsonb; v_units int; v_min int; v_max int;
  v_fl jsonb; v_unit jsonb; v_n int; v_cnt int; v_distinct int; v_names text;
  v_label text; v_same int; v_ord int; v_parts text[]; v_details text;
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
      -- Potes del producto: formato nuevo {"parts":[{label,min,max},…]} o el anterior {units,min,max,label}
      if jsonb_typeof(v_choice->'parts') = 'array' and jsonb_array_length(v_choice->'parts') > 0 then
        select jsonb_agg(value order by o) into v_plist
          from jsonb_array_elements(v_choice->'parts') with ordinality as e(value, o) where o <= 10;
      else
        select jsonb_agg(v_choice) into v_plist
          from generate_series(1, least(greatest(coalesce((v_choice->>'units')::int, 1), 1), 10));
      end if;
      v_units := jsonb_array_length(v_plist);
      v_fl := it->'flavors';
      if v_fl is null or jsonb_typeof(v_fl) <> 'array' or jsonb_array_length(v_fl) <> v_units then
        raise exception 'Elegí los sabores de %', v_prod.name;
      end if;
      v_parts := array[]::text[];
      for i in 0 .. v_units - 1 loop
        v_part := v_plist->i;
        v_min := greatest(coalesce((v_part->>'min')::int, 1), 1);
        v_max := greatest(coalesce((v_part->>'max')::int, v_min), v_min);
        -- Nombre que se muestra: "Kilo", o "1° Pote de 1/4" si el nombre se repite
        v_label := trim(coalesce(v_part->>'label', ''));
        if v_label = '' then
          v_label := case when v_units > 1 then 'Unidad ' || (i + 1) else 'Sabores' end;
        else
          select count(*) into v_same from jsonb_array_elements(v_plist) e
           where trim(coalesce(e->>'label', '')) = v_label;
          if v_same > 1 then
            select count(*) into v_ord from jsonb_array_elements(v_plist) with ordinality as e(value, o)
             where o <= i + 1 and trim(coalesce(value->>'label', '')) = v_label;
            v_label := v_ord || '° ' || v_label;
          end if;
        end if;
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
        v_parts := v_parts || (v_label || ': ' || v_names);
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
