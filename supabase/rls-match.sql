-- =====================================================================
-- Eşleş (match) tabloları için RLS.
-- Şu an bu iki tabloda RLS kapalı: anon anahtarıyla herkes oda/oy ekleyip silebilir.
-- Uygulama yalnızca giriş yapmış kullanıcılarla çalışıyor (match sayfası /login'e yönlendirir).
--
-- Supabase Dashboard → SQL Editor → bu dosyanın tamamını çalıştır.
-- =====================================================================

begin;

alter table public.match_rooms enable row level security;
alter table public.match_votes enable row level security;

drop policy if exists match_rooms_read on public.match_rooms;
drop policy if exists match_rooms_create on public.match_rooms;
drop policy if exists match_votes_read on public.match_votes;
drop policy if exists match_votes_create on public.match_votes;

-- Oda koduyla katılmak için giriş yapmış herkes odaları okuyabilir
create policy match_rooms_read on public.match_rooms for select to authenticated using (true);
-- Oda yalnızca kendi adına oluşturulabilir
create policy match_rooms_create on public.match_rooms for insert to authenticated
  with check (created_by = auth.uid());

-- Oylar (ve realtime aboneliği) giriş yapmış kullanıcılara açık
create policy match_votes_read on public.match_votes for select to authenticated using (true);
-- Oy yalnızca kendi adına verilebilir; güncelleme/silme yok
create policy match_votes_create on public.match_votes for insert to authenticated
  with check (user_id = auth.uid());

commit;
