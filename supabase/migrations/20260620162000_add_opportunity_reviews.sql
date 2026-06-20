create table if not exists public.opportunity_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null references public.singer_songwriter_opportunities(id) on delete cascade,
  review_status text not null check (review_status in ('accepted', 'hold', 'dismissed')),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, opportunity_id)
);

alter table public.opportunity_reviews enable row level security;

grant select, insert, update, delete on public.opportunity_reviews to authenticated;

drop policy if exists "Users can read own opportunity reviews" on public.opportunity_reviews;
create policy "Users can read own opportunity reviews"
on public.opportunity_reviews
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own opportunity reviews" on public.opportunity_reviews;
create policy "Users can insert own opportunity reviews"
on public.opportunity_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own opportunity reviews" on public.opportunity_reviews;
create policy "Users can update own opportunity reviews"
on public.opportunity_reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own opportunity reviews" on public.opportunity_reviews;
create policy "Users can delete own opportunity reviews"
on public.opportunity_reviews
for delete
to authenticated
using (auth.uid() = user_id);
