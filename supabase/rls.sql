-- =====================================================================
-- Ne İzlesem? — Supabase Row Level Security (RLS) kuralları
--
-- NASIL ÇALIŞTIRILIR:
--   1. Aşağıdaki 'BURAYA_ADMIN_EPOSTASI' kısmını kendi admin e-postanla değiştir
--      (.env.local içindeki ADMIN_EMAILS ile aynı olmalı).
--   2. Supabase Dashboard → SQL Editor → bu dosyanın tamamını yapıştır → Run.
--
-- DİKKAT: Bu betik aşağıdaki tablolardaki MEVCUT TÜM POLICY'LERİ SİLER ve yerine
-- buradakileri koyar. (RLS'de policy'ler "VEYA" ile birleşir; eski gevşek bir
-- "herkes yazabilir" policy'si kalırsa yenileri hiçbir şeyi korumaz.)
-- match_rooms / match_votes tablolarına dokunulmaz.
-- =====================================================================

begin;

-- --- Admin listesi ------------------------------------------------------
create table if not exists public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;  -- policy yok = istemciden okunamaz

insert into public.admin_emails (email) values (lower('BURAYA_ADMIN_EPOSTASI'))
on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- --- Eski policy'leri temizle -------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('videos','safe_channels','blacklist','user_history','favorites','profiles','user_badges','badges')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- --- videos -------------------------------------------------------------
alter table public.videos enable row level security;
-- Herkes onaylı videoları görür; admin hepsini görür
create policy videos_read on public.videos for select
  using (is_approved = true or public.is_admin());
-- Uygulama canlı YouTube önerilerini onay kuyruğuna ekleyebilir (onaylı ekleyemez)
create policy videos_queue_insert on public.videos for insert
  with check (is_approved = false);
create policy videos_admin_all on public.videos for all
  using (public.is_admin()) with check (public.is_admin());

-- Giriş yapmış kullanıcı "hatalı kategori" bildirimi: sadece is_approved=false yapabilir
create or replace function public.report_video(video_id bigint) returns void
language sql security definer set search_path = public as $$
  update public.videos set is_approved = false where id = video_id;
$$;
revoke all on function public.report_video(bigint) from public, anon;
grant execute on function public.report_video(bigint) to authenticated;

-- --- safe_channels (yalnızca admin) -------------------------------------
alter table public.safe_channels enable row level security;
create policy safe_channels_admin_all on public.safe_channels for all
  using (public.is_admin()) with check (public.is_admin());

-- --- blacklist (herkes okur, admin yazar) -------------------------------
alter table public.blacklist enable row level security;
create policy blacklist_read on public.blacklist for select using (true);
create policy blacklist_admin_write on public.blacklist for all
  using (public.is_admin()) with check (public.is_admin());

-- --- user_history (kişi kendi kaydı; admin okur) ------------------------
alter table public.user_history enable row level security;
create policy user_history_own on public.user_history for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_history_admin_read on public.user_history for select
  using (public.is_admin());

-- --- favorites (kişi kendi kaydı) ---------------------------------------
alter table public.favorites enable row level security;
create policy favorites_own on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --- profiles (kişi kendi profili; admin okur) --------------------------
alter table public.profiles enable row level security;
create policy profiles_own on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_admin_read on public.profiles for select
  using (public.is_admin());

-- --- user_badges / badges -----------------------------------------------
alter table public.user_badges enable row level security;
create policy user_badges_own_read on public.user_badges for select using (auth.uid() = user_id);
create policy user_badges_own_insert on public.user_badges for insert with check (auth.uid() = user_id);

alter table public.badges enable row level security;
create policy badges_read on public.badges for select using (true);

commit;

-- --- Kontrol ------------------------------------------------------------
-- select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by 1, 2;
