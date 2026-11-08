begin;
-- Revision is an optimistic concurrency counter; versionId identifies the immutable published snapshot.
create or replace function public.website_content_state() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not (public.current_user_has_permission('website.edit') or public.current_user_has_permission('website.publish') or public.current_user_has_permission('settings.manage')) then raise exception 'permission_denied' using errcode='42501';end if;
 select jsonb_object_agg(s.setting_key,jsonb_build_object('value',s.value_json,'revision',s.content_revision,'baseRevision',s.base_revision,'versionId',case when s.setting_key='website.home_presentation' then (select v.id from public.website_presentation_versions v where v.content=s.value_json order by v.id desc limit 1) else null end,'updatedAt',s.updated_at,'updatedBy',s.updated_by,'updatedByName',(select p.full_name from public.admin_profiles p where p.id=s.updated_by))) into result from public.platform_settings s where s.setting_key in ('website.home_presentation','website.home_presentation_draft') and s.deleted_at is null;
 return result;
end $$;
revoke all on function public.website_content_state() from public,anon;
grant execute on function public.website_content_state() to authenticated;
notify pgrst,'reload schema';
commit;
