-- Storage bucket for post images. Run once in the Supabase SQL editor.

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- remove defaults if we're re-running, keeps things tidy
drop policy if exists "post images public read" on storage.objects;
drop policy if exists "post images authed upload" on storage.objects;
drop policy if exists "post images delete own" on storage.objects;

create policy "post images public read"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "post images authed upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images');

create policy "post images delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and owner = auth.uid());

-- helper index for like counts. the PK covers (user_id, post_id) but not post_id on its own
create index if not exists likes_post_id_idx on public.likes(post_id);