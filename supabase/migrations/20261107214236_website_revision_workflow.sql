begin;
alter table public.platform_settings add column if not exists content_revision bigint not null default 0,add column if not exists base_revision bigint not null default 0;
-- Initialize only an empty legacy draft; never overwrite meaningful saved draft data.
update public.platform_settings d set value_json=p.value_json,base_revision=p.content_revision from public.platform_settings p where d.setting_key='website.home_presentation_draft' and p.setting_key='website.home_presentation' and d.value_json='{}'::jsonb and p.value_json<>'{}'::jsonb and d.deleted_at is null and p.deleted_at is null;
create table public.website_presentation_versions(
 id bigint generated always as identity primary key,
 content jsonb not null,
 actor_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default clock_timestamp(),
 restored_from bigint references public.website_presentation_versions(id),
 operation text not null check(operation in ('baseline','publish','restore'))
);
alter table public.website_presentation_versions enable row level security;
revoke all on public.website_presentation_versions from anon,authenticated;
grant select on public.website_presentation_versions to authenticated;
create policy website_versions_read on public.website_presentation_versions for select to authenticated using(public.current_user_has_permission('website.edit') or public.current_user_has_permission('website.publish') or public.current_user_has_permission('settings.manage'));
insert into public.website_presentation_versions(content,actor_id,operation) select value_json,updated_by,'baseline' from public.platform_settings where setting_key='website.home_presentation' and deleted_at is null;

create function catalogue_private.immutable_website_version() returns trigger language plpgsql set search_path='' as $$begin raise exception 'immutable_content_version';end $$;
create trigger immutable_website_version before update or delete on public.website_presentation_versions for each row execute function catalogue_private.immutable_website_version();
revoke all on function catalogue_private.immutable_website_version() from public;
create policy website_owned_insert on public.platform_settings as restrictive for insert to authenticated with check(setting_key not in ('website.home_presentation','website.home_presentation_draft'));
create policy website_owned_update on public.platform_settings as restrictive for update to authenticated using(setting_key not in ('website.home_presentation','website.home_presentation_draft')) with check(setting_key not in ('website.home_presentation','website.home_presentation_draft'));
create policy website_owned_delete on public.platform_settings as restrictive for delete to authenticated using(setting_key not in ('website.home_presentation','website.home_presentation_draft'));

create or replace function public.update_platform_setting(p_setting_key text,p_value_json jsonb) returns public.platform_settings language plpgsql security definer set search_path='' as $$
declare result public.platform_settings;
begin
 if not public.current_user_has_permission('settings.manage') then raise exception 'permission_denied' using errcode='42501';end if;
 if btrim(p_setting_key) in ('website.home_presentation','website.home_presentation_draft') then raise exception 'use_website_workflow' using errcode='42501';end if;
 update public.platform_settings set value_json=p_value_json,updated_by=auth.uid(),updated_at=clock_timestamp() where setting_key=btrim(p_setting_key) and deleted_at is null returning * into result;
 if result.id is null then raise exception 'setting_not_found';end if;return result;
end $$;

create function public.website_content_state() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not (public.current_user_has_permission('website.edit') or public.current_user_has_permission('website.publish') or public.current_user_has_permission('settings.manage')) then raise exception 'permission_denied' using errcode='42501';end if;
 select jsonb_object_agg(setting_key,jsonb_build_object('value',value_json,'revision',content_revision,'baseRevision',base_revision,'updatedAt',updated_at,'updatedBy',updated_by,'updatedByName',(select p.full_name from public.admin_profiles p where p.id=updated_by))) into result from public.platform_settings where setting_key in ('website.home_presentation','website.home_presentation_draft') and deleted_at is null;
 return result;
end $$;
create function public.website_content_write(action text,content jsonb default null,expected_draft bigint default null,expected_published bigint default null,restore_id bigint default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare draft public.platform_settings;published public.platform_settings;source public.website_presentation_versions;value jsonb;new_id bigint;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 if action='draft' then
  if not(public.current_user_has_permission('website.edit') or public.current_user_has_permission('settings.manage')) then raise exception 'edit_permission_required' using errcode='42501';end if;
 elsif action in ('publish','restore') then
  if not public.current_user_has_permission('website.publish') then raise exception 'publish_permission_required' using errcode='42501';end if;
 else raise exception 'invalid_action';end if;
 -- Both rows locked in a consistent order; readers see one committed JSON snapshot.
 perform id from public.platform_settings where setting_key in ('website.home_presentation','website.home_presentation_draft') order by setting_key for update;
 select * into published from public.platform_settings where setting_key='website.home_presentation' and deleted_at is null;
 select * into draft from public.platform_settings where setting_key='website.home_presentation_draft' and deleted_at is null;
 if published.id is null or draft.id is null then raise exception 'missing_content_settings';end if;
 if expected_draft is distinct from draft.content_revision or expected_published is distinct from published.content_revision then raise exception 'content_conflict_reload' using errcode='PT409';end if;
 if action='draft' then
  if content is null or jsonb_typeof(content)<>'object' or octet_length(content::text)>250000 then raise exception 'invalid_content';end if;
  update public.platform_settings set value_json=content,is_public=false,content_revision=content_revision+1,base_revision=published.content_revision,updated_by=auth.uid(),updated_at=clock_timestamp() where id=draft.id;
 else
  if action='publish' then
   if draft.base_revision<>published.content_revision then raise exception 'draft_base_conflict' using errcode='PT409';end if;
   value:=draft.value_json;
  else
   select * into source from public.website_presentation_versions where id=restore_id;
   if not found then raise exception 'version_not_found';end if;value:=source.content;
  end if;
  -- Launch remains closed; store URLs can be staged but never enable app/booking.
  if jsonb_typeof(value)<>'object' then raise exception 'invalid_content';end if;
  if action='publish' then
   if coalesce(btrim(value#>>'{hero,title,ar}'),'')='' or coalesce(btrim(value#>>'{hero,title,en}'),'')='' or coalesce(btrim(value#>>'{showcase,title,ar}'),'')='' or coalesce(btrim(value#>>'{showcase,title,en}'),'')='' then raise exception 'incomplete_bilingual_titles';end if;
  end if;
  insert into public.website_presentation_versions(content,actor_id,restored_from,operation) values(value,auth.uid(),case when action='restore' then restore_id end,action) returning id into new_id;
  update public.platform_settings set value_json=value,is_public=true,content_revision=content_revision+1,updated_by=auth.uid(),updated_at=clock_timestamp() where id=published.id;
  update public.platform_settings set value_json=value,is_public=false,content_revision=content_revision+1,base_revision=published.content_revision+1,updated_by=auth.uid(),updated_at=clock_timestamp() where id=draft.id;
 end if;
 return public.website_content_state();
end $$;
revoke all on function public.website_content_state(),public.website_content_write(text,jsonb,bigint,bigint,bigint) from public;
grant execute on function public.website_content_state(),public.website_content_write(text,jsonb,bigint,bigint,bigint) to authenticated;
notify pgrst,'reload schema';
commit;
