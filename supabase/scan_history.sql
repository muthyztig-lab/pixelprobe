-- ─────────────────────────────────────────────────────────────────────────
-- PixelProbe — scan history
--
-- Stores every scan a logged-in user runs, so they can browse the prompts the
-- tool produced. Run this once in the Supabase SQL editor.
--
-- Security model (matches the rest of the app):
--   • The SERVER (service-role key) INSERTS rows — it bypasses RLS.
--   • The BROWSER (anon key) can only SELECT/DELETE its OWN rows, enforced by
--     Row-Level Security. It can never read other users' history or insert.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.scan_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  host       text not null,
  url        text not null,
  title      text,
  summary    text,
  prompt     text,        -- the markdown design spec the scan produced
  colors     jsonb,       -- small palette preview (array of hex strings)
  created_at timestamptz not null default now()
);

-- Fast "my history, newest first" lookups.
create index if not exists scan_history_user_created_idx
  on public.scan_history (user_id, created_at desc);

-- ── Row-Level Security ──────────────────────────────────────────────────
alter table public.scan_history enable row level security;

-- Read only your own rows.
drop policy if exists "read own history" on public.scan_history;
create policy "read own history"
  on public.scan_history
  for select
  using (auth.uid() = user_id);

-- Delete only your own rows (lets users clear their history).
drop policy if exists "delete own history" on public.scan_history;
create policy "delete own history"
  on public.scan_history
  for delete
  using (auth.uid() = user_id);

-- NOTE: there is deliberately NO insert/update policy — only the server
-- (service-role) writes history, and the service role bypasses RLS.
