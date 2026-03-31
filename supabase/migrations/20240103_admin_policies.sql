-- ─── Politique admin pour les bookings ──────────────────────────────────────
-- L'admin doit pouvoir mettre à jour le statut de n'importe quelle réservation

-- Ajouter une policy qui permet à l'admin de mettre à jour toutes les réservations
create policy "bookings_admin_update" on public.bookings
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and type = 'admin'
    )
  );

-- L'admin peut aussi supprimer n'importe quelle réservation
create policy "bookings_admin_delete" on public.bookings
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and type = 'admin'
    )
  );

-- Colonne student_max_rooms_per_day si pas encore ajoutée
alter table public.admin_config
  add column if not exists student_max_rooms_per_day integer not null default 2;
