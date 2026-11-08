-- Local intake stack only. Modern Supabase does not automatically expose new tables.
-- The server key remains server-only; RLS and anonymous grants remain unchanged.
grant select, insert, update, delete on public.job_applications, public.partner_applications to service_role;
notify pgrst, 'reload schema';
