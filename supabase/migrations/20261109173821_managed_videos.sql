begin;
create table public.videos(
 id uuid primary key default gen_random_uuid(),
 title_ar text not null default '' check(length(title_ar)<=180),title_en text not null default '' check(length(title_en)<=180),
 description_ar text not null default '' check(length(description_ar)<=1600),description_en text not null default '' check(length(description_en)<=1600),
 source_kind text not null default 'link' check(source_kind in ('link','file')),
 source_url text not null default '',storage_path text,
 cover_url text not null default '',category text not null default 'about' check(category in ('about','app','programs','experiences')),
 orientation text not null default 'landscape' check(orientation in ('landscape','portrait')),
 duration_seconds integer not null default 0 check(duration_seconds between 0 and 86400),
 status text not null default 'draft' check(status in ('draft','published','hidden')),
 show_on_home boolean not null default true,is_featured boolean not null default false,
 sort_order integer not null default 0 check(sort_order>=0),cta_ar text not null default '',cta_en text not null default '',cta_href text not null default '',
 created_by uuid references auth.users(id) on delete set null default auth.uid(),updated_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz,
 check((source_kind='file' and storage_path is not null and storage_path ~ '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(mp4|webm)$' and source_url='') or (source_kind='link' and storage_path is null and source_url<>'')),
 check(cta_href='' or cta_href ~ '^/(programs(/[a-z0-9-]+)?|get-app|become-a-partner|videos)$')
);
alter table public.videos enable row level security;
revoke all on public.videos from anon,authenticated;
grant select(id,title_ar,title_en,description_ar,description_en,source_kind,source_url,storage_path,cover_url,category,orientation,duration_seconds,status,show_on_home,is_featured,sort_order,cta_ar,cta_en,cta_href,created_at,updated_at,deleted_at) on public.videos to anon;
grant select,insert,update on public.videos to authenticated;
create policy videos_public_read on public.videos for select to anon,authenticated using(status='published' and deleted_at is null);
create policy videos_editor_read on public.videos for select to authenticated using(public.current_user_has_permission('website.edit') or public.current_user_has_permission('website.publish'));
create policy videos_editor_insert on public.videos for insert to authenticated with check(public.current_user_has_permission('website.edit'));
create policy videos_editor_update on public.videos for update to authenticated using(public.current_user_has_permission('website.edit')) with check(public.current_user_has_permission('website.edit'));
create index videos_public_order on public.videos(is_featured desc,sort_order,created_at desc) where status='published' and deleted_at is null;
create unique index videos_one_featured on public.videos(is_featured) where is_featured and status='published' and deleted_at is null;
create function catalogue_private.guard_video() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if current_user not in ('postgres','service_role') then
  if auth.uid() is null or not public.current_user_has_permission('website.edit') then raise exception 'permission_denied' using errcode='42501';end if;
  if (new.status='published' or (tg_op='UPDATE' and old.status='published')) and not public.current_user_has_permission('website.publish') then raise exception 'video_publish_permission_required' using errcode='42501';end if;
  if tg_op='INSERT' then new.created_by:=auth.uid();new.created_at:=clock_timestamp();else new.created_by:=old.created_by;new.created_at:=old.created_at;end if;
 end if;
 if new.source_kind='link' and new.source_url !~ '^(/videos/[a-zA-Z0-9/_-]+\.(mp4|webm)|https://(www\.|m\.)?youtube\.com/(watch\?v=[a-zA-Z0-9_-]{11}([&][^[:space:]]*)?|(shorts|embed)/[a-zA-Z0-9_-]{11})|https://youtu\.be/[a-zA-Z0-9_-]{11}(\?[^[:space:]]*)?|https://(www\.)?vimeo\.com/[0-9]+|https://player\.vimeo\.com/video/[0-9]+)$' then raise exception 'invalid_video_source';end if;
 if new.cover_url<>'' and new.cover_url !~ '^(/images/[a-zA-Z0-9_./-]+|https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/media/[a-zA-Z0-9_./-]+)$' then raise exception 'invalid_video_cover';end if;
 if position('..' in new.cover_url)>0 or position('..' in new.source_url)>0 then raise exception 'invalid_video_path';end if;
 if new.status='published' and (btrim(new.title_ar)='' or btrim(new.title_en)='' or new.cover_url='') then raise exception 'video_not_ready';end if;
 if new.status<>'published' or not new.show_on_home or new.deleted_at is not null then new.is_featured:=false;end if;
 new.updated_at:=clock_timestamp();new.updated_by:=auth.uid();return new;
end $$;
revoke all on function catalogue_private.guard_video() from public;
create trigger videos_guard before insert or update on public.videos for each row execute function catalogue_private.guard_video();
create function public.set_featured_video(video_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or not public.current_user_has_permission('website.edit') or not public.current_user_has_permission('website.publish') then raise exception 'permission_denied' using errcode='42501';end if;
 perform pg_advisory_xact_lock(814253);
 if not exists(select 1 from public.videos v where v.id=video_id and v.status='published' and v.show_on_home and v.deleted_at is null) then raise exception 'publish_home_video_first';end if;
 update public.videos set is_featured=false where is_featured;
 update public.videos set is_featured=true where id=video_id;
end $$;
revoke all on function public.set_featured_video(uuid) from public;
grant execute on function public.set_featured_video(uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('videos','videos',false,52428800,array['video/mp4','video/webm']);
create policy videos_storage_editor_read on storage.objects for select to authenticated using(bucket_id='videos' and (public.current_user_has_permission('website.edit') or public.current_user_has_permission('website.publish')));
create policy videos_storage_upload on storage.objects for insert to authenticated with check(bucket_id='videos' and public.current_user_has_permission('website.edit') and name ~ '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(mp4|webm)$');
create policy videos_storage_published_read on storage.objects for select to anon,authenticated using(bucket_id='videos' and exists(select 1 from public.videos v where v.storage_path=name and v.status='published' and v.deleted_at is null));
notify pgrst,'reload schema';
commit;
