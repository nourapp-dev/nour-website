begin;
create function catalogue_private.media_path_used(bucket text,path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_settings s where s.deleted_at is null and s.setting_key in ('website.home_presentation','website.home_presentation_draft','home.ceo_message') and position('/storage/v1/object/public/'||$1||'/'||$2 in s.value_json::text)>0)
 or exists(select 1 from public.website_presentation_versions v where position('/storage/v1/object/public/'||$1||'/'||$2 in v.content::text)>0)
 or exists(select 1 from public.media m where m.bucket=$1 and m.path=$2 and (exists(select 1 from public.programs p where p.cover_media_id=m.id and p.deleted_at is null) or exists(select 1 from public.countries c where c.flag_media_id=m.id and c.deleted_at is null) or exists(select 1 from public.hotels h where h.cover_media_id=m.id and h.deleted_at is null) or exists(select 1 from public.hotel_media hm where hm.media_id=m.id)))
$$;
revoke all on function catalogue_private.media_path_used(text,text) from public;
grant execute on function catalogue_private.media_path_used(text,text) to authenticated;
create function public.website_media_in_use(media_id uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
declare bucket text;path text;
begin
 if auth.uid() is null or not(public.current_user_has_permission('media.read') or public.current_user_has_permission('media.delete')) then raise exception 'permission_denied' using errcode='42501';end if;
 select m.bucket,m.path into bucket,path from public.media m where m.id=media_id;
 if bucket is null then return false;end if;return catalogue_private.media_path_used(bucket,path);
end $$;
revoke all on function public.website_media_in_use(uuid) from public;
grant execute on function public.website_media_in_use(uuid) to authenticated;
create policy protect_content_storage_delete on storage.objects as restrictive for delete to authenticated using(bucket_id<>'media' or not catalogue_private.media_path_used(bucket_id,name));
create policy protect_content_storage_update on storage.objects as restrictive for update to authenticated using(bucket_id<>'media' or not catalogue_private.media_path_used(bucket_id,name)) with check(bucket_id<>'media' or not catalogue_private.media_path_used(bucket_id,name));
create function catalogue_private.guard_media_delete() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (tg_op='DELETE' or new.deleted_at is not null) and catalogue_private.media_path_used(old.bucket,old.path) then raise exception 'media_used_by_content_or_revision';end if;
 if tg_op='DELETE' then return old;end if;return new;
end $$;
create trigger protect_used_media before delete or update of deleted_at on public.media for each row execute function catalogue_private.guard_media_delete();
create function catalogue_private.guard_program_cover() returns trigger language plpgsql security invoker set search_path='' as $$
declare image public.media;
begin
 if new.cover_media_id is null or (tg_op='UPDATE' and new.cover_media_id is not distinct from old.cover_media_id) then return new;end if;
 select * into image from public.media m where m.id=new.cover_media_id and m.deleted_at is null;
 if image.id is null or image.width is null or image.height is null or image.width<800 or image.height<450 or image.size_bytes>5242880 or abs(image.width::numeric/image.height-16.0/9)>0.01 or image.mime_type not in ('image/png','image/jpeg','image/webp') then raise exception 'program_cover_requires_16_9_min_800_450_max_5mb';end if;
 return new;
end $$;
create trigger validate_program_cover before insert or update of cover_media_id on public.programs for each row execute function catalogue_private.guard_program_cover();
revoke all on function catalogue_private.guard_media_delete(),catalogue_private.guard_program_cover() from public;
notify pgrst,'reload schema';
commit;
