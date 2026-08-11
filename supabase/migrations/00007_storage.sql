-- ============================================================
-- 00007 — STORAGE (section 65 : Media Manager)
-- ============================================================

-- Bucket public « media »
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Politiques Storage : lecture publique, écriture admin
create policy "media_storage_read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media_storage_write" on storage.objects for insert
  to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media_storage_update" on storage.objects for update
  to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media_storage_delete" on storage.objects for delete
  to authenticated using (bucket_id = 'media' and public.is_admin());