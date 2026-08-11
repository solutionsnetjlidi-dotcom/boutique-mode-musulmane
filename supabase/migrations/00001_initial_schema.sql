-- ============================================================
-- 00001 — SCHÉMA INITIAL (section 80)
-- Stack : Supabase / PostgreSQL / RLS
-- ============================================================

create extension if not exists "pgcrypto";

-- Helper : updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ 1. PROFILS & RÔLES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  whatsapp text,
  country text,
  city text,
  zone text,
  address text,
  address_complement text,
  preferred_language text default 'fr',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('super_admin','admin','manager','client')),
  granted_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(user_id)
);

-- ============ 2. PARAMÈTRES & CMS ============
create table public.site_settings (
  key text primary key,
  value jsonb,
  description text,
  updated_at timestamptz default now()
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_translations jsonb default '{"fr":"","en":"","ar":""}',
  colors jsonb not null,
  typography jsonb,
  is_active boolean default true,
  is_default boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.languages (
  code text primary key,
  name text not null,
  native_name text,
  flag text,
  is_rtl boolean default false,
  is_active boolean default true,
  is_default boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.navigation_items(id) on delete cascade,
  label_translations jsonb default '{"fr":"","en":"","ar":""}',
  url text,
  menu_location text default 'main',
  is_mega_menu boolean default false,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.announcement_bars (
  id uuid primary key default gen_random_uuid(),
  text_translations jsonb default '{"fr":"","en":"","ar":""}',
  link_url text,
  background_color text,
  text_color text,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.hero_sections (
  id uuid primary key default gen_random_uuid(),
  title_translations jsonb default '{"fr":"","en":"","ar":""}',
  subtitle_translations jsonb default '{"fr":"","en":"","ar":""}',
  image_desktop text,
  image_mobile text,
  cta_label_translations jsonb default '{"fr":"","en":"","ar":""}',
  cta_url text,
  cta_secondary_label_translations jsonb default '{"fr":"","en":"","ar":""}',
  cta_secondary_url text,
  is_slider boolean default true,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  title_translations jsonb default '{"fr":"","en":"","ar":""}',
  config jsonb default '{}',
  is_active boolean default true,
  sort_order int default 0,
  updated_at timestamptz default now()
);
create trigger trg_homepage_updated before update on public.homepage_sections
  for each row execute function public.set_updated_at();

-- ============ 3. CATALOGUE ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  slug text unique not null,
  sku text,
  name_translations jsonb default '{"fr":"","en":"","ar":""}',
  description_translations jsonb default '{"fr":"","en":"","ar":""}',
  image_url text,
  banner_url text,
  icon text,
  meta_title jsonb,
  meta_description jsonb,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_translations jsonb default '{"fr":"","en":"","ar":""}',
  description_translations jsonb default '{"fr":"","en":"","ar":""}',
  image_url text,
  banner_url text,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_collections_updated before update on public.collections
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  sku text,
  name_translations jsonb default '{"fr":"","en":"","ar":""}',
  short_description_translations jsonb default '{"fr":"","en":"","ar":""}',
  description_translations jsonb default '{"fr":"","en":"","ar":""}',
  category_id uuid references public.categories(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  base_price numeric(10,2) not null default 0 check (base_price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price >= 0),
  cost_price numeric(10,2) check (cost_price >= 0),
  currency text default 'TND',
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int default 5,
  is_active boolean default true,
  is_featured boolean default false,
  is_premium boolean default false,
  is_new boolean default false,
  is_best_seller boolean default false,
  is_limited boolean default false,
  is_exclusive boolean default false,
  sold_count int default 0,
  tags text[] default '{}',
  material text,
  main_image_url text,
  hover_image_url text,
  video_url text,
  meta_title jsonb,
  meta_description jsonb,
  meta_keywords text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
create index idx_products_category on public.products(category_id);
create index idx_products_collection on public.products(collection_id);
create index idx_products_slug on public.products(slug);
create index idx_products_active on public.products(is_active);
create index idx_products_tags on public.products using gin(tags);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  attributes jsonb default '{}',
  price numeric(10,2) check (price >= 0),
  compare_at_price numeric(10,2),
  stock int not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_variants_updated before update on public.product_variants
  for each row execute function public.set_updated_at();
create index idx_variants_product on public.product_variants(product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  url text not null,
  alt_translations jsonb default '{"fr":"","en":"","ar":""}',
  position int default 0,
  is_main boolean default false,
  created_at timestamptz default now()
);
create index idx_images_product on public.product_images(product_id);

create table public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  name text not null,
  value_translations jsonb default '{"fr":"","en":"","ar":""}',
  value_key text,
  hex_color text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ============ 4. GUIDES, AVIS, FAQ, LOOKBOOK, MEDIA ============
create table public.size_guides (
  id uuid primary key default gen_random_uuid(),
  scope_type text default 'category',
  category_id uuid references public.categories(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  title_translations jsonb default '{"fr":"","en":"","ar":""}',
  data jsonb default '[]',
  recommendations_translations jsonb default '{"fr":"","en":"","ar":""}',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  is_verified_purchase boolean default false,
  is_demo boolean default false,
  is_approved boolean default false,
  created_at timestamptz default now()
);
create index idx_reviews_product on public.reviews(product_id);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question_translations jsonb default '{"fr":"","en":"","ar":""}',
  answer_translations jsonb default '{"fr":"","en":"","ar":""}',
  category text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.lookbooks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_translations jsonb default '{"fr":"","en":"","ar":""}',
  description_translations jsonb default '{"fr":"","en":"","ar":""}',
  image_url text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  folder text not null default 'products',
  url text not null,
  thumbnail_url text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  alt_translations jsonb default '{"fr":"","en":"","ar":""}',
  title text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ============ 5. LIVRAISON, COMMANDES, STOCK ============
create table public.service_zones (
  id uuid primary key default gen_random_uuid(),
  name_translations jsonb default '{"fr":"","en":"","ar":""}',
  country text default 'TN',
  cities text[] default '{}',
  shipping_fee numeric(10,2) default 0,
  free_shipping_threshold numeric(10,2),
  estimated_delay_translations jsonb default '{"fr":"","en":"","ar":""}',
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text default 'percentage' check (type in ('percentage','fixed_amount')),
  value numeric(10,2) not null default 0,
  minimum_order_amount numeric(10,2),
  maximum_discount_amount numeric(10,2),
  start_at timestamptz,
  end_at timestamptz,
  usage_limit int,
  usage_count int default 0,
  usage_limit_per_customer int,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  status text default 'pending' check (status in ('pending','confirmed','preparing','shipped','delivered','cancelled','returned')),
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text,
  customer_phone text not null,
  customer_whatsapp text,
  country text default 'TN',
  city text,
  zone_name text,
  address text,
  address_complement text,
  order_comment text,
  subtotal numeric(10,2) not null default 0,
  discount_amount numeric(10,2) default 0,
  shipping_fee numeric(10,2) default 0,
  total numeric(10,2) not null default 0,
  currency text default 'TND',
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  shipping_zone_id uuid references public.service_zones(id) on delete set null,
  payment_method text default 'cod',
  payment_status text default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  whatsapp_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created on public.orders(created_at desc);

-- Section 46 : snapshot produit figé à la commande
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  product_sku text,
  variant_attributes jsonb default '{}',
  image_url text,
  unit_price numeric(10,2) not null default 0,
  discount_amount numeric(10,2) default 0,
  quantity int not null default 1 check (quantity > 0),
  total numeric(10,2) not null default 0
);
create index idx_order_items_order on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Section 73 : mouvements de stock
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  type text not null check (type in ('sale','purchase','adjustment','return','reservation','release')),
  quantity int not null,
  reason text,
  order_id uuid references public.orders(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index idx_stock_movements_product on public.stock_movements(product_id);

-- ============ 6. PROMOTIONS ============
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default 'percentage' check (type in ('percentage','fixed_amount')),
  value numeric(10,2) not null default 0,
  scope_type text default 'global' check (scope_type in ('global','product','category','collection')),
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete cascade,
  start_at timestamptz,
  end_at timestamptz,
  usage_limit int,
  usage_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============ 7. WISHLIST, PANIER, NEWSLETTER, CONTACT, SOCIAL ============
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_wishlists_updated before update on public.wishlists
  for each row execute function public.set_updated_at();

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  created_at timestamptz default now(),
  unique(wishlist_id, product_id, variant_id)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_token text,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_cart_updated before update on public.cart_items
  for each row execute function public.set_updated_at();

-- Section 93
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  language text default 'fr',
  consent boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  icon text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ============ 8. AUDIT LOG (section 97) ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);
create index idx_audit_user on public.audit_logs(user_id);
create index idx_audit_created on public.audit_logs(created_at desc);