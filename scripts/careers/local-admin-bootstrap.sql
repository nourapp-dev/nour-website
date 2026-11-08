-- Isolated local database only; no user credentials are stored in SQL.
insert into public.roles(id,key,name_ar,name_en,is_active,sort_order)
values('37601ddf-d590-4ceb-8808-de0a7ce35327','super_admin','المدير الأعلى المحلي','Local Super Admin',true,10)
on conflict(id) do nothing;
grant select, insert, update, delete on public.admin_profile_roles to service_role;
notify pgrst, 'reload schema';
