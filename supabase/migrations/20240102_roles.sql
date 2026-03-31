-- ─── Mise à jour du type profiles ───────────────────────────────────────────
-- Supprimer l'ancienne contrainte et en créer une nouvelle avec prof et admin
alter table public.profiles drop constraint if exists profiles_type_check;
alter table public.profiles add constraint profiles_type_check
  check (type in ('student', 'association', 'prof', 'admin'));

-- ─── Table de configuration admin ───────────────────────────────────────────
create table if not exists public.admin_config (
  id                  integer primary key default 1,
  student_max_days    integer not null default 7,
  asso_max_days       integer not null default 30,
  prof_max_days       integer not null default 90,
  student_max_seats   integer not null default 4,
  constraint single_row check (id = 1)
);

-- Insérer la ligne par défaut si elle n'existe pas
insert into public.admin_config (id) values (1) on conflict do nothing;

alter table public.admin_config enable row level security;

-- Tous les utilisateurs connectés peuvent lire la config
create policy "admin_config_select" on public.admin_config
  for select using (auth.role() = 'authenticated');

-- Seul l'admin peut modifier (vérifié côté application)
create policy "admin_config_update" on public.admin_config
  for update using (auth.role() = 'authenticated');
