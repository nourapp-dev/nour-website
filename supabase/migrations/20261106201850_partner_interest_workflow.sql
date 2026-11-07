-- Local-only migration. Do not apply to production as part of this task.
begin;
drop policy public_insert_partner_applications on public.partner_applications;
-- Only partners gain workflow stages: the shared jobs enum remains unchanged.
alter table public.partner_applications alter column status drop default;
alter table public.partner_applications alter column status type text using status::text;
alter table public.partner_applications alter column status set default 'new';
alter table public.partner_applications add constraint partner_workflow_status check
 (status in ('new','under_review','contacted','completion_required','qualifying','final_review','contracting','approved','rejected','withdrawn','archived'));
alter table public.partner_applications
 add column partnership_track text check (partnership_track in ('international','service_provider')),
 add column contact_role text,
 add column completion_requirements text,
 add column completion_channel text,
 add column contract_reference text,
 add column country_annex_reference text,
 add column approval_notice_reference text,
 add column operational_active boolean not null default false,
 add column status_history jsonb not null default '[]'::jsonb;
-- Null tracks distinguish legacy applications; existing fields and status survive.
create or replace function public.guard_partner_workflow()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if TG_OP = 'INSERT' then
   if new.status <> 'new' or new.operational_active or new.assigned_to is not null
     or new.internal_notes is not null or new.completion_requirements is not null
     or new.completion_channel is not null or new.contract_reference is not null
     or new.country_annex_reference is not null or new.approval_notice_reference is not null
     or new.deleted_at is not null or new.last_contacted_at is not null then
     raise exception 'Applications must start as an unassigned expression of interest';
   end if;
   if new.partnership_track is not null then
     if not new.terms_accepted or nullif(btrim(new.company_name),'') is null
       or nullif(btrim(new.contact_name),'') is null or nullif(btrim(new.contact_role),'') is null
       or nullif(btrim(new.country),'') is null or nullif(btrim(new.city),'') is null
       or nullif(btrim(new.company_description),'') is null
       or new.phone !~ '^\+[1-9][0-9]{7,14}$'
       or new.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       or char_length(new.company_description)>3000
       or (new.website_url is not null and new.website_url !~* '^https?://[^[:space:]]+$') then
       raise exception 'Invalid expression of interest';
     end if;
   end if;
   new.status_history := jsonb_build_array(jsonb_build_object('from',null,'to','new','actor',auth.uid(),'at',now()));
 else
   if not public.current_user_has_permission('partners.manage') then
     raise exception 'Partner management permission required' using errcode='42501';
   end if;
   -- Existing partners.manage is the current approval authority; no new role grants.
   if (new.status='approved' and old.status is distinct from 'approved')
      or (new.operational_active and not old.operational_active) then
     if new.status <> 'approved' or nullif(btrim(new.contract_reference),'') is null
       or nullif(btrim(new.approval_notice_reference),'') is null
       or (new.partnership_track='international' and nullif(btrim(new.country_annex_reference),'') is null) then
       raise exception 'Approval requires contract, applicable country annex and approval notice references';
     end if;
   end if;
   if new.status <> 'approved' then new.operational_active := false; end if;
   -- Clients cannot rewrite the audit trail; append only on a real transition.
   new.status_history := old.status_history;
   if old.status is distinct from new.status then
     new.status_history := old.status_history || jsonb_build_array(jsonb_build_object('from',old.status,'to',new.status,'actor',auth.uid(),'at',now()));
   end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_partner_workflow() from public;
create trigger partner_workflow_guard before insert or update on public.partner_applications
 for each row execute function public.guard_partner_workflow();
create policy public_insert_partner_applications on public.partner_applications for insert to anon, authenticated
 with check (deleted_at is null and status='new' and terms_accepted=true);
-- Existing row-level read/update policies and grants remain in force.
-- Scope file access to the application module and an existing application row.
update storage.buckets set public=false where id='application-files';
drop policy if exists admin_read_application_files on storage.objects;
create policy admin_read_application_files on storage.objects for select to authenticated using (
 bucket_id='application-files' and (
  ((storage.foldername(name))[1]='partner-applications'
   and (public.current_user_has_permission('partners.view') or public.current_user_has_permission('partners.manage'))
   and exists(select 1 from public.partner_applications p where p.attachment_path=name))
  or ((storage.foldername(name))[1]='job-applications'
   and (public.current_user_has_permission('applications.view') or public.current_user_has_permission('applications.manage'))
   and exists(select 1 from public.job_applications j where j.cv_path=name))
 ));
drop policy if exists admin_delete_application_files on storage.objects;
create policy admin_delete_application_files on storage.objects for delete to authenticated using (
 bucket_id='application-files' and (
  ((storage.foldername(name))[1]='partner-applications' and public.current_user_has_permission('partners.manage')
   and exists(select 1 from public.partner_applications p where p.attachment_path=name))
  or ((storage.foldername(name))[1]='job-applications' and public.current_user_has_permission('applications.manage')
   and exists(select 1 from public.job_applications j where j.cv_path=name))
 ));
commit;
