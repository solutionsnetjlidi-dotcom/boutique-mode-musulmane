-- ============================================================
-- 00006 — RPC STATUTS COMMANDES (section 74) + RESTOCK
-- ============================================================

create or replace function public.set_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order record;
  v_item record;
  v_allowed boolean;
begin
  if not public.is_manager() then
    raise exception 'RBAC : action réservée à l''équipe (manager et +).';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Commande introuvable.'; end if;

  if p_status not in ('pending','confirmed','preparing','shipped','delivered','cancelled','returned') then
    raise exception 'Statut invalide.';
  end if;

  if p_status = v_order.status then
    return jsonb_build_object('ok', true, 'order_number', v_order.order_number, 'status', p_status);
  end if;

  -- Transitions autorisées
  v_allowed := case
    when v_order.status = 'pending' then p_status in ('confirmed','cancelled')
    when v_order.status = 'confirmed' then p_status in ('preparing','cancelled')
    when v_order.status = 'preparing' then p_status in ('shipped','cancelled')
    when v_order.status = 'shipped' then p_status in ('delivered')
    when v_order.status = 'delivered' then p_status in ('returned')
    else false
  end;
  if not v_allowed then
    raise exception 'Transition % → % non autorisée.', v_order.status, p_status;
  end if;

  -- Restock sur annulation / retour (section 73)
  if p_status in ('cancelled','returned') then
    for v_item in select * from public.order_items where order_id = p_order_id
    loop
      if v_item.variant_id is not null then
        update public.product_variants set stock = stock + v_item.quantity where id = v_item.variant_id;
      end if;
      update public.products
      set stock = stock + v_item.quantity, sold_count = greatest(sold_count - v_item.quantity, 0)
      where id = v_item.product_id;
      insert into public.stock_movements (product_id, variant_id, type, quantity, reason, order_id, created_by)
      values (v_item.product_id, v_item.variant_id,
        case when p_status = 'cancelled' then 'release' else 'return' end,
        v_item.quantity, 'Commande ' || v_order.order_number || ' → ' || p_status, p_order_id, auth.uid());
    end loop;
  end if;

  update public.orders set status = p_status where id = p_order_id;
  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
  values (p_order_id, v_order.status, p_status, p_note, auth.uid());

  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  values (auth.uid(), 'order_status_change', 'orders', p_order_id,
    jsonb_build_object('status', v_order.status), jsonb_build_object('status', p_status, 'note', p_note));

  return jsonb_build_object('ok', true, 'order_number', v_order.order_number, 'status', p_status);
end;
$$;

grant execute on function public.set_order_status(uuid, text, text) to authenticated;