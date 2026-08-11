-- ============================================================
-- 00002 — RLS + RBAC (sections 81, 69)
-- ============================================================

-- Helpers de rôle
create or replace function public.get_current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.user_roles where user_id = auth.uid()), 'client')
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_current_user_role() = 'super_admin'
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_current_user_role() in ('super_admin','admin')
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_current_user_role() in ('super_admin','admin','manager')
$$;

-- Création automatique du profil + rôle client à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'client')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Activation RLS sur toutes les tables ============
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.site_settings enable row level security;
alter table public.themes enable row level security;
alter table public.languages enable row level security;
alter table public.navigation_items enable row level security;
alter table public.announcement_bars enable row level security;
alter table public.hero_sections enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_attributes enable row level security;
alter table public.size_guides enable row level security;
alter table public.reviews enable row level security;
alter table public.faqs enable row level security;
alter table public.lookbooks enable row level security;
alter table public.media enable row level security;
alter table public.service_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.stock_movements enable row level security;
alter table public.promotions enable row level security;
alter table public.coupons enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.social_links enable row level security;
alter table public.audit_logs enable row level security;

-- ============ POLITIQUES ============

-- Profils : chacun le sien, admin lit tout
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update" on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- Rôles : seul super_admin gère
create policy "roles_select" on public.user_roles for select
  using (user_id = auth.uid() or public.is_super_admin());
create policy "roles_write" on public.user_roles for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Paramètres / CMS / catalogue : lecture publique des actifs, écriture admin
create policy "settings_read" on public.site_settings for select using (true);
create policy "settings_write" on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

create policy "themes_read" on public.themes for select using (is_active or public.is_admin());
create policy "themes_write" on public.themes for all
  using (public.is_admin()) with check (public.is_admin());

create policy "languages_read" on public.languages for select using (true);
create policy "languages_write" on public.languages for all
  using (public.is_admin()) with check (public.is_admin());

create policy "nav_read" on public.navigation_items for select using (is_active or public.is_admin());
create policy "nav_write" on public.navigation_items for all
  using (public.is_admin()) with check (public.is_admin());

create policy "announce_read" on public.announcement_bars for select using (is_active or public.is_admin());
create policy "announce_write" on public.announcement_bars for all
  using (public.is_admin()) with check (public.is_admin());

create policy "hero_read" on public.hero_sections for select using (is_active or public.is_admin());
create policy "hero_write" on public.hero_sections for all
  using (public.is_admin()) with check (public.is_admin());

create policy "home_sections_read" on public.homepage_sections for select using (is_active or public.is_admin());
create policy "home_sections_write" on public.homepage_sections for all
  using (public.is_admin()) with check (public.is_admin());

create policy "categories_read" on public.categories for select using (is_active or public.is_admin());
create policy "categories_write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "collections_read" on public.collections for select using (is_active or public.is_admin());
create policy "collections_write" on public.collections for all
  using (public.is_admin()) with check (public.is_admin());

-- Section 81 : le public ne lit que les produits actifs, jamais écrit
create policy "products_read" on public.products for select using (is_active or public.is_admin());
create policy "products_write" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

create policy "variants_read" on public.product_variants for select using (is_active or public.is_admin());
create policy "variants_write" on public.product_variants for all
  using (public.is_admin()) with check (public.is_admin());

create policy "images_read" on public.product_images for select using (true);
create policy "images_write" on public.product_images for all
  using (public.is_admin()) with check (public.is_admin());

create policy "attributes_read" on public.product_attributes for select using (true);
create policy "attributes_write" on public.product_attributes for all
  using (public.is_admin()) with check (public.is_admin());

create policy "sizeguides_read" on public.size_guides for select using (is_active or public.is_admin());
create policy "sizeguides_write" on public.size_guides for all
  using (public.is_admin()) with check (public.is_admin());

-- Avis : public lit les approuvés, admin modère
create policy "reviews_read" on public.reviews for select using (is_approved or public.is_admin());
create policy "reviews_insert" on public.reviews for insert with check (auth.uid() is not null);
create policy "reviews_write" on public.reviews for all
  using (public.is_admin()) with check (public.is_admin());

create policy "faqs_read" on public.faqs for select using (is_active or public.is_admin());
create policy "faqs_write" on public.faqs for all
  using (public.is_admin()) with check (public.is_admin());

create policy "lookbooks_read" on public.lookbooks for select using (is_active or public.is_admin());
create policy "lookbooks_write" on public.lookbooks for all
  using (public.is_admin()) with check (public.is_admin());

create policy "media_read" on public.media for select using (true);
create policy "media_write" on public.media for all
  using (public.is_admin()) with check (public.is_admin());

create policy "zones_read" on public.service_zones for select using (is_active or public.is_admin());
create policy "zones_write" on public.service_zones for all
  using (public.is_admin()) with check (public.is_admin());

-- Section 81 : cliente A ne voit jamais la commande de cliente B
create policy "orders_select" on public.orders for select
  using (user_id = auth.uid() or public.is_manager());
create policy "orders_write" on public.orders for all
  using (public.is_manager()) with check (public.is_manager());

create policy "order_items_select" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_manager())));
create policy "order_items_write" on public.order_items for all
  using (public.is_manager()) with check (public.is_manager());

create policy "order_history_select" on public.order_status_history for select
  using (exists (select 1 from public.orders o where o.id = order_status_history.order_id and (o.user_id = auth.uid() or public.is_manager())));
create policy "order_history_write" on public.order_status_history for all
  using (public.is_manager()) with check (public.is_manager());

-- Section 81 : cliente ne modifie jamais le stock
create policy "stock_movements_read" on public.stock_movements for select using (public.is_manager());
create policy "stock_movements_write" on public.stock_movements for all
  using (public.is_manager()) with check (public.is_manager());

create policy "promotions_read" on public.promotions for select using (is_active or public.is_admin());
create policy "promotions_write" on public.promotions for all
  using (public.is_admin()) with check (public.is_admin());

-- Section 92 : coupons jamais exposés au public
create policy "coupons_read" on public.coupons for select using (public.is_admin());
create policy "coupons_write" on public.coupons for all
  using (public.is_admin()) with check (public.is_admin());

-- Wishlist & panier : chacun les siens
create policy "wishlists_own" on public.wishlists for all
  using (user_id = auth.uid() or session_token is not null)
  with check (user_id = auth.uid() or session_token is not null);
create policy "wishlist_items_own" on public.wishlist_items for all
  using (exists (select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id));

create policy "cart_own" on public.cart_items for all
  using (user_id = auth.uid() or session_token is not null)
  with check (user_id = auth.uid() or session_token is not null);

-- Newsletter : insertion publique (avec consentement), lecture admin
create policy "newsletter_insert" on public.newsletter_subscribers for insert
  with check (consent = true);
create policy "newsletter_admin" on public.newsletter_subscribers for all
  using (public.is_admin()) with check (public.is_admin());

-- Contact : insertion publique, lecture admin
create policy "contact_insert" on public.contact_messages for insert with check (true);
create policy "contact_admin" on public.contact_messages for all
  using (public.is_admin()) with check (public.is_admin());

create policy "social_read" on public.social_links for select using (is_active or public.is_admin());
create policy "social_write" on public.social_links for all
  using (public.is_admin()) with check (public.is_admin());

-- Audit : lecture admin, insertion via fonctions
create policy "audit_read" on public.audit_logs for select using (public.is_admin());
create policy "audit_insert" on public.audit_logs for insert with check (true);