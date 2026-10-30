-- Selena — optional online backup.
--
-- One row per (user, category). A category is only ever written when the
-- user has ticked it in the app, and unticking it deletes the row.
-- Row-level security means a signed-in user can read and change only their
-- own rows; nobody else's, and nothing at all when signed out.
--
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.

create table if not exists public.backups (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  category   text        not null check (category in ('cycle', 'logs', 'training', 'nutrition')),
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.backups enable row level security;

-- New tables are not exposed automatically, so grant exactly what the app
-- needs: signed-in users only, and the policies below narrow that to their
-- own rows. Signed-out visitors get nothing.
revoke all on table public.backups from anon, authenticated;
grant select, insert, update, delete on table public.backups to authenticated;

create policy "read own backups" on public.backups
  for select to authenticated using (auth.uid() = user_id);

create policy "insert own backups" on public.backups
  for insert to authenticated with check (auth.uid() = user_id);

create policy "update own backups" on public.backups
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own backups" on public.backups
  for delete to authenticated using (auth.uid() = user_id);

-- "Delete all my data" in the app calls this. It removes the account itself,
-- and the cascade above removes every backup row with it.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
