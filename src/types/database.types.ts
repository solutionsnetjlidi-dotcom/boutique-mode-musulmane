/* ============================================================
 * TYPES SUPABASE — CONSOLIDÉS (toutes phases)
 * Régénération possible :
 *   npx supabase gen types typescript --project-id VOTRE_ID --schema public
 * ============================================================ */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Insert : champs requis uniquement, auto-champs (id, timestamps) optionnels */
type Ins<T, Req extends keyof T = never> = Pick<T, Req> &
  Partial<Omit<T, Req | 'id' | 'created_at' | 'updated_at'>>

/** Update : tout est optionnel */
type Upd<T> = Partial<T>

/* ============================================================
 * TABLES
 * ============================================================ */

export interface ProfilesRow {
  id: string; email: string | null; first_name: string | null; last_name: string | null
  phone: string | null; whatsapp: string | null; country: string | null; city: string | null
  zone: string | null; address: string | null; address_complement: string | null
  preferred_language: string; created_at: string; updated_at: string
}

export interface UserRoleRow {
  id: string; user_id: string; role: string; granted_by: string | null; created_at: string
}

export interface SiteSettingsRow {
  key: string; value: Json; description: string | null; updated_at: string
}

export interface ThemeRow {
  id: string; slug: string; name_translations: Json; colors: Json; typography: Json
  is_active: boolean; is_default: boolean; sort_order: number; created_at: string
}

export interface LanguageRow {
  code: string; name: string; native_name: string | null; flag: string | null
  is_rtl: boolean; is_active: boolean; is_default: boolean; sort_order: number; created_at: string
}

export interface NavItemRow {
  id: string; parent_id: string | null; label_translations: Json; url: string | null
  menu_location: string; is_mega_menu: boolean; sort_order: number; is_active: boolean; created_at: string
}

export interface AnnouncementRow {
  id: string; text_translations: Json; link_url: string | null; background_color: string | null
  text_color: string | null; start_at: string | null; end_at: string | null
  is_active: boolean; sort_order: number; created_at: string
}

export interface HeroRow {
  id: string; title_translations: Json; subtitle_translations: Json
  image_desktop: string | null; image_mobile: string | null
  cta_label_translations: Json; cta_url: string | null
  cta_secondary_label_translations: Json; cta_secondary_url: string | null
  is_slider: boolean; is_active: boolean; sort_order: number; created_at: string
}

export interface HomepageSectionRow {
  id: string; section_key: string; title_translations: Json; config: Json
  is_active: boolean; sort_order: number; updated_at: string
}

export interface CategoryRow {
  id: string; parent_id: string | null; slug: string; sku: string | null
  name_translations: Json; description_translations: Json
  image_url: string | null; banner_url: string | null; icon: string | null
  meta_title: Json; meta_description: Json
  is_active: boolean; sort_order: number; created_at: string; updated_at: string
}

export interface CollectionRow {
  id: string; slug: string; name_translations: Json; description_translations: Json
  image_url: string | null; banner_url: string | null
  start_at: string | null; end_at: string | null
  is_active: boolean; sort_order: number; created_at: string; updated_at: string
}

export interface ProductRow {
  id: string; slug: string; sku: string | null
  name_translations: Json; short_description_translations: Json; description_translations: Json
  category_id: string | null; collection_id: string | null
  base_price: number; compare_at_price: number | null; cost_price: number | null; currency: string
  stock: number; low_stock_threshold: number
  is_active: boolean; is_featured: boolean; is_premium: boolean; is_new: boolean
  is_best_seller: boolean; is_limited: boolean; is_exclusive: boolean
  sold_count: number; tags: string[]; material: string | null
  main_image_url: string | null; hover_image_url: string | null; video_url: string | null
  meta_title: Json; meta_description: Json; meta_keywords: string[] | null
  sort_order: number; created_at: string; updated_at: string
}

export interface VariantRow {
  id: string; product_id: string; sku: string | null; attributes: Json
  price: number | null; compare_at_price: number | null; stock: number
  image_url: string | null; is_active: boolean; sort_order: number
  created_at: string; updated_at: string
}

export interface ProductImageRow {
  id: string; product_id: string; variant_id: string | null; url: string
  alt_translations: Json; position: number; is_main: boolean; created_at: string
}

export interface ProductAttributeRow {
  id: string; product_id: string; name: string; value_translations: Json
  value_key: string; hex_color: string | null; sort_order: number; created_at: string
}

export interface SizeGuideRow {
  id: string; scope_type: string; category_id: string | null; product_id: string | null
  title_translations: Json; data: Json; recommendations_translations: Json
  is_active: boolean; created_at: string
}

