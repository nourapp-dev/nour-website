begin;
-- Additive metadata; do not reinterpret or backfill legacy employment_type=remote.
alter table public.job_applications
 add column application_kind text check (application_kind is null or application_kind='talent_pool'),
 add column career_area text check (career_area is null or career_area in ('technology_product','operations','customer_service','marketing_content','partnerships_business','other')),
 add column opportunity_type text check (opportunity_type is null or opportunity_type in ('full_time','part_time','internship','freelance')),
 add column work_mode text check (work_mode is null or work_mode in ('onsite','hybrid','remote','no_preference')),
 add column portfolio_url text,
 add column submission_key uuid unique;

-- Existing candidate rows and application view/manage permissions remain intact.
-- CV uploads now go through the server's type/signature/size validation. Public
-- partner uploads retain their existing path; no anonymous CV reads are added.
update storage.buckets set public=false where id='application-files';
drop policy if exists public_upload_application_files on storage.objects;
create policy public_upload_application_files on storage.objects for insert to anon,authenticated
 with check (bucket_id='application-files' and (storage.foldername(name))[1]='partner-applications');
drop policy if exists admin_read_application_files on storage.objects;
create policy admin_read_application_files on storage.objects for select to authenticated using (
 bucket_id='application-files' and (
 ((storage.foldername(name))[1]='job-applications' and (public.current_user_has_permission('applications.view') or public.current_user_has_permission('applications.manage')) and exists(select 1 from public.job_applications j where j.cv_path=name))
 or ((storage.foldername(name))[1]='partner-applications' and (public.current_user_has_permission('partners.view') or public.current_user_has_permission('partners.manage')) and exists(select 1 from public.partner_applications p where p.attachment_path=name))
 ));
drop policy if exists admin_delete_application_files on storage.objects;
create policy admin_delete_application_files on storage.objects for delete to authenticated using (
 bucket_id='application-files' and (
 ((storage.foldername(name))[1]='job-applications' and public.current_user_has_permission('applications.manage') and exists(select 1 from public.job_applications j where j.cv_path=name))
 or ((storage.foldername(name))[1]='partner-applications' and public.current_user_has_permission('partners.manage') and exists(select 1 from public.partner_applications p where p.attachment_path=name))
 ));
notify pgrst,'reload schema';
commit;
