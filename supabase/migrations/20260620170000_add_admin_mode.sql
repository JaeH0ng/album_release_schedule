create table if not exists public.admin_users (
  email text primary key,
  note text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.admin_users enable row level security;

grant insert, update, delete on public.singer_songwriter_opportunities to authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Admins can write singer songwriter opportunities" on public.singer_songwriter_opportunities;
create policy "Admins can write singer songwriter opportunities"
on public.singer_songwriter_opportunities
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.email = auth.jwt() ->> 'email'
  )
)
with check (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.email = auth.jwt() ->> 'email'
  )
);

drop policy if exists "Users can read own admin profile" on public.admin_users;
create policy "Users can read own admin profile"
on public.admin_users
for select
to authenticated
using (email = auth.jwt() ->> 'email');
