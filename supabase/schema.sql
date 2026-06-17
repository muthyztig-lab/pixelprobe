-- ============================================================================
--  PixelProbe — Supabase schema
--  Run this once in your project's SQL editor (Dashboard → SQL → New query).
--  It creates the profile/credit table, locks it down with Row-Level Security,
--  auto-creates a profile (with the signup bonus) for every new user, and
--  exposes two SERVER-ONLY functions to spend / refund credits atomically.
-- ============================================================================

-- 1) Profiles: one row per auth user, holds the credit balance. -------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  credits    integer not null default 25 check (credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Row-Level Security: users may READ ONLY their own row and may NEVER
--    insert/update/delete it. Credits therefore cannot be changed from the
--    browser — only the service role (this app's server) can. ---------------
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);
-- NOTE: deliberately NO insert/update/delete policies for normal users.

-- 3) Auto-create a profile with the signup bonus when a user registers. -----
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 25)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Spend credits atomically. Returns the new balance, or NULL if the user
--    didn't have enough (in which case NOTHING is deducted). The check and the
--    decrement happen in one statement, so it is race-safe. -----------------
create or replace function public.consume_credits(p_user uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.profiles
     set credits = credits - p_amount,
         updated_at = now()
   where id = p_user
     and credits >= p_amount
  returning credits into new_balance;

  return new_balance; -- NULL when balance was insufficient
end;
$$;

-- 5) Refund credits (used if a charged scan fails). -------------------------
create or replace function public.refund_credits(p_user uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.profiles
     set credits = credits + p_amount,
         updated_at = now()
   where id = p_user
  returning credits into new_balance;

  return new_balance;
end;
$$;

-- 6) Lock the credit functions down: only the service role (server) may call
--    them. Browsers (anon / authenticated) are explicitly revoked. ----------
revoke all on function public.consume_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, integer)  from public, anon, authenticated;
