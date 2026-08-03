-- Perfiles de usuario (Supabase Auth) + tokens push para la app móvil.
-- Ejecutar en el SQL Editor de Supabase. No modifica tablas de la web.

-- ─── Supabase Auth (dashboard) ───────────────────────────────────
-- Authentication → URL Configuration:
--   Site URL: https://www.bsproyect.com
--   Redirect URLs: https://www.bsproyect.com/auth/callback

-- ─── Perfiles ────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Tokens Expo Push ────────────────────────────────────────────
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists idx_push_tokens_user on public.push_tokens (user_id);

-- ─── RLS ─────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.push_tokens enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "push_tokens_select_own" on public.push_tokens;
drop policy if exists "push_tokens_insert_own" on public.push_tokens;
drop policy if exists "push_tokens_update_own" on public.push_tokens;
drop policy if exists "push_tokens_delete_own" on public.push_tokens;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "push_tokens_select_own"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "push_tokens_insert_own"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "push_tokens_update_own"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "push_tokens_delete_own"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- ─── Perfil automático al registrarse ────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles de usuarios que ya existían antes de esta migración
insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- ─── Webhook: al publicar alerta, invocar Edge Function ──────────
-- Ver también: supabase/enable-push-on-alerts.sql (versión lista para Run)
--
-- Pasos:
-- 1) Deploy Edge Function send-push-notification
-- 2) Secret PUSH_WEBHOOK_SECRET = iame-push-2026-bsproyect
-- 3) Ejecutar enable-push-on-alerts.sql
--
-- create extension if not exists pg_net with schema extensions;
-- ... (código activo en enable-push-on-alerts.sql)