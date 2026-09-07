create policy "recruiters and colleges can notify" on public.notifications
for insert to authenticated
with check (
  public.has_role(auth.uid(),'industry') or public.has_role(auth.uid(),'college') or public.is_admin()
);