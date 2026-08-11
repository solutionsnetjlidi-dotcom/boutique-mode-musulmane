# 🕌 Boutique E-commerce Premium — Mode Musulmane Féminine

Boutique e-commerce haut de gamme spécialisée dans la mode musulmane féminine
(hijabs, jilbabs, abayas, khimars, accessoires, prière) — design **Rose Nude Luxury**,
trilingue **FR / EN / AR** avec **RTL complet**.

> Created by **JLIDI NETWORK SOLUTIONS - OMARSOFT**

---

## ✨ Fonctionnalités

### Boutique (public)
- Homepage CMS pilotée par Supabase (sections activables/réordonnables)
- Catalogue avec filtres (catégorie, taille, couleur, prix, disponibilité, collection, matière, promo, premium), tri, pagination, recherche intelligente
- Fiches produits premium : galerie zoom, variantes couleur/taille, guide des tailles, avis, cross-sell, upsell
- Wishlist (locale visiteuse / fusion à la connexion)
- Quick View + Quick Add (sélecteur si variantes obligatoires)
- Panier + Mini Cart drawer + seuil livraison gratuite
- Checkout 3 étapes avec validation Zod client **et** serveur
- Paiement à la livraison + confirmation WhatsApp (V1)
- 10 thèmes interchangeables sans code
- Musique d'ambiance (ON/OFF, volume, préférence mémorisée)

### Admin (`/admin`)
- Login Supabase Auth + RBAC (`super_admin` / `admin` / `manager`)
- Dashboard statistiques (CA, commandes, panier moyen, best sellers, stock faible)
- CRUD produits (+ variantes dynamiques, duplication, archivage)
- Gestion du stock (ajustements + historique `stock_movements`)
- Gestion des commandes (timeline statuts, restock automatique)
- CMS homepage (sections, hero, annonces)
- Thèmes, langues, FAQ, avis (modération), Media Library, zones de livraison, promotions, coupons, musique, SEO, paramètres, WhatsApp Manager

### Sécurité
- **RLS activé sur les 35 tables**
- Prix / stock / totaux **recalculés côté serveur** (RPC `create_order`) — jamais contrôlés par le frontend
- Anti-survente (transactions + verrous `FOR UPDATE`)
- Audit logs (`audit_logs`) sur toutes les actions sensibles
- Aucune donnée sensible exposée côté client

---

## 🧰 Stack

| Couche | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide, React Router, React Hook Form, Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS, RPC) |
| Déploiement | Vercel (frontend) + Supabase (backend) |

---

## 📁 Architecture

src/
├── components/        # ui / common / admin / layout / cart / product / shop
├── pages/             # pages publiques + admin/
├── layouts/           # PublicLayout / AdminLayout
├── sections/          # sections homepage (Hero, Trending, FAQ…)
├── hooks/             # useSiteSettings / useCatalog / usePendingOrders
├── services/          # catalog / shop / admin-orders / admin-stats
├── lib/               # supabase / utils / audit / translations / format / wishlist / seo
├── types/             # database.types.ts
├── contexts/          # Auth / Theme / Language / Cart
└── styles/            # globals.css
supabase/
└── migrations/        # 00001 → 00007

---

## 🚀 Installation locale

### 1. Prérequis
- [Node.js LTS](https://nodejs.org) (v18+)
- [Git](https://git-scm.com)
- Compte [Supabase](https://supabase.com) (gratuit)

### 2. Base de données Supabase
1. Créez un projet sur Supabase (plan Free).
2. Ouvrez **SQL Editor** et exécutez les migrations **dans l'ordre** :
   - `supabase/migrations/00001_initial_schema.sql` — 35 tables + triggers + index
   - `supabase/migrations/00002_rls_rbac.sql` — RLS + rôles + helpers
   - `supabase/migrations/00003_demo_data.sql` — 30 produits, 10 catégories, 5 collections, FAQ, avis démo…
   - `supabase/migrations/00005_orders_checkout.sql` — RPC `create_order`, `validate_coupon`
   - `supabase/migrations/00006_orders_whatsapp_admin.sql` — RPC `set_order_status`
   - `supabase/migrations/00007_storage.sql` — bucket `media` + politiques

### 3. Créer votre compte SUPER ADMIN
1. Dans Supabase : **Authentication → Users → Add user** (email + mot de passe).
2. Dans **SQL Editor**, exécutez :
   ```sql
   update public.user_roles
   set role = 'super_admin'
   where user_id = 'VOTRE_UUID_UTILISATEUR';