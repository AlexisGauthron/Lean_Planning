-- Allow any authenticated user to read all profiles (admin user management)
create policy "profiles_select_all" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Allow any authenticated user to update any profile type (app-level admin guard)
create policy "profiles_update_any" on public.profiles
  for update using (auth.role() = 'authenticated');
