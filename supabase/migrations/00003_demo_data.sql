-- ============================================================
-- 00003 — DONNÉES DE DÉMONSTRATION (section 87)
-- 30 produits : 8 hijab / 5 jilbab / 5 abaya / 4 khimar / 4 accessoires / 4 prière
-- ============================================================

-- ===== LANGUES (section 60) =====
insert into public.languages (code, name, native_name, flag, is_rtl, is_active, is_default, sort_order) values
('fr','French','Français','🇫🇷',false,true,true,1),
('en','English','English','🇬🇧',false,true,false,2),
('ar','Arabic','العربية','🇸🇦',true,true,false,3);

-- ===== 10 THÈMES (section 59) =====
insert into public.themes (slug, name_translations, colors, is_default, sort_order) values
('rose-nude-luxury','{"fr":"Rose Nude Luxury","en":"Rose Nude Luxury","ar":"وردي فاخر"}',
 '{"primary":"#C8A2A0","accent":"#B76E79","background":"#FBF7F4","card":"#FFFFFF","text":"#3D2C2C","muted":"#8A7370","border":"#EADFD8","badge":"#B76E79","header":"#FBF7F4","footer":"#3D2C2C","button":"#B76E79"}', true, 1),
('beige-modest-luxury','{"fr":"Beige Modest Luxury","en":"Beige Modest Luxury","ar":"بيج محتشم"}',
 '{"primary":"#C9B69A","accent":"#A98F6E","background":"#FAF6F0","card":"#FFFFFF","text":"#3A322A","muted":"#8C7F70","border":"#EADFCF","badge":"#A98F6E","header":"#FAF6F0","footer":"#3A322A","button":"#A98F6E"}', false, 2),
('black-champagne','{"fr":"Black Champagne","en":"Black Champagne","ar":"أسود شامبين"}',
 '{"primary":"#1C1A1A","accent":"#C6A664","background":"#F7F4EE","card":"#FFFFFF","text":"#1C1A1A","muted":"#6E6A63","border":"#E4DECE","badge":"#C6A664","header":"#F7F4EE","footer":"#1C1A1A","button":"#1C1A1A"}', false, 3),
('terracotta-elegance','{"fr":"Terracotta Elegance","en":"Terracotta Elegance","ar":"تراكوتا أنيق"}',
 '{"primary":"#B5654A","accent":"#9C4F35","background":"#FBF4F0","card":"#FFFFFF","text":"#3C2A24","muted":"#8A6F63","border":"#EBD9CF","badge":"#9C4F35","header":"#FBF4F0","footer":"#3C2A24","button":"#B5654A"}', false, 4),
('emerald-luxury','{"fr":"Emerald Luxury","en":"Emerald Luxury","ar":"زمردي فاخر"}',
 '{"primary":"#2F6B4F","accent":"#1F4D38","background":"#F4F8F5","card":"#FFFFFF","text":"#1E2B25","muted":"#67776E","border":"#DBE7DF","badge":"#2F6B4F","header":"#F4F8F5","footer":"#1E2B25","button":"#2F6B4F"}', false, 5),
('burgundy-royal','{"fr":"Burgundy Royal","en":"Burgundy Royal","ar":"بورجوندي ملكي"}',
 '{"primary":"#6D2233","accent":"#521826","background":"#FAF3F5","card":"#FFFFFF","text":"#2E1A20","muted":"#7E666C","border":"#E9D8DC","badge":"#6D2233","header":"#FAF3F5","footer":"#2E1A20","button":"#6D2233"}', false, 6),
('lavender-feminine','{"fr":"Lavender Feminine","en":"Lavender Feminine","ar":"لافندر أنثوي"}',
 '{"primary":"#9C86B8","accent":"#7E67A0","background":"#F8F5FB","card":"#FFFFFF","text":"#332B3D","muted":"#7C7188","border":"#E6DEF0","badge":"#7E67A0","header":"#F8F5FB","footer":"#332B3D","button":"#9C86B8"}', false, 7),
('chocolate-cream','{"fr":"Chocolate Cream","en":"Chocolate Cream","ar":"شوكولاتة وكريم"}',
 '{"primary":"#6B4A3B","accent":"#4E352A","background":"#FAF5F0","card":"#FFFFFF","text":"#2E211B","muted":"#7E6E63","border":"#E8DCCF","badge":"#6B4A3B","header":"#FAF5F0","footer":"#2E211B","button":"#6B4A3B"}', false, 8),
('sage-modest','{"fr":"Sage Modest","en":"Sage Modest","ar":"مريمي محتشم"}',
 '{"primary":"#8A9B84","accent":"#6C7F66","background":"#F6F8F4","card":"#FFFFFF","text":"#2A302A","muted":"#6F7A6B","border":"#DEE5DA","badge":"#6C7F66","header":"#F6F8F4","footer":"#2A302A","button":"#8A9B84"}', false, 9),
('pearl-white-luxury','{"fr":"Pearl White Luxury","en":"Pearl White Luxury","ar":"لؤلؤي فاخر"}',
 '{"primary":"#B9B2A6","accent":"#9A9184","background":"#FDFCFA","card":"#FFFFFF","text":"#35322D","muted":"#837F76","border":"#ECE8E0","badge":"#9A9184","header":"#FDFCFA","footer":"#35322D","button":"#B9B2A6"}', false, 10);

-- ===== 10 CATÉGORIES =====
insert into public.categories (slug, name_translations, description_translations, image_url, sort_order) values
('hijab','{"fr":"Hijab","en":"Hijab","ar":"حجاب"}','{"fr":"Hijabs premium en soie, mousseline et jersey.","en":"Premium silk, chiffon and jersey hijabs.","ar":"حجابات فاخرة من الحرير والموسلين والجيرسي."}','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',1),
('jilbab','{"fr":"Jilbab","en":"Jilbab","ar":"جلباب"}','{"fr":"Jilbabs élégants et confortables.","en":"Elegant and comfortable jilbabs.","ar":"جلابيبت أنيقة ومريحة."}','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800',2),
('khimar','{"fr":"Khimar","en":"Khimar","ar":"خمار"}','{"fr":"Khimars fluides et raffinés.","en":"Fluid and refined khimars.","ar":"خمرات انسيابية وراقية."}','https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',3),
('abaya','{"fr":"Abaya","en":"Abaya","ar":"عباية"}','{"fr":"Abayas modernes et élégantes.","en":"Modern and elegant abayas.","ar":"عبايات عصرية وأنيقة."}','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',4),
('robes-modestes','{"fr":"Robes modestes","en":"Modest dresses","ar":"فساتين محتشمة"}','{"fr":"Robes longues élégantes et pudiques.","en":"Elegant, modest long dresses.","ar":"فساتين طويلة أنيقة ومحتشمة."}','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',5),
('ensembles','{"fr":"Ensembles","en":"Sets","ar":"أطقم"}','{"fr":"Ensembles coordonnés.","en":"Coordinated sets.","ar":"أطقم متناسقة."}','https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800',6),
('accessoires','{"fr":"Accessoires","en":"Accessories","ar":"إكسسوارات"}','{"fr":"Broches, aimants, épingles et sacs.","en":"Brooches, magnets, pins and bags.","ar":"براوش ومغناطيس ودبابيس وحقائب."}','https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',7),
('sous-hijab','{"fr":"Sous-hijab","en":"Under hijab","ar":"بندانة"}','{"fr":"Bonnets et sous-hijabs confortables.","en":"Comfortable under hijabs.","ar":"بندانة مريحة."}','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',8),
('tapis-priere','{"fr":"Tapis de prière","en":"Prayer mats","ar":"سجاد صلاة"}','{"fr":"Tapis de prière premium et de voyage.","en":"Premium and travel prayer mats.","ar":"سجاد صلاة فاخر وللسفر."}','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800',9),
('coffrets','{"fr":"Coffrets cadeaux","en":"Gift boxes","ar":"علب هدايا"}','{"fr":"Coffrets élégants à offrir.","en":"Elegant gift boxes.","ar":"علب هدايا أنيقة."}','https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',10);

-- ===== 5 COLLECTIONS =====
insert into public.collections (slug, name_translations, description_translations, image_url, banner_url, sort_order) values
('premium','{"fr":"Collection Premium","en":"Premium Collection","ar":"التشكيلة الفاخرة"}','{"fr":"Nos pièces les plus raffinées.","en":"Our most refined pieces.","ar":"أرقى قطعنا."}','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1600',1),
('ramadan','{"fr":"Collection Ramadan","en":"Ramadan Collection","ar":"تشكيلة رمضان"}','{"fr":"Une sélection pensée pour vos moments précieux.","en":"A selection for your precious moments.","ar":"تشكيلة مختارة لأجمل لحظاتكم."}','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1200','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1600',2),
('eid','{"fr":"Collection Eid","en":"Eid Collection","ar":"تشكيلة العيد"}','{"fr":"Élégance, pudeur et raffinement.","en":"Elegance, modesty and refinement.","ar":"أناقة وحشمة ورقي."}','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1600',3),
('priere','{"fr":"Collection Prière","en":"Prayer Collection","ar":"تشكيلة الصلاة"}','{"fr":"Tapis, tasbih et coffrets de prière.","en":"Prayer mats, tasbih and gift boxes.","ar":"سجاد ومسبحات وعلب صلاة."}','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1200','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1600',4),
('cadeaux','{"fr":"Collection Cadeaux","en":"Gift Collection","ar":"تشكيلة الهدايا"}','{"fr":"Des cadeaux élégants et utiles.","en":"Elegant and useful gifts.","ar":"هدايا أنيقة ومفيدة."}','https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1200','https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1600',5);

-- ===== 30 PRODUITS (noms originaux, section 88) =====
insert into public.products (slug, sku, name_translations, short_description_translations, category_id, collection_id, base_price, compare_at_price, stock, low_stock_threshold, is_active, is_featured, is_premium, is_new, is_best_seller, is_limited, tags, material, main_image_url, hover_image_url, sort_order) values
-- 8 HIJAB
('nude-silk-touch','HJB-001','{"fr":"Nude Silk Touch","en":"Nude Silk Touch","ar":"حرير نيود"}','{"fr":"Hijab en soie premium, toucher exceptionnel.","en":"Premium silk hijab, exceptional feel.","ar":"حجاب حرير فاخر بملمس استثنائي."}',(select id from categories where slug='hijab'),(select id from collections where slug='premium'),49.90,59.90,42,5,true,true,true,false,true,false,'{Premium,Bestseller,Soft}','Soie','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800&sat=-100',1),
('rose-veil','HJB-002','{"fr":"Rose Veil","en":"Rose Veil","ar":"حجاب وردي"}','{"fr":"Hijab rose poudré, élégance discrète.","en":"Dusty rose hijab, subtle elegance.","ar":"حجاب وردي هادئ بأناقة راقية."}',(select id from categories where slug='hijab'),null,39.90,null,35,5,true,true,false,true,false,false,'{New,Soft,Elegant}','Mousseline','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',2),
('pearl-chiffon','HJB-003','{"fr":"Pearl Chiffon","en":"Pearl Chiffon","ar":"شيفون لؤلؤي"}','{"fr":"Hijab en mousseline nacrée.","en":"Pearlescent chiffon hijab.","ar":"حجاب موسلين لؤلؤي."}',(select id from categories where slug='hijab'),(select id from collections where slug='eid'),44.90,null,28,5,true,false,true,false,false,false,'{Premium,Elegant}','Mousseline','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',null,3),
('soft-mocha','HJB-004','{"fr":"Soft Mocha","en":"Soft Mocha","ar":"موكا ناعم"}','{"fr":"Hijab jersey doux, couleur moka.","en":"Soft jersey hijab, mocha colour.","ar":"حجاب جيرسي ناعم بلون الموكا."}',(select id from categories where slug='hijab'),null,34.90,42.90,50,5,true,true,false,false,true,false,'{Bestseller,Soft}','Jersey','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',null,4),
('ivoire-satin','HJB-005','{"fr":"Ivoire Satin","en":"Ivory Satin","ar":"ساتان عاجي"}','{"fr":"Hijab satin ivoire lumineux.","en":"Bright ivory satin hijab.","ar":"حجاب ساتان عاجي مضيء."}',(select id from categories where slug='hijab'),(select id from collections where slug='eid'),47.90,null,22,5,true,false,true,true,false,true,'{Premium,Limited}','Satin','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',null,5),
('crepe-nude','HJB-006','{"fr":"Crêpe Nude","en":"Nude Crepe","ar":"كريب نيود"}','{"fr":"Hijab en crêpe fluide.","en":"Fluid crepe hijab.","ar":"حجاب كريب انسيابي."}',(select id from categories where slug='hijab'),null,37.90,null,30,5,true,false,false,false,false,false,'{Modest,Elegant}','Crêpe','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',null,6),
('modal-rose','HJB-007','{"fr":"Modal Rose","en":"Rose Modal","ar":"مودال وردي"}','{"fr":"Hijab modal ultra-doux.","en":"Ultra-soft modal hijab.","ar":"حجاب مودال فائق النعومة."}',(select id from categories where slug='hijab'),null,32.90,null,45,5,true,false,false,true,false,false,'{New,Soft}','Modal','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',null,7),
('perle-blanc','HJB-008','{"fr":"Perle Blanc","en":"White Pearl","ar":"لؤلؤة بيضاء"}','{"fr":"Hijab blanc perle, intemporel.","en":"Pearl white hijab, timeless.","ar":"حجاب أبيض لؤلؤي خالد."}',(select id from categories where slug='hijab'),null,41.90,null,0,5,true,false,false,false,false,false,'{Elegant,Modest}','Soie','https://images.unsplash.com/photo-1611042553365-9b101441c135?w=800',null,8),
-- 5 JILBAB
('jilbab-elegance','JLB-001','{"fr":"Jilbab Élégance","en":"Elegance Jilbab","ar":"جلباب الأناقة"}','{"fr":"Jilbab deux pièces, coupe élégante.","en":"Two-piece jilbab, elegant cut.","ar":"جلباب قطعتين بقصّة أنيقة."}',(select id from categories where slug='jilbab'),(select id from collections where slug='premium'),129.90,149.90,18,3,true,true,true,false,true,false,'{Premium,Bestseller}','Crêpe','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800',null,9),
('jilbab-sienna','JLB-002','{"fr":"Jilbab Sienna","en":"Sienna Jilbab","ar":"جلباب سيينا"}','{"fr":"Jilbab terracotta chaleureux.","en":"Warm terracotta jilbab.","ar":"جلباب تراكوتا دافئ."}',(select id from categories where slug='jilbab'),null,119.90,null,15,3,true,true,false,false,false,false,'{Elegant,Modest}','Crêpe','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800',null,10),
('jilbab-pearl','JLB-003','{"fr":"Jilbab Pearl","en":"Pearl Jilbab","ar":"جلباب اللؤلؤة"}','{"fr":"Jilbab nacré raffiné.","en":"Refined pearlescent jilbab.","ar":"جلباب لؤلؤي راقٍ."}',(select id from categories where slug='jilbab'),(select id from collections where slug='eid'),139.90,null,12,3,true,false,true,false,false,true,'{Premium,Limited}','Satin','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800',null,11),
('jilbab-royal-bordeaux','JLB-004','{"fr":"Jilbab Royal Bordeaux","en":"Royal Bordeaux Jilbab","ar":"جلباب بوردو ملكي"}','{"fr":"Jilbab bordeaux profond.","en":"Deep bordeaux jilbab.","ar":"جلباب بوردو عميق."}',(select id from categories where slug='jilbab'),(select id from collections where slug='ramadan'),134.90,null,14,3,true,false,false,true,false,false,'{New,Elegant}','Crêpe','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800',null,12),
('jilbab-confort-taupe','JLB-005','{"fr":"Jilbab Confort Taupe","en":"Comfort Taupe Jilbab","ar":"جلباب توبي مريح"}','{"fr":"Jilbab taupe confortable.","en":"Comfortable taupe jilbab.","ar":"جلباب توبي مريح."}',(select id from categories where slug='jilbab'),null,109.90,null,20,3,true,false,false,false,false,false,'{Soft,Modest}','Jersey','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800',null,13),
-- 5 ABAYA
('abaya-noor','ABY-001','{"fr":"Abaya Noor","en":"Noor Abaya","ar":"عباية نور"}','{"fr":"Abaya moderne, lumière et fluidité.","en":"Modern abaya, light and fluid.","ar":"عباية عصرية مضيئة وانسيابية."}',(select id from categories where slug='abaya'),(select id from collections where slug='premium'),159.90,179.90,16,3,true,true,true,false,true,false,'{Premium,Bestseller}','Crêpe','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',null,14),
('abaya-lunea','ABY-002','{"fr":"Abaya Lunea","en":"Lunea Abaya","ar":"عباية لونيا"}','{"fr":"Abaya fluide et élégante.","en":"Fluid and elegant abaya.","ar":"عباية انسيابية أنيقة."}',(select id from categories where slug='abaya'),(select id from collections where slug='ramadan'),145.90,null,14,3,true,true,false,false,false,false,'{Elegant,Modest}','Crêpe','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',null,15),
('abaya-emeraude','ABY-003','{"fr":"Abaya Émeraude","en":"Emerald Abaya","ar":"عباية زمرّدية"}','{"fr":"Abaya émeraude somptueuse.","en":"Sumptuous emerald abaya.","ar":"عباية زمرّدية فاخرة."}',(select id from categories where slug='abaya'),(select id from collections where slug='premium'),169.90,null,10,3,true,false,true,false,false,true,'{Premium,Limited}','Satin','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',null,16),
('abaya-rose-signature','ABY-004','{"fr":"Abaya Rose Signature","en":"Signature Rose Abaya","ar":"عباية الوردة"}','{"fr":"Abaya rose signature de la maison.","en":"House signature rose abaya.","ar":"عباية وردية مميزة."}',(select id from categories where slug='abaya'),(select id from collections where slug='eid'),155.90,null,13,3,true,true,false,true,false,false,'{New,Elegant}','Crêpe','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',null,17),
('abaya-ivoire-prestige','ABY-005','{"fr":"Abaya Ivoire Prestige","en":"Prestige Ivory Abaya","ar":"عباية العاج"}','{"fr":"Abaya ivoire prestige.","en":"Prestige ivory abaya.","ar":"عباية عاجية فاخرة."}',(select id from categories where slug='abaya'),null,179.90,199.90,3,3,true,false,true,false,false,false,'{Premium,Elegant}','Satin','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',null,18),
-- 4 KHIMAR
('khimar-grace','KHM-001','{"fr":"Khimar Grace","en":"Grace Khimar","ar":"خمار غرايس"}','{"fr":"Khimar fluide et gracieux.","en":"Fluid and graceful khimar.","ar":"خمار انسيابي رشيق."}',(select id from categories where slug='khimar'),null,59.90,null,25,5,true,true,false,false,true,false,'{Bestseller,Modest}','Mousseline','https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',null,19),
('khimar-soft-flow','KHM-002','{"fr":"Khimar Soft Flow","en":"Soft Flow Khimar","ar":"خمار انسيابي ناعم"}','{"fr":"Khimar doux et aérien.","en":"Soft and airy khimar.","ar":"خمار ناعم وخفيف."}',(select id from categories where slug='khimar'),null,54.90,null,28,5,true,false,false,true,false,false,'{New,Soft}','Mousseline','https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',null,20),
('khimar-premium-nude','KHM-003','{"fr":"Khimar Premium Nude","en":"Premium Nude Khimar","ar":"خمار نيود فاخر"}','{"fr":"Khimar nude premium.","en":"Premium nude khimar.","ar":"خمار نيود فاخر."}',(select id from categories where slug='khimar'),(select id from collections where slug='premium'),69.90,null,18,5,true,false,true,false,false,false,'{Premium}','Soie','https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',null,21),
('khimar-elegance-bordeaux','KHM-004','{"fr":"Khimar Élégance Bordeaux","en":"Bordeaux Elegance Khimar","ar":"خمار بوردو أنيق"}','{"fr":"Khimar bordeaux élégant.","en":"Elegant bordeaux khimar.","ar":"خمار بوردو أنيق."}',(select id from categories where slug='khimar'),(select id from collections where slug='ramadan'),64.90,null,20,5,true,false,false,false,false,false,'{Elegant}','Crêpe','https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',null,22),
-- 4 ACCESSOIRES
('broche-perle-doree','ACC-001','{"fr":"Broche Perle Dorée","en":"Golden Pearl Brooch","ar":"بروش لؤلؤة ذهبية"}','{"fr":"Broche perle élégante.","en":"Elegant pearl brooch.","ar":"بروش لؤلؤة أنيق."}',(select id from categories where slug='accessoires'),(select id from collections where slug='cadeaux'),24.90,null,40,5,true,true,false,false,false,false,'{Gift,Elegant}','Métal doré','https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',null,23),
('aimants-hijab-luxe','ACC-002','{"fr":"Aimants Hijab Luxe (x6)","en":"Luxury Hijab Magnets (x6)","ar":"مغناطيس حجاب فاخر"}','{"fr":"Aimants puissants sans épingle.","en":"Strong magnets, no pins.","ar":"مغناطيس قوي بدون دبابيس."}',(select id from categories where slug='accessoires'),null,19.90,null,60,5,true,true,false,false,true,false,'{Bestseller}','Aimant','https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',null,24),
('epingles-or-rose','ACC-003','{"fr":"Épingles Or Rose (x10)","en":"Rose Gold Pins (x10)","ar":"دبابيس ذهب وردي"}','{"fr":"Épingles fines or rose.","en":"Fine rose gold pins.","ar":"دبابيس رفيعة ذهب وردي."}',(select id from categories where slug='accessoires'),null,14.90,null,0,5,true,false,false,false,false,false,'{Elegant}','Métal','https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',null,25),
('sac-elegance-nude','ACC-004','{"fr":"Sac Élégance Nude","en":"Nude Elegance Bag","ar":"حقيبة نيود أنيقة"}','{"fr":"Sac à main nude raffiné.","en":"Refined nude handbag.","ar":"حقيبة يد نيود راقية."}',(select id from categories where slug='accessoires'),(select id from collections where slug='cadeaux'),89.90,null,12,3,true,false,true,true,false,false,'{New,Premium}','Cuir végan','https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',null,26),
-- 4 PRIÈRE
('prayer-pearl-velvet','PRY-001','{"fr":"Prayer Pearl Velvet","en":"Pearl Velvet Prayer Mat","ar":"سجادة مخملية لؤلؤية"}','{"fr":"Tapis de prière velours premium.","en":"Premium velvet prayer mat.","ar":"سجادة صلاة مخملية فاخرة."}',(select id from categories where slug='tapis-priere'),(select id from collections where slug='priere'),69.90,null,22,3,true,true,true,false,true,false,'{Prayer,Bestseller,Premium}','Velours','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800',null,27),
('noor-rose-serenity','PRY-002','{"fr":"Noor Rose Serenity","en":"Noor Rose Serenity","ar":"نور وردي هادئ"}','{"fr":"Tapis de prière rose doux.","en":"Soft rose prayer mat.","ar":"سجادة صلاة وردية ناعمة."}',(select id from categories where slug='tapis-priere'),(select id from collections where slug='priere'),79.90,null,18,3,true,false,true,false,false,false,'{Prayer,Premium}','Velours','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800',null,28),
('coffret-priere-complet','PRY-003','{"fr":"Coffret Prière Complet","en":"Complete Prayer Gift Box","ar":"علبة صلاة كاملة"}','{"fr":"Tapis + tasbih + housse.","en":"Mat + tasbih + cover.","ar":"سجادة + مسبحة + غلاف."}',(select id from categories where slug='tapis-priere'),(select id from collections where slug='priere'),119.90,null,10,3,true,false,false,false,false,false,'{Prayer,Gift}','Velours','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800',null,29),
('tapis-voyage-creme','PRY-004','{"fr":"Tapis Voyage Crème","en":"Cream Travel Mat","ar":"سجادة سفر كريمية"}','{"fr":"Tapis de voyage compact.","en":"Compact travel mat.","ar":"سجادة سفر مدمجة."}',(select id from categories where slug='tapis-priere'),null,39.90,49.90,30,5,true,false,false,false,false,false,'{Prayer}','Polyester','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800',null,30);

-- ===== VARIANTES (couleurs + tailles, sections 34, 89) =====
insert into public.product_variants (product_id, sku, attributes, price, stock, sort_order)
select p.id, p.sku || '-' || v.code, jsonb_build_object('color', v.name, 'hex', v.hex, 'size', v.size), null, v.stock, v.sort
from public.products p
cross join (values
  ('NUDE','Nude','#D8B4A0','Standard',12,1),
  ('BEIGE','Beige','#E5D5C0','Standard',10,2),
  ('NOIR','Noir','#2B2B2B','Standard',10,3),
  ('ROSE','Rose Poudré','#E8C4C8','Standard',10,4)
) v(code, name, hex, size, stock, sort)
where p.sku like 'HJB-%';

insert into public.product_variants (product_id, sku, attributes, price, stock, sort_order)
select p.id, p.sku || '-' || v.code || '-' || s.code, jsonb_build_object('color', v.name, 'hex', v.hex, 'size', s.name), null, 4, s.sort
from public.products p
cross join (values ('NUDE','Nude','#D8B4A0'),('NOIR','Noir','#2B2B2B'),('BORDEAUX','Bordeaux','#722F37')) v(code, name, hex)
cross join (values ('S','S',1),('M','M',2),('L','L',3),('XL','XL',4)) s(code, name, sort)
where p.sku like 'JLB-%' or p.sku like 'ABY-%';

insert into public.product_variants (product_id, sku, attributes, price, stock, sort_order)
select p.id, p.sku || '-' || v.code, jsonb_build_object('color', v.name, 'hex', v.hex), null, 8, v.sort
from public.products p
cross join (values ('NUDE','Nude','#D8B4A0'),('NOIR','Noir','#2B2B2B'),('CREME','Crème','#F5EFE6')) v(code, name, hex, sort)
where p.sku like 'KHM-%';

-- ===== FAQ (section 57) =====
insert into public.faqs (question_translations, answer_translations, sort_order) values
('{"fr":"Comment commander ?","en":"How do I order?","ar":"كيف أطلب؟"}','{"fr":"Ajoutez vos articles au panier, renseignez vos informations puis confirmez. Vous pouvez aussi commander via WhatsApp.","en":"Add items to your cart, fill in your details and confirm. You can also order via WhatsApp.","ar":"أضيفي منتجاتك إلى السلة ثم أدخلي معلوماتك وأكدي الطلب. يمكنك أيضاً الطلب عبر واتساب."}',1),
('{"fr":"Quels sont les délais ?","en":"What are the delivery times?","ar":"ما هي مدة التوصيل؟"}','{"fr":"Expédition sous 24-48h, livraison en 2 à 4 jours ouvrés partout en Tunisie.","en":"Shipped within 24-48h, delivery in 2-4 working days across Tunisia.","ar":"الشحن خلال 24-48 ساعة والتوصيل خلال 2-4 أيام عمل."}',2),
('{"fr":"Quels moyens de paiement ?","en":"What payment methods?","ar":"ما طرق الدفع؟"}','{"fr":"Paiement à la livraison avec confirmation WhatsApp.","en":"Cash on delivery with WhatsApp confirmation.","ar":"الدفع عند الاستلام مع تأكيد عبر واتساب."}',3),
('{"fr":"Puis-je commander via WhatsApp ?","en":"Can I order via WhatsApp?","ar":"هل يمكنني الطلب عبر واتساب؟"}','{"fr":"Oui, notre équipe vous accompagne sur WhatsApp.","en":"Yes, our team will assist you on WhatsApp.","ar":"نعم، فريقنا سيرافقك عبر واتساب."}',4),
('{"fr":"Comment choisir ma taille ?","en":"How do I choose my size?","ar":"كيف أختار مقاسي؟"}','{"fr":"Consultez le guide des tailles sur chaque fiche produit.","en":"Check the size guide on each product page.","ar":"راجعي دليل المقاسات في صفحة كل منتج."}',5),
('{"fr":"Comment effectuer un retour ?","en":"How do I make a return?","ar":"كيف أقوم بالإرجاع؟"}','{"fr":"Vous avez 7 jours après réception (produit non porté).","en":"You have 7 days after delivery (unworn item).","ar":"لديك 7 أيام بعد الاستلام (منتج غير مرتدى)."}',6),
('{"fr":"Comment suivre ma commande ?","en":"How do I track my order?","ar":"كيف أتابع طلبي؟"}','{"fr":"Vous recevez le suivi directement sur WhatsApp.","en":"You receive tracking directly on WhatsApp.","ar":"تصلك التحديثات مباشرة عبر واتساب."}',7),
('{"fr":"Livrez-vous dans ma ville ?","en":"Do you deliver to my city?","ar":"هل توصلون إلى مدينتي؟"}','{"fr":"Oui, nous livrons partout en Tunisie.","en":"Yes, we deliver everywhere in Tunisia.","ar":"نعم، نوصل إلى كامل تونس."}',8);

-- ===== AVIS DÉMO (clairement identifiés, section 51) =====
insert into public.reviews (product_id, author_name, rating, title, comment, is_demo, is_approved) values
((select id from products where slug='abaya-noor'),'Amina B.',5,'Magnifique','Qualité exceptionnelle, coupe parfaite. Je recommande.','true',true),
((select id from products where slug='nude-silk-touch'),'Sara M.',5,'Douceur incroyable','Le plus beau hijab que j''ai porté.','true',true),
((select id from products where slug='jilbab-elegance'),'Leïla K.',4,'Très élégant','Beau tombé, couleur fidèle.','true',true),
((select id from products where slug='prayer-pearl-velvet'),'Fatma R.',5,'Premium','Épais, doux, parfait pour offrir.','true',true),
((select id from products where slug='khimar-grace'),'Nour H.',5,'Parfait','Léger, opaque et élégant.','true',true),
((select id from products where slug='sac-elegance-nude'),'Inès G.',4,'Très joli','Finitions soignées, belle couleur.','true',true);

-- ===== SECTIONS HOMEPAGE (section 11) =====
insert into public.homepage_sections (section_key, title_translations, sort_order) values
('hero','{"fr":"","en":"","ar":""}',1),
('categories','{"fr":"Shop by Category","en":"Shop by Category","ar":"تسوقي حسب الفئة"}',2),
('collections','{"fr":"Collections","en":"Collections","ar":"التشكيلات"}',3),
('new_arrivals','{"fr":"Nouveautés","en":"New Arrivals","ar":"وصل حديثاً"}',4),
('best_sellers','{"fr":"Nos Best Sellers","en":"Our Best Sellers","ar":"الأكثر مبيعاً"}',5),
('trending','{"fr":"Tendances du Moment","en":"Trending Now","ar":"الصيحات الحالية"}',6),
('promotions','{"fr":"Offres du Moment","en":"Current Offers","ar":"عروض حالية"}',7),
('advantages','{"fr":"Pourquoi Nous Choisir","en":"Why Choose Us","ar":"لماذا تختارينا"}',8),
('reviews','{"fr":"Avis Clientes","en":"Customer Reviews","ar":"آراء العميلات"}',9),
('instagram','{"fr":"Suivez-Nous","en":"Follow Us","ar":"تابعينا"}',10),
('newsletter','{"fr":"Recevez Nos Nouveautés","en":"Get Our Latest","ar":"اشتركي في نشرتنا"}',11),
('faq','{"fr":"Questions Fréquentes","en":"FAQ","ar":"الأسئلة الشائعة"}',12);

-- ===== HERO =====
insert into public.hero_sections (title_translations, subtitle_translations, image_desktop, image_mobile, cta_label_translations, cta_url, cta_secondary_label_translations, cta_secondary_url, is_slider, sort_order) values
('{"fr":"L''Élégance dans chaque détail","en":"Elegance in every detail","ar":"الأناقة في كل التفاصيل"}',
 '{"fr":"Mode musulmane féminine pensée pour révéler votre élégance avec pudeur, confort et caractère.","en":"Modest Muslim womenswear designed to reveal your elegance with modesty, comfort and character.","ar":"أزياء مسلمة عصرية مصممة لتكشف أناقتك بحشمة وراحة وتميز."}',
 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1920','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=750',
 '{"fr":"Découvrir la collection","en":"Discover the collection","ar":"اكتشفي التشكيلة"}','/collections',
 '{"fr":"Voir les nouveautés","en":"See new arrivals","ar":"شاهدي الجديد"}','/shop',true,1),
('{"fr":"Collection Ramadan","en":"Ramadan Collection","ar":"تشكيلة رمضان"}',
 '{"fr":"Une sélection pensée pour vos moments précieux.","en":"A selection designed for your precious moments.","ar":"تشكيلة مختارة لأجمل لحظاتك."}',
 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1920','https://images.unsplash.com/photo-1585036156171-384164a8c675?w=750',
 '{"fr":"Explorer","en":"Explore","ar":"استكشفي"}','/collection/ramadan',null,null,true,2);

-- ===== ANNONCES =====
insert into public.announcement_bars (text_translations, background_color, text_color, sort_order) values
('{"fr":"Livraison partout en Tunisie","en":"Delivery all over Tunisia","ar":"التوصيل إلى كامل تونس"}','#B76E79','#FFFFFF',1),
('{"fr":"Livraison offerte à partir de 150 DT","en":"Free shipping from 150 DT","ar":"توصيل مجاني ابتداءً من 150 دينار"}','#B76E79','#FFFFFF',2);

-- ===== NAVIGATION =====
insert into public.navigation_items (label_translations, url, menu_location, sort_order) values
('{"fr":"Accueil","en":"Home","ar":"الرئيسية"}','/','main',1),
('{"fr":"Boutique","en":"Shop","ar":"المتجر"}','/shop','main',2),
('{"fr":"Hijab","en":"Hijab","ar":"حجاب"}','/category/hijab','main',3),
('{"fr":"Jilbab","en":"Jilbab","ar":"جلباب"}','/category/jilbab','main',4),
('{"fr":"Abaya","en":"Abaya","ar":"عباية"}','/category/abaya','main',5),
('{"fr":"Khimar","en":"Khimar","ar":"خمار"}','/category/khimar','main',6),
('{"fr":"Accessoires","en":"Accessories","ar":"إكسسوارات"}','/category/accessoires','main',7),
('{"fr":"Tapis de prière","en":"Prayer mats","ar":"سجاد صلاة"}','/category/tapis-priere','main',8),
('{"fr":"Collections","en":"Collections","ar":"التشكيلات"}','/collections','main',9),
('{"fr":"Promotions","en":"Sale","ar":"عروض"}','/shop?promo=1','main',10),
('{"fr":"À propos","en":"About","ar":"من نحن"}','/about','main',11),
('{"fr":"Contact","en":"Contact","ar":"اتصلي بنا"}','/contact','main',12);

-- ===== RÉSEAUX SOCIAUX =====
insert into public.social_links (platform, url, icon, sort_order) values
('instagram','https://instagram.com/votremarque','instagram',1),
('facebook','https://facebook.com/votremarque','facebook',2),
('tiktok','https://tiktok.com/@votremarque','tiktok',3),
('pinterest','https://pinterest.com/votremarque','pinterest',4),
('youtube','https://youtube.com/@votremarque','youtube',5);

-- ===== PARAMÈTRES SITE (section 103) =====
insert into public.site_settings (key, value, description) values
('brand_name','{"fr":"Maison Noura","en":"Maison Noura","ar":"دار نورة"}','Nom de la marque'),
('whatsapp_number','+21620000000','Numéro WhatsApp'),
('whatsapp_enabled','true','Activer WhatsApp'),
('contact_email','contact@maison-noura.tn','Email de contact'),
('contact_phone','+216 20 000 000','Téléphone'),
('opening_hours','{"fr":"Lun-Sam : 9h-18h","en":"Mon-Sat: 9am-6pm","ar":"الاثنين-السبت: 9ص-6م"}','Horaires'),
('free_shipping_threshold','150','Seuil livraison gratuite (DT)'),
('currency','TND','Devise'),
('music_enabled','false','Musique activée'),
('music_track_url','','URL musique'),
('music_volume','0.5','Volume musique'),
('about_content','{"fr":"Notre histoire\n\nNée de la conviction que pudeur et élégance ne font qu''un, notre maison sélectionne chaque pièce avec exigence : matières nobles, coupes soignées, confort au quotidien.\n\nNotre vision\n\nOffrir à chaque femme musulmane une mode contemporaine, raffinée et fidèle à ses valeurs.","en":"Our story\n\nBorn from the belief that modesty and elegance are one, our house selects every piece with care.\n\nOur vision\n\nOffering every Muslim woman a contemporary, refined fashion true to her values.","ar":"قصتنا\n\nوُلدت دارنا من قناعة بأن الحشمة والأناقة وجهان لعملة واحدة.\n\nرؤيتنا\n\nأن نقدم لكل امرأة مسلمة موضة معاصرة راقية."}','Contenu À propos'),
('seo_default_title','{"fr":"Mode Musulmane Féminine Premium","en":"Premium Modest Muslim Fashion","ar":"أزياء مسلمة فاخرة"}','Titre SEO par défaut'),
('seo_default_description','{"fr":"Hijabs, jilbabs, abayas, khimars et accessoires premium. Livraison partout en Tunisie.","en":"Premium hijabs, jilbabs, abayas and accessories. Delivery all over Tunisia.","ar":"حجابات وجلابيبت وعبايات فاخرة مع التوصيل لكامل تونس."}','Meta description par défaut'),
('seo_og_image','https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200','Image OG'),
('whatsapp_template','{"fr":"Bonjour, je souhaite confirmer ma commande #{ORDER_NUMBER}.\nProduits :\n{PRODUCTS}\nTotal : {TOTAL} DT\nLivraison : {ZONE}\nAdresse : {ADDRESS}","en":"Hello, I would like to confirm my order #{ORDER_NUMBER}.\nItems:\n{PRODUCTS}\nTotal: {TOTAL} DT\nDelivery: {ZONE}\nAddress: {ADDRESS}","ar":"مرحباً، أود تأكيد طلبي رقم {ORDER_NUMBER}.\nالمنتجات:\n{PRODUCTS}\nالمجموع: {TOTAL} د.ت\nالتوصيل: {ZONE}\nالعنوان: {ADDRESS}"}','Template WhatsApp');

-- ===== ZONES DE LIVRAISON (section 48) =====
insert into public.service_zones (name_translations, country, cities, shipping_fee, free_shipping_threshold, estimated_delay_translations, sort_order) values
('{"fr":"Grand Tunis","en":"Greater Tunis","ar":"تونس الكبرى"}','TN','{Tunis,Ariana,Ben Arous,Manouba}',7,150,'{"fr":"1 à 2 jours ouvrés","en":"1-2 working days","ar":"1 إلى 2 أيام عمل"}',1),
('{"fr":"Nord","en":"North","ar":"الشمال"}','TN','{Bizerte,Béja,Jendouba,Le Kef,Nabeul,Zaghouan}',9,150,'{"fr":"2 à 3 jours ouvrés","en":"2-3 working days","ar":"2 إلى 3 أيام عمل"}',2),
('{"fr":"Centre","en":"Center","ar":"الوسط"}','TN','{Sousse,Monastir,Mahdia,Sfax,Kairouan,Kasserine,Sidi Bouzid}',10,150,'{"fr":"2 à 3 jours ouvrés","en":"2-3 working days","ar":"2 إلى 3 أيام عمل"}',3),
('{"fr":"Sud","en":"South","ar":"الجنوب"}','TN','{Gabès,Médenine,Tataouine,Gafsa,Tozeur,Kébili}',12,200,'{"fr":"3 à 4 jours ouvrés","en":"3-4 working days","ar":"3 إلى 4 أيام عمل"}',4);

-- ===== COUPONS DÉMO =====
insert into public.coupons (code, type, value, minimum_order_amount, usage_limit, usage_limit_per_customer) values
('BIENVENUE10','percentage',10,50,100,1),
('RAMADAN15','percentage',15,100,50,1);

-- ===== GUIDES DES TAILLES (section 36) =====
insert into public.size_guides (scope_type, category_id, title_translations, data, recommendations_translations)
select 'category', c.id, '{"fr":"Guide des tailles — Jilbab","en":"Size Guide — Jilbab","ar":"دليل المقاسات — جلباب"}',
 '[{"size":"S","poitrine":"92 cm","taille":"74 cm","longueur":"138 cm"},{"size":"M","poitrine":"96 cm","taille":"78 cm","longueur":"140 cm"},{"size":"L","poitrine":"100 cm","taille":"82 cm","longueur":"142 cm"},{"size":"XL","poitrine":"106 cm","taille":"88 cm","longueur":"144 cm"}]',
 '{"fr":"Entre deux tailles ? Choisissez la taille supérieure pour plus d''aisance.","en":"Between sizes? Size up for comfort.","ar":"بين مقاسين؟ اختاري المقاس الأكبر."}'
from public.categories c where c.slug = 'jilbab';

insert into public.size_guides (scope_type, category_id, title_translations, data, recommendations_translations)
select 'category', c.id, '{"fr":"Guide des tailles — Abaya","en":"Size Guide — Abaya","ar":"دليل المقاسات — عباية"}',
 '[{"size":"S","poitrine":"94 cm","manches":"56 cm","longueur":"136 cm"},{"size":"M","poitrine":"98 cm","manches":"57 cm","longueur":"138 cm"},{"size":"L","poitrine":"102 cm","manches":"58 cm","longueur":"140 cm"},{"size":"XL","poitrine":"108 cm","manches":"59 cm","longueur":"142 cm"}]',
 '{"fr":"Nos abayas taillent normalement. Coupe ample et fluide.","en":"Our abayas fit true to size. Loose, flowing cut.","ar":"عباياتنا بمقاسات مضبوطة وقصّة واسعة."}'
from public.categories c where c.slug = 'abaya';