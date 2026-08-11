-- ============================================================
-- 00005 — RPC CHECKOUT SÉCURISÉ (sections 44, 47, 35)
-- Le frontend n'envoie QUE des IDs + quantités.
-- Le serveur recalcule prix, stock, promo, coupon, livraison, total.
-- ============================================================

-- Génération du numéro de commande ORD-2026-000001 (section 47)
create sequence if not exists public.order_number_seq;
create or replace function public.generate_order_number()
returns text language plpgsql security definer set search_path = public as $$
begin
  return 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
end;
$$;

-- Calcul du prix effectif d'un produit (base - promotions actives, section 91)
create or replace function public.effective_price(p_product_id uuid, p_base numeric)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_price numeric := p_base;
  v_promo record;
  v_discount numeric := 0;
begin
  for v_promo in
    select type, value from public.promotions
    where is_active = true
      and (start_at is null or start_at <= now())
      and (end_at is null or end_at >= now())
      and (usage_limit is null or usage_count < usage_limit)
      and (
        scope_type = 'global'
        or (scope_type = 'product' and product_id = p_product_id)
        or (scope_type = 'category' and category_id = (select category_id from public.products where id = p_product_id))
        or (scope_type = 'collection' and collection_id = (select collection_id from public.products where id = p_product_id))
      )
  loop
    if v_promo.type = 'percentage' then
      v_discount := greatest(v_discount, round(v_price * v_promo.value / 100, 2));
    else
      v_discount := greatest(v_discount, v_promo.value);
    end if;
  end loop;
  return greatest(v_price - v_discount, 0);
end;
$$;

-- Validation coupon (section 92) — serveur uniquement
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  c record;
  v_discount numeric;
begin
  select * into c from public.coupons
  where upper(code) = upper(trim(p_code)) and is_active = true;
  if not found then return jsonb_build_object('valid', false, 'message', 'Coupon invalide.'); end if;
  if (c.start_at is not null and c.start_at > now()) or (c.end_at is not null and c.end_at < now()) then
    return jsonb_build_object('valid', false, 'message', 'Coupon expiré ou pas encore actif.');
  end if;
  if c.usage_limit is not null and c.usage_count >= c.usage_limit then
    return jsonb_build_object('valid', false, 'message', 'Coupon épuisé.');
  end if;
  if c.minimum_order_amount is not null and p_subtotal < c.minimum_order_amount then
    return jsonb_build_object('valid', false, 'message', 'Minimum de commande : ' || c.minimum_order_amount || ' DT.');
  end if;
  if c.type = 'percentage' then v_discount := round(p_subtotal * c.value / 100, 2);
  else v_discount := c.value; end if;
  if c.maximum_discount_amount is not null then v_discount := least(v_discount, c.maximum_discount_amount); end if;
  return jsonb_build_object('valid', true, 'discount', least(v_discount, p_subtotal),
    'label', case when c.type = 'percentage' then '-' || c.value || '%' else '-' || c.value || ' DT' end);
end;
$$;

-- RPC principale : création de commande sécurisée (section 44)
create or replace function public.create_order(
  p_customer jsonb,
  p_items jsonb,
  p_shipping_zone_id uuid,
  p_coupon_code text default null,
  p_comment text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_item record;
  v_product record;
  v_variant record;
  v_zone record;
  v_coupon record;
  v_unit_price numeric;
  v_line_discount numeric;
  v_final_price numeric;
  v_stock int;
  v_subtotal numeric := 0;
  v_coupon_discount numeric := 0;
  v_shipping numeric;
  v_total numeric;
  v_order_id uuid;
  v_order_number text;
  v_items_summary text := '';
  v_first text; v_last text; v_phone text; v_email text; v_whatsapp text;
  v_country text; v_city text; v_address text; v_complement text;
begin
  -- Validations serveur (section 83)
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Le panier est vide.';
  end if;

  v_first := nullif(trim(coalesce(p_customer->>'first_name','')), '');
  v_last := nullif(trim(coalesce(p_customer->>'last_name','')), '');
  v_phone := nullif(regexp_replace(coalesce(p_customer->>'phone',''), '[^0-9+]', '', 'g'), '');
  v_email := nullif(trim(coalesce(p_customer->>'email','')), '');
  v_whatsapp := nullif(regexp_replace(coalesce(p_customer->>'whatsapp',''), '[^0-9+]', '', 'g'), '');
  v_country := coalesce(nullif(trim(p_customer->>'country'),''), 'TN');
  v_city := nullif(trim(coalesce(p_customer->>'city','')), '');
  v_address := nullif(trim(coalesce(p_customer->>'address','')), '');
  v_complement := nullif(trim(coalesce(p_customer->>'address_complement','')), '');

  if v_first is null or v_last is null then raise exception 'Prénom et nom obligatoires.'; end if;
  if v_phone is null or length(v_phone) < 8 then raise exception 'Numéro de téléphone invalide.'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Adresse email invalide.'; end if;
  if v_city is null then raise exception 'La ville est obligatoire.'; end if;
  if v_address is null then raise exception 'L''adresse est obligatoire.'; end if;

  create temp table tmp_order_items (
    product_id uuid, variant_id uuid, product_name text, product_sku text,
    variant_attributes jsonb, image_url text, unit_price numeric,
    discount_amount numeric, quantity int, total numeric
  ) on commit drop;

  -- Boucle articles : recalcul des prix depuis la base (jamais depuis le front)
  for v_item in
    select (x->>'product_id')::uuid as product_id,
           nullif(x->>'variant_id','')::uuid as variant_id,
           greatest(coalesce((x->>'quantity')::int, 1), 1) as quantity
    from jsonb_array_elements(p_items) x
  loop
    -- Verrou ligne : anti-survente (section 35)
    select * into v_product from public.products
    where id = v_item.product_id and is_active = true for update;
    if not found then raise exception 'Un produit du panier n''est plus disponible.'; end if;

    if v_item.variant_id is not null then
      select * into v_variant from public.product_variants
      where id = v_item.variant_id and product_id = v_item.product_id and is_active = true for update;
      if not found then raise exception 'Une variante du panier n''est plus disponible.'; end if;
      v_unit_price := coalesce(v_variant.price, v_product.base_price);
      v_stock := v_variant.stock;
    else
      v_variant := null;
      v_unit_price := v_product.base_price;
      v_stock := v_product.stock;
    end if;

    if v_stock < v_item.quantity then
      raise exception 'Stock insuffisant pour « % » (reste : %).',
        coalesce(v_product.name_translations->>'fr', v_product.slug), v_stock;
    end if;

    -- Prix effectif après promotions (section 91)
    v_final_price := public.effective_price(v_product.id, v_unit_price);
    v_line_discount := round((v_unit_price - v_final_price) * v_item.quantity, 2);

    insert into tmp_order_items values (
      v_product.id,
      case when v_variant.id is not null then v_variant.id else null end,
      coalesce(v_product.name_translations->>'fr', v_product.slug),
      coalesce(v_variant.sku, v_product.sku),
      case when v_variant.id is not null then v_variant.attributes else '{}'::jsonb end,
      coalesce(v_variant.image_url, v_product.main_image_url),
      v_unit_price, v_line_discount, v_item.quantity,
      round(v_final_price * v_item.quantity, 2)
    );

    -- Décrément stock + compteur ventes
    if v_variant.id is not null then
      update public.product_variants set stock = stock - v_item.quantity where id = v_variant.id;
    end if;
    update public.products
    set stock = stock - v_item.quantity, sold_count = sold_count + v_item.quantity
    where id = v_product.id;

    -- Mouvement de stock (section 73)
    insert into public.stock_movements (product_id, variant_id, type, quantity, reason, created_by)
    values (v_product.id, case when v_variant.id is not null then v_variant.id else null end,
            'sale', -v_item.quantity, 'Commande en cours', auth.uid());

    v_subtotal := v_subtotal + round(v_final_price * v_item.quantity, 2);
    v_items_summary := v_items_summary || '• ' || coalesce(v_product.name_translations->>'fr','') || ' x' || v_item.quantity || E'\n';
  end loop;

  -- Coupon (section 92)
  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon from public.coupons
    where upper(code) = upper(trim(p_coupon_code)) and is_active = true for update;
    if found then
      if (v_coupon.start_at is null or v_coupon.start_at <= now())
         and (v_coupon.end_at is null or v_coupon.end_at >= now())
         and (v_coupon.usage_limit is null or v_coupon.usage_count < v_coupon.usage_limit)
         and (v_coupon.minimum_order_amount is null or v_subtotal >= v_coupon.minimum_order_amount) then
        if v_coupon.type = 'percentage' then v_coupon_discount := round(v_subtotal * v_coupon.value / 100, 2);
        else v_coupon_discount := v_coupon.value; end if;
        if v_coupon.maximum_discount_amount is not null then v_coupon_discount := least(v_coupon_discount, v_coupon.maximum_discount_amount); end if;
        v_coupon_discount := least(v_coupon_discount, v_subtotal);
        update public.coupons set usage_count = usage_count + 1 where id = v_coupon.id;
      end if;
    end if;
  end if;

  -- Livraison par zone (section 48)
  select * into v_zone from public.service_zones where id = p_shipping_zone_id and is_active = true;
  if not found then raise exception 'Zone de livraison invalide.'; end if;
  v_shipping := v_zone.shipping_fee;
  if v_zone.free_shipping_threshold is not null and (v_subtotal - v_coupon_discount) >= v_zone.free_shipping_threshold then
    v_shipping := 0;
  end if;

  v_total := greatest(v_subtotal - v_coupon_discount, 0) + v_shipping;
  v_order_number := public.generate_order_number();

  -- Insertion commande + snapshot produits (section 46)
  insert into public.orders (
    order_number, user_id, status, customer_first_name, customer_last_name, customer_email,
    customer_phone, customer_whatsapp, country, city, zone_name, address, address_complement,
    order_comment, subtotal, discount_amount, shipping_fee, total, currency,
    coupon_id, coupon_code, shipping_zone_id, payment_method, payment_status
  ) values (
    v_order_number, auth.uid(), 'pending', v_first, v_last, v_email, v_phone,
    coalesce(v_whatsapp, v_phone), v_country, v_city, coalesce(v_zone.name_translations->>'fr',''),
    v_address, v_complement, p_comment, v_subtotal, v_coupon_discount, v_shipping, v_total, 'TND',
    case when v_coupon.id is not null then v_coupon.id else null end,
    case when v_coupon.id is not null then v_coupon.code else null end,
    v_zone.id, 'cod', 'unpaid'
  ) returning id into v_order_id;

  insert into public.order_items (order_id, product_id, variant_id, product_name, product_sku, variant_attributes, image_url, unit_price, discount_amount, quantity, total)
  select v_order_id, product_id, variant_id, product_name, product_sku, variant_attributes, image_url, unit_price, discount_amount, quantity, total
  from tmp_order_items;

  -- Historique statut
  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
  values (v_order_id, null, 'pending', 'Commande créée', auth.uid());

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'discount', v_coupon_discount,
    'shipping', v_shipping,
    'total', v_total,
    'zone', coalesce(v_zone.name_translations->>'fr',''),
    'whatsapp_message', format(
      'Bonjour, je souhaite confirmer ma commande #%s.%sProduits :%sTotal : %s DT%sLivraison : %s%sAdresse : %s',
      v_order_number, E'\n', v_items_summary, to_char(v_total, 'FM999990.00'), E'\n',
      coalesce(v_zone.name_translations->>'fr',''), E'\n', v_address || ', ' || v_city
    )
  );
end;
$$;

grant execute on function public.create_order(jsonb, jsonb, uuid, text, text) to anon, authenticated;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;