export interface ReviewRow {
  id: string; product_id: string; user_id: string | null; author_name: string
  rating: number; title: string | null; comment: string | null
  is_verified_purchase: boolean; is_demo: boolean; is_approved: boolean; created_at: string
}

export interface FaqRow {
  id: string; question_translations: Json; answer_translations: Json
  category: string | null; is_active: boolean; sort_order: number; created_at: string
}

export interface LookbookRow {
  id: string; slug: string; title_translations: Json; description_translations: Json
  image_url: string | null; is_active: boolean; sort_order: number; created_at: string
}

export interface LookbookProductRow {
  lookbook_id: string; product_id: string; sort_order: number
}

export interface MediaRow {
  id: string; folder: string; url: string; thumbnail_url: string | null
  file_name: string | null; mime_type: string | null; size_bytes: number | null
  alt_translations: Json; title: string | null; uploaded_by: string | null; created_at: string
}

export interface ServiceZoneRow {
  id: string; name_translations: Json; country: string; cities: string[] | null
  shipping_fee: number; free_shipping_threshold: number | null
  estimated_delay_translations: Json; is_active: boolean; sort_order: number; created_at: string
}

export interface OrderRow {
  id: string; order_number: string; user_id: string | null; status: string
  customer_first_name: string; customer_last_name: string; customer_email: string | null
  customer_phone: string; customer_whatsapp: string | null
  country: string; city: string | null; zone_name: string | null
  address: string | null; address_complement: string | null; order_comment: string | null
  subtotal: number; discount_amount: number; shipping_fee: number; total: number; currency: string
  coupon_id: string | null; coupon_code: string | null; shipping_zone_id: string | null
  payment_method: string; payment_status: string
  whatsapp_confirmed: boolean; created_at: string; updated_at: string
}

export interface OrderItemRow {
  id: string; order_id: string; product_id: string | null; variant_id: string | null
  product_name: string; product_sku: string | null; variant_attributes: Json
  image_url: string | null; unit_price: number; discount_amount: number
  quantity: number; total: number
}

export interface OrderStatusHistoryRow {
  id: string; order_id: string; from_status: string | null; to_status: string
  note: string | null; changed_by: string | null; created_at: string
}

export interface StockMovementRow {
  id: string; product_id: string; variant_id: string | null; type: string
  quantity: number; reason: string | null; order_id: string | null
  created_by: string | null; created_at: string
}

export interface PromotionRow {
  id: string; name: string; type: string; value: number; scope_type: string
  product_id: string | null; category_id: string | null; collection_id: string | null
  start_at: string | null; end_at: string | null
  usage_limit: number | null; usage_count: number; is_active: boolean; created_at: string
}

export interface CouponRow {
  id: string; code: string; type: string; value: number
  minimum_order_amount: number | null; maximum_discount_amount: number | null
  start_at: string | null; end_at: string | null
  usage_limit: number | null; usage_count: number; usage_limit_per_customer: number | null
  is_active: boolean; created_at: string
}

export interface WishlistRow {
  id: string; user_id: string; session_token: string | null
  created_at: string; updated_at: string
}

export interface WishlistItemRow {
  id: string; wishlist_id: string; product_id: string; variant_id: string | null; created_at: string
}

export interface CartItemRow {
  id: string; user_id: string | null; session_token: string | null
  product_id: string; variant_id: string | null; quantity: number
  created_at: string; updated_at: string
}

export interface NewsletterSubscriberRow {
  id: string; email: string; language: string; consent: boolean
  is_active: boolean; created_at: string
}

export interface ContactMessageRow {
  id: string; name: string; email: string; phone: string | null
  subject: string | null; message: string; is_read: boolean; created_at: string
}

export interface SocialLinkRow {
  id: string; platform: string; url: string; icon: string | null
  is_active: boolean; sort_order: number
}

export interface AuditLogRow {
  id: string; user_id: string | null; action: string; entity_type: string | null
  entity_id: string | null; old_values: Json; new_values: Json
  ip_address: string | null; user_agent: string | null; created_at: string
}

/* ============================================================
 * HELPERS MÉTIER
 * ============================================================ */

/** Produit avec ses variantes jointes (utilisé partout dans le catalogue) */
export type ProductWithVariants = ProductRow & { product_variants: VariantRow[] }

/* ============================================================
 * DATABASE
 * ============================================================ */

type T<R, I, U> = { Row: R; Insert: I; Update: U }

export type Database = {
  public: {
    Tables: {
      profiles: T<ProfilesRow, Ins<ProfilesRow, 'id'>, Upd<ProfilesRow>>
      user_roles: T<UserRoleRow, Ins<UserRoleRow, 'user_id'>, Upd<UserRoleRow>>
      site_settings: T<SiteSettingsRow, Ins<SiteSettingsRow, 'key'>, Upd<SiteSettingsRow>>
      themes: T<ThemeRow, Ins<ThemeRow, 'slug' | 'colors'>, Upd<ThemeRow>>
      languages: T<LanguageRow, Ins<LanguageRow, 'code' | 'name'>, Upd<LanguageRow>>
      navigation_items: T<NavItemRow, Ins<NavItemRow>, Upd<NavItemRow>>
      announcement_bars: T<AnnouncementRow, Ins<AnnouncementRow>, Upd<AnnouncementRow>>
      hero_sections: T<HeroRow, Ins<HeroRow>, Upd<HeroRow>>
      homepage_sections: T<HomepageSectionRow, Ins<HomepageSectionRow, 'section_key'>, Upd<HomepageSectionRow>>
      categories: T<CategoryRow, Ins<CategoryRow, 'slug'>, Upd<CategoryRow>>
      collections: T<CollectionRow, Ins<CollectionRow, 'slug'>, Upd<CollectionRow>>
      products: T<ProductRow, Ins<ProductRow, 'slug'>, Upd<ProductRow>>
      product_variants: T<VariantRow, Ins<VariantRow, 'product_id'>, Upd<VariantRow>>
      product_images: T<ProductImageRow, Ins<ProductImageRow, 'product_id' | 'url'>, Upd<ProductImageRow>>
      product_attributes: T<ProductAttributeRow, Ins<ProductAttributeRow, 'product_id' | 'name' | 'value_key'>, Upd<ProductAttributeRow>>
      size_guides: T<SizeGuideRow, Ins<SizeGuideRow>, Upd<SizeGuideRow>>
      reviews: T<ReviewRow, Ins<ReviewRow, 'product_id' | 'author_name' | 'rating'>, Upd<ReviewRow>>
      faqs: T<FaqRow, Ins<FaqRow>, Upd<FaqRow>>
      lookbooks: T<LookbookRow, Ins<LookbookRow, 'slug'>, Upd<LookbookRow>>
      lookbook_products: T<LookbookProductRow, Ins<LookbookProductRow, 'lookbook_id' | 'product_id'>, Upd<LookbookProductRow>>
      media: T<MediaRow, Ins<MediaRow, 'url'>, Upd<MediaRow>>
      service_zones: T<ServiceZoneRow, Ins<ServiceZoneRow>, Upd<ServiceZoneRow>>
      orders: T<OrderRow, Ins<OrderRow, 'order_number' | 'customer_first_name' | 'customer_last_name' | 'customer_phone'>, Upd<OrderRow>>
      order_items: T<OrderItemRow, Ins<OrderItemRow, 'order_id' | 'product_name' | 'unit_price' | 'quantity' | 'total'>, Upd<OrderItemRow>>
      order_status_history: T<OrderStatusHistoryRow, Ins<OrderStatusHistoryRow, 'order_id' | 'to_status'>, Upd<OrderStatusHistoryRow>>
      stock_movements: T<StockMovementRow, Ins<StockMovementRow, 'product_id' | 'type' | 'quantity'>, Upd<StockMovementRow>>
      promotions: T<PromotionRow, Ins<PromotionRow, 'name' | 'type' | 'value'>, Upd<PromotionRow>>
      coupons: T<CouponRow, Ins<CouponRow, 'code' | 'type' | 'value'>, Upd<CouponRow>>
      wishlists: T<WishlistRow, Ins<WishlistRow, 'user_id'>, Upd<WishlistRow>>
      wishlist_items: T<WishlistItemRow, Ins<WishlistItemRow, 'wishlist_id' | 'product_id'>, Upd<WishlistItemRow>>
      cart_items: T<CartItemRow, Ins<CartItemRow, 'product_id'>, Upd<CartItemRow>>
      newsletter_subscribers: T<NewsletterSubscriberRow, Ins<NewsletterSubscriberRow, 'email'>, Upd<NewsletterSubscriberRow>>
      contact_messages: T<ContactMessageRow, Ins<ContactMessageRow, 'name' | 'email' | 'message'>, Upd<ContactMessageRow>>
      social_links: T<SocialLinkRow, Ins<SocialLinkRow, 'platform' | 'url'>, Upd<SocialLinkRow>>
      audit_logs: T<AuditLogRow, Ins<AuditLogRow, 'action'>, Upd<AuditLogRow>>
    }
    Views: { [_ in never]: never }
    Functions: {
      create_order: {
        Args: {
          p_customer: Json
          p_items: Json
          p_shipping_zone_id: string
          p_coupon_code?: string | null
          p_comment?: string | null
        }
        Returns: Json
      }
      validate_coupon: {
        Args: { p_code: string; p_subtotal: number }
        Returns: Json
      }
      set_order_status: {
        Args: { p_order_id: string; p_status: string; p_note?: string | null }
        Returns: Json
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}