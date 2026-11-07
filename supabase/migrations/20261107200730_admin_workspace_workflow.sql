-- Reviewable workspace extension. Applied to the isolated local stack only.
begin;
create schema if not exists admin_private;
revoke all on schema admin_private from public;

create or replace function public.workspace_allowed(module text, action text)
returns boolean language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and (public.current_user_has_permission(module||'.manage') or public.current_user_has_permission(module||'.'||action)
 or (action='view' and public.current_user_has_permission(module||'.read')))
$$;
revoke all on function public.workspace_allowed(text,text) from public;
grant execute on function public.workspace_allowed(text,text) to authenticated,service_role;

insert into public.permissions(key,module,action,name_ar,name_en)
select m||'.'||a,m,a,'إدارة الطلبات: '||a,'Intake: '||a
from unnest(array['applications','partners']) m cross join unnest(array['view','manage','status','assign','archive','export','attachments']) a
on conflict(key) do nothing;

create table public.admin_followups (
 id uuid primary key default gen_random_uuid(), module text not null check(module in ('applications','partners')),
 record_id uuid not null, title text not null check(length(btrim(title)) between 1 and 200),
 assigned_to uuid not null references public.admin_profiles(id), due_at timestamptz,
 status text not null default 'open' check(status in ('open','done','cancelled')),
 created_by uuid references public.admin_profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index admin_followups_owner_due on public.admin_followups(assigned_to,status,due_at);
create index admin_followups_record on public.admin_followups(module,record_id);
create table public.admin_intake_events (
 id uuid primary key default gen_random_uuid(), module text not null check(module in ('applications','partners')),
 record_id uuid not null, actor_id uuid references auth.users(id) on delete set null,
 event text not null, changes jsonb not null default '{}', created_at timestamptz not null default now()
);
create index admin_intake_events_record on public.admin_intake_events(module,record_id,created_at desc);
create table public.admin_notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.admin_profiles(id) on delete cascade,
 event_id uuid not null references public.admin_intake_events(id) on delete cascade,
 module text not null check(module in ('applications','partners')), record_id uuid not null,
 event text not null, read_at timestamptz, created_at timestamptz not null default now(), unique(recipient_id,event_id)
);
create index admin_notifications_recipient on public.admin_notifications(recipient_id,read_at,created_at desc);
alter table public.admin_followups enable row level security;
alter table public.admin_intake_events enable row level security;
alter table public.admin_notifications enable row level security;
grant select on public.admin_followups,public.admin_intake_events,public.admin_notifications to authenticated;
create policy followups_read on public.admin_followups for select to authenticated using(public.workspace_allowed(module,'view') and (assigned_to=auth.uid() or public.workspace_allowed(module,'assign')));
create policy intake_events_read on public.admin_intake_events for select to authenticated using(public.workspace_allowed(module,'view'));
create policy notifications_read on public.admin_notifications for select to authenticated using(recipient_id=auth.uid() and public.workspace_allowed(module,'view'));

create function public.workspace_context() returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
 select jsonb_build_object('id',p.id,'name',p.full_name,'email',p.email,'superAdmin',public.is_super_admin(auth.uid()),
 'permissions',coalesce((select jsonb_agg(x.key) from public.permissions x where x.is_active and x.deleted_at is null and public.current_user_has_permission(x.key)),'[]'::jsonb))
 into result from public.admin_profiles p where p.id=auth.uid() and p.status='active' and p.deleted_at is null;
 if result is null then raise exception 'admin_access_required' using errcode='42501'; end if;
 return result;
end $$;
grant select on public.permissions to authenticated;
grant select(id,actor_id,action,entity_type,entity_id,created_at) on public.audit_logs to authenticated;
create policy workspace_legacy_audit_read on public.audit_logs for select to authenticated using(public.is_super_admin(auth.uid()));
-- The existing cities policy used countries.view while the established catalog
-- permission is countries.read. Preserve both without adding public access.
do $cities$ begin
 if to_regclass('public.departure_cities') is not null then
  execute 'create policy workspace_cities_read on public.departure_cities for select to authenticated using(public.workspace_allowed(''countries'',''view''))';
 end if;
