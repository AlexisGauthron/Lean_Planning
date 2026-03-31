-- ─── Profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id   uuid references auth.users on delete cascade primary key,
  name text not null default '',
  type text not null default 'student' check (type in ('student', 'association')),
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- ─── Bookings ────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id           text primary key,
  user_id      uuid references auth.users on delete cascade not null,
  user_name    text not null default '',
  room_id      text not null,
  campus       text not null,
  date         text not null,
  start_time   text not null,
  end_time     text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  booking_type text not null default 'partial' check (booking_type in ('full', 'partial')),
  seats        integer not null default 1,
  created_at   timestamptz default now() not null
);

alter table public.bookings enable row level security;

-- Tout utilisateur connecté peut voir toutes les réservations (planning partagé)
create policy "bookings_select" on public.bookings for select using (auth.role() = 'authenticated');
create policy "bookings_insert" on public.bookings for insert with check (auth.uid() = user_id);
create policy "bookings_update" on public.bookings for update using (auth.uid() = user_id);
create policy "bookings_delete" on public.bookings for delete using (auth.uid() = user_id);