end $cities$;
create policy workspace_permissions_read on public.permissions for select to authenticated using(public.current_user_has_permission(key));

-- Bound parameters, database filtering/sorting/paging, no candidate search in URL.
create function public.workspace_list(module text, filters jsonb default '{}') returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare tbl text; result jsonb; direction text; sorting text; size int; offset_rows int; term text;
begin
 if module not in ('applications','partners') or not public.workspace_allowed(module,'view') then raise exception 'permission_denied' using errcode='42501'; end if;
 tbl:=case module when 'applications' then 'job_applications' else 'partner_applications' end;
 size:=least(50,greatest(1,coalesce((filters->>'size')::int,20))); offset_rows:=(greatest(1,coalesce((filters->>'page')::int,1))-1)*size;
 sorting:=case when filters->>'sort'='name' then case module when 'applications' then 'full_name' else 'company_name' end else 'created_at' end;
 direction:=case when filters->>'direction'='asc' then 'asc' else 'desc' end;
 term:='%'||replace(replace(replace(left(coalesce(filters->>'search',''),200),'\','\\'),'%','\%'),'_','\_')||'%';
 execute format($q$
 with filtered as (
 select * from public.%I r where
 (($1->>'archived'='true' and r.deleted_at is not null) or (coalesce($1->>'archived','false')<>'true' and r.deleted_at is null))
 and (coalesce($1->>'status','')='' or r.status::text=$1->>'status')
 and (coalesce($1->>'owner','')<>'me' or r.assigned_to=auth.uid())
 and (coalesce($1->>'from','')='' or r.created_at>=(($1->>'from')::date::timestamp at time zone 'Asia/Riyadh'))
 and (coalesce($1->>'to','')='' or r.created_at<((($1->>'to')::date+1)::timestamp at time zone 'Asia/Riyadh'))
 and (coalesce($1->>'area','')='' or to_jsonb(r)->>'career_area'=$1->>'area')
 and (coalesce($1->>'opportunity','')='' or coalesce(to_jsonb(r)->>'opportunity_type',to_jsonb(r)->>'employment_type')=$1->>'opportunity')
 and (coalesce($1->>'search','')='' or coalesce(to_jsonb(r)->>'full_name',to_jsonb(r)->>'company_name','') ilike $2 or r.email ilike $2 or r.phone ilike $2 or r.id::text ilike $2)
 ), page as(select * from filtered order by %I %s,id limit $3 offset $4)
 select jsonb_build_object('total',(select count(*) from filtered),'items',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb))
 $q$,tbl,sorting,direction) into result using filters,term,size,offset_rows;
 return result;
end $$;

create function public.workspace_assignees(module text) returns table(id uuid,full_name text) language plpgsql stable security definer set search_path='' as $$
begin
 if module not in ('applications','partners') or not public.workspace_allowed(module,'assign') then raise exception 'permission_denied' using errcode='42501'; end if;
 return query select p.id,p.full_name from public.admin_profiles p where p.status='active' and p.deleted_at is null and public.has_permission(p.id,module||'.view') order by p.full_name;
end $$;

create function admin_private.guard_intake() returns trigger language plpgsql security invoker set search_path='' as $$
declare m text; old_status text; next_status text;
begin
 m:=case TG_TABLE_NAME when 'job_applications' then 'applications' else 'partners' end;
 if TG_OP='INSERT' then
  if auth.role() in ('anon','authenticated') and (new.assigned_to is not null or new.internal_notes is not null or new.status::text<>'new' or new.deleted_at is not null or new.last_contacted_at is not null) then raise exception 'invalid_initial_state' using errcode='42501'; end if;
  if m='applications' then
   if auth.role() in ('anon','authenticated') and new.cv_path is not null then raise exception 'validated_server_upload_required' using errcode='42501'; end if;
  end if;
  return new;
 end if;
 if auth.role()='service_role' then return new; end if;
 if not public.workspace_allowed(m,'view') then raise exception 'permission_denied' using errcode='42501'; end if;
 if new.status is distinct from old.status and not public.workspace_allowed(m,'status') and not ((new.status::text='archived' or old.status::text='archived') and public.workspace_allowed(m,'archive')) then raise exception 'status_permission_required' using errcode='42501'; end if;
 if new.assigned_to is distinct from old.assigned_to and not public.workspace_allowed(m,'assign') then raise exception 'assignment_permission_required' using errcode='42501'; end if;
 if new.deleted_at is distinct from old.deleted_at and not public.workspace_allowed(m,'archive') then raise exception 'archive_permission_required' using errcode='42501'; end if;
 if new.internal_notes is distinct from old.internal_notes and not public.workspace_allowed(m,'manage') then raise exception 'edit_permission_required' using errcode='42501'; end if;
 if (to_jsonb(new)-array['status','assigned_to','internal_notes','deleted_at','updated_at','status_history']) is distinct from (to_jsonb(old)-array['status','assigned_to','internal_notes','deleted_at','updated_at','status_history']) and not public.workspace_allowed(m,'manage') then raise exception 'edit_permission_required' using errcode='42501'; end if;
 if m='partners' and new.status::text='approved' and old.status is distinct from new.status and not public.workspace_allowed(m,'manage') then raise exception 'approval_permission_required' using errcode='42501'; end if;
 if m='applications' and new.status::text='contacted' and old.status is distinct from new.status then new.last_contacted_at:=clock_timestamp(); end if;
 if new.assigned_to is not null and not exists(select 1 from public.admin_profiles p where p.id=new.assigned_to and p.status='active' and p.deleted_at is null and public.has_permission(p.id,m||'.view')) then raise exception 'invalid_assignee'; end if;
 if m='applications' and new.status is distinct from old.status then
  old_status:=old.status::text; next_status:=new.status::text;
  if not ((next_status='archived') or (old_status='archived' and next_status='under_review') or
    (old_status='new' and next_status in ('under_review','rejected')) or
    (old_status='under_review' and next_status in ('contacted','approved','rejected')) or
    (old_status='contacted' and next_status in ('under_review','approved','rejected')) or
    (old_status in ('approved','rejected') and next_status='under_review')) then raise exception 'invalid_status_transition'; end if;
 end if;
 if m='partners' and new.status is distinct from old.status then
  old_status:=old.status::text; next_status:=new.status::text;
  if not (next_status='archived' or next_status='withdrawn' or
   (old_status in ('archived','rejected','withdrawn','approved') and next_status='under_review') or
   (old_status='new' and next_status in ('under_review','rejected')) or
   (old_status='under_review' and next_status in ('contacted','completion_required','qualifying','rejected')) or
   (old_status='contacted' and next_status in ('under_review','completion_required','qualifying','rejected')) or
   (old_status='completion_required' and next_status in ('under_review','qualifying','rejected')) or
   (old_status='qualifying' and next_status in ('completion_required','final_review','rejected')) or
   (old_status='final_review' and next_status in ('qualifying','contracting','rejected')) or
   (old_status='contracting' and next_status in ('final_review','approved','rejected'))) then raise exception 'invalid_status_transition';end if;
 end if;
 return new;
end $$;

create function admin_private.audit_intake() returns trigger language plpgsql security definer set search_path='' as $$
declare m text; event_name text; delta jsonb:='{}'; event_id uuid;
begin
 m:=case TG_TABLE_NAME when 'job_applications' then 'applications' else 'partners' end;
 if TG_OP='INSERT' then event_name:='created';
 else
  event_name:='updated';
  if new.status is distinct from old.status then delta:=delta||jsonb_build_object('status',jsonb_build_object('from',old.status,'to',new.status)); event_name:='status'; end if;
  if new.assigned_to is distinct from old.assigned_to then delta:=delta||jsonb_build_object('assigned_to',jsonb_build_object('from',old.assigned_to,'to',new.assigned_to)); event_name:='assigned'; end if;
  if new.deleted_at is distinct from old.deleted_at then event_name:=case when new.deleted_at is null then 'restored' else 'archived' end; end if;
  if new.internal_notes is distinct from old.internal_notes then delta:=delta||jsonb_build_object('notes_changed',true); if event_name='updated' then event_name:='notes'; end if; end if;
  if to_jsonb(new)-array['updated_at','status_history'] = to_jsonb(old)-array['updated_at','status_history'] then return new; end if;
 end if;
 insert into public.admin_intake_events(module,record_id,actor_id,event,changes) values(m,new.id,auth.uid(),event_name,delta) returning id into event_id;
 if TG_OP='UPDATE' and new.assigned_to is not null and (new.assigned_to is distinct from old.assigned_to or new.status is distinct from old.status) then
  insert into public.admin_notifications(recipient_id,event_id,module,record_id,event) values(new.assigned_to,event_id,m,new.id,event_name) on conflict do nothing;
 end if;
 return new;
end $$;
create trigger workspace_guard before insert or update on public.job_applications for each row execute function admin_private.guard_intake();
create trigger workspace_guard before insert or update on public.partner_applications for each row execute function admin_private.guard_intake();
create trigger workspace_audit after insert or update on public.job_applications for each row execute function admin_private.audit_intake();
create trigger workspace_audit after insert or update on public.partner_applications for each row execute function admin_private.audit_intake();

create function public.workspace_update(module text, record_id uuid, expected_updated_at timestamptz, patch jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare tbl text; before_row jsonb; after_row jsonb; allowed text[]; key text; value jsonb; assignments text:='';
begin
 if module not in ('applications','partners') or not public.workspace_allowed(module,'view') then raise exception 'permission_denied' using errcode='42501'; end if;
 tbl:=case module when 'applications' then 'job_applications' else 'partner_applications' end;
 execute format('select to_jsonb(r) from public.%I r where id=$1 for update',tbl) into before_row using record_id;
 if before_row is null then raise exception 'record_not_found'; end if;
 if expected_updated_at is null or (before_row->>'updated_at')::timestamptz<>expected_updated_at then raise exception 'edit_conflict' using errcode='PT409'; end if;
 allowed:=array['status','assigned_to','internal_notes','deleted_at'];
 if module='partners' then allowed:=allowed||array['completion_requirements','completion_channel','contract_reference','country_annex_reference','approval_notice_reference','operational_active']; end if;
 for key,value in select * from jsonb_each(patch) loop
  if not key=any(allowed) then raise exception 'unsupported_field'; end if;
  if key in ('completion_requirements','completion_channel','contract_reference','country_annex_reference','approval_notice_reference','operational_active') and not public.workspace_allowed(module,'manage') then raise exception 'permission_denied' using errcode='42501'; end if;
  if key='internal_notes' and length(value#>>'{}')>10000 then raise exception 'notes_too_long'; end if;
  assignments:=assignments||case when assignments='' then '' else ',' end||format('%I=(jsonb_populate_record(null::public.%I,$1)).%I',key,tbl,key);
 end loop;
 if assignments='' then return before_row; end if;
 execute format('update public.%I set %s where id=$2 returning to_jsonb(%I.*)',tbl,assignments,tbl) into after_row using patch,record_id;
 return after_row;
end $$;

-- Existing manage remains a compatible umbrella; narrow actions can be granted independently.
create policy workspace_jobs_update on public.job_applications for update to authenticated using(public.workspace_allowed('applications','view') and (public.workspace_allowed('applications','manage') or public.workspace_allowed('applications','status') or public.workspace_allowed('applications','assign') or public.workspace_allowed('applications','archive'))) with check(public.workspace_allowed('applications','view'));
create policy workspace_partners_update on public.partner_applications for update to authenticated using(public.workspace_allowed('partners','view') and (public.workspace_allowed('partners','manage') or public.workspace_allowed('partners','assign') or public.workspace_allowed('partners','status') or public.workspace_allowed('partners','archive'))) with check(public.workspace_allowed('partners','view'));

-- Retain the existing partner guard and its approval requirements, while allowing
-- the central field-level guard to authorize narrow review/assignment actions.
do $compat$
declare definition text;
begin
 select pg_get_functiondef('public.guard_partner_workflow()'::regprocedure) into definition;
 definition:=replace(definition,'if not public.current_user_has_permission(''partners.manage'') then',
 'if not (public.workspace_allowed(''partners'',''manage'') or public.workspace_allowed(''partners'',''status'') or public.workspace_allowed(''partners'',''assign'') or public.workspace_allowed(''partners'',''archive'')) then');
 execute definition;
end $compat$;

create function public.workspace_save_task(task_id uuid,module text,record_id uuid,title text,assignee uuid,due_at timestamptz default null,next_status text default 'open',expected_updated_at timestamptz default null) returns uuid language plpgsql security definer set search_path='' as $$
declare current_task public.admin_followups; task_uuid uuid; exists_record boolean; event_id uuid;
begin
 if module not in ('applications','partners') or not public.workspace_allowed(module,'view') then raise exception 'permission_denied' using errcode='42501'; end if;
 if length(btrim(title)) not between 1 and 200 or next_status not in ('open','done','cancelled') then raise exception 'invalid_task'; end if;
 if task_id is not null then
  select * into current_task from public.admin_followups f where f.id=task_id for update;
  if not found or current_task.module<>module or current_task.record_id<>record_id then raise exception 'task_not_found'; end if;
  if current_task.updated_at is distinct from expected_updated_at then raise exception 'edit_conflict' using errcode='PT409'; end if;
 end if;
 if not public.workspace_allowed(module,'assign') then
  if task_id is null or current_task.assigned_to<>auth.uid() or assignee<>current_task.assigned_to or title<>current_task.title or due_at is distinct from current_task.due_at then raise exception 'permission_denied' using errcode='42501'; end if;
 end if;
 if not exists(select 1 from public.admin_profiles p where p.id=assignee and p.status='active' and p.deleted_at is null and public.has_permission(p.id,module||'.view')) then raise exception 'invalid_assignee'; end if;
 if module='applications' then select exists(select 1 from public.job_applications r where r.id=record_id) into exists_record;
 else select exists(select 1 from public.partner_applications r where r.id=record_id) into exists_record; end if;
 if not exists_record then raise exception 'record_not_found'; end if;
 if task_id is null then
  insert into public.admin_followups(module,record_id,title,assigned_to,due_at,status,created_by) values(module,record_id,btrim(title),assignee,due_at,next_status,auth.uid()) returning id into task_uuid;
 else
  update public.admin_followups f set title=btrim(workspace_save_task.title),assigned_to=assignee,due_at=workspace_save_task.due_at,status=next_status,updated_at=clock_timestamp() where f.id=task_id returning id into task_uuid;
 end if;
 insert into public.admin_intake_events(module,record_id,actor_id,event,changes) values(module,record_id,auth.uid(),case when task_id is null then 'task_created' else 'task_updated' end,jsonb_build_object('task_id',task_uuid,'status',next_status)) returning id into event_id;
 if task_id is null or current_task.assigned_to is distinct from assignee then
 insert into public.admin_notifications(recipient_id,event_id,module,record_id,event) values(assignee,event_id,module,record_id,'assigned') on conflict do nothing; end if;
 return task_uuid;
end $$;
create function public.workspace_read_notification(notification_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
 update public.admin_notifications n set read_at=coalesce(n.read_at,now()) where n.id=notification_id and n.recipient_id=auth.uid() and public.workspace_allowed(n.module,'view');
end $$;

drop policy if exists admin_read_application_files on storage.objects;
create policy admin_read_application_files on storage.objects for select to authenticated using(bucket_id='application-files' and (
 (public.workspace_allowed('applications','attachments') and exists(select 1 from public.job_applications j where j.cv_path=name)) or
 (public.workspace_allowed('partners','attachments') and exists(select 1 from public.partner_applications p where p.attachment_path=name))));

-- An export uses this permission boundary, rather than an unrestricted client dump.
create function public.workspace_roles() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_super_admin(auth.uid()) then raise exception 'permission_denied' using errcode='42501'; end if;
 return jsonb_build_object('roles',(select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('permission_keys',coalesce((select jsonb_agg(p.key) from public.role_permissions rp join public.permissions p on p.id=rp.permission_id where rp.role_id=r.id),'[]'::jsonb))),'[]'::jsonb) from public.roles r where r.deleted_at is null),'permissions',(select coalesce(jsonb_agg(jsonb_build_object('key',p.key,'name_ar',p.name_ar,'name_en',p.name_en)),'[]'::jsonb) from public.permissions p where p.deleted_at is null and p.is_active));
end $$;
create function public.workspace_save_role(target_role uuid,role_key text,name_ar text,name_en text,permission_keys text[]) returns uuid language plpgsql security definer set search_path='' as $$
declare role_uuid uuid; existing_key text; old_keys jsonb;
begin
 if auth.uid() is null or not public.is_super_admin(auth.uid()) then raise exception 'permission_denied' using errcode='42501'; end if;
 if role_key !~ '^[a-z][a-z0-9_]{2,49}$' or length(btrim(name_ar)) not between 1 and 100 or length(btrim(name_en)) not between 1 and 100 then raise exception 'invalid_role'; end if;
 if role_key='super_admin' or exists(select 1 from public.admin_user_roles ur where ur.user_id=auth.uid() and ur.role_id=target_role and ur.deleted_at is null) then raise exception 'cannot_modify_own_or_super_role' using errcode='42501'; end if;
 if exists(select 1 from unnest(permission_keys) k where not exists(select 1 from public.permissions p where p.key=k and p.is_active and p.deleted_at is null)) then raise exception 'unknown_permission'; end if;
 if target_role is null then
  insert into public.roles(key,name_ar,name_en,is_active) values(role_key,btrim(name_ar),btrim(name_en),true) returning id into role_uuid;
 else
  select r.key into existing_key from public.roles r where r.id=target_role and r.deleted_at is null for update;
  if existing_key is null or existing_key<>role_key then raise exception 'invalid_role'; end if;
  select coalesce(jsonb_agg(p.key),'[]'::jsonb) into old_keys from public.role_permissions rp join public.permissions p on p.id=rp.permission_id where rp.role_id=target_role;
  update public.roles r set name_ar=btrim(workspace_save_role.name_ar),name_en=btrim(workspace_save_role.name_en),updated_at=clock_timestamp() where r.id=target_role; role_uuid:=target_role;
 end if;
 delete from public.role_permissions rp where rp.role_id=role_uuid;
 insert into public.role_permissions(role_id,permission_id) select role_uuid,p.id from public.permissions p where p.key=any(permission_keys) on conflict do nothing;
 insert into public.admin_audit_logs(actor_user_id,action,entity_type,entity_id,old_values,new_values) values(auth.uid(),'role_permissions_saved','roles',role_uuid,jsonb_build_object('permission_keys',old_keys),jsonb_build_object('permission_keys',to_jsonb(permission_keys)));
 return role_uuid;
end $$;
revoke all on function public.workspace_roles(),public.workspace_save_role(uuid,text,text,text,text[]) from public;
grant execute on function public.workspace_roles(),public.workspace_save_role(uuid,text,text,text,text[]) to authenticated;
grant select,delete on public.admin_followups,public.admin_intake_events,public.admin_notifications to service_role;

create function public.workspace_export(module text, filters jsonb default '{}') returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare source jsonb;
begin
 if not public.workspace_allowed(module,'export') then raise exception 'permission_denied' using errcode='42501'; end if;
 source:=public.workspace_list(module,filters||'{"size":20}'::jsonb);
 return jsonb_build_object('total',source->'total','items',coalesce((select jsonb_agg(jsonb_build_object('id',r->'id','full_name',r->'full_name','company_name',r->'company_name','country',r->'country','status',r->'status','created_at',r->'created_at','application_kind',r->'application_kind','partner_type',r->'partner_type')) from jsonb_array_elements(source->'items') r),'[]'::jsonb));
end $$;

revoke all on function public.workspace_context(),public.workspace_list(text,jsonb),public.workspace_assignees(text),public.workspace_update(text,uuid,timestamptz,jsonb),public.workspace_save_task(uuid,text,uuid,text,uuid,timestamptz,text,timestamptz),public.workspace_read_notification(uuid),public.workspace_export(text,jsonb) from public;
grant execute on function public.workspace_context(),public.workspace_list(text,jsonb),public.workspace_assignees(text),public.workspace_update(text,uuid,timestamptz,jsonb),public.workspace_save_task(uuid,text,uuid,text,uuid,timestamptz,text,timestamptz),public.workspace_read_notification(uuid),public.workspace_export(text,jsonb) to authenticated;
revoke all on function admin_private.guard_intake(),admin_private.audit_intake() from public;
notify pgrst,'reload schema';
commit;
