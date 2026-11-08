-- Local-tested, additive catalogue and publication workflow. Never applied to production here.
begin;
create schema if not exists catalogue_private;
revoke all on schema catalogue_private from public;
grant usage on schema catalogue_private to anon,authenticated,service_role;

alter table public.countries
 add column market_status text check(market_status in ('setup','coming_soon','browsable','paused')),
 add column publication_status text check(publication_status in ('draft','published','hidden')),
 add column show_public boolean, add column show_on_map boolean,
 add column status_label_ar text,add column status_label_en text,
 add column phone_codes text[],add column currency_codes text[],add column timezones text[],
 add column directory_source text,add column flag_emoji text;
-- Existing NULL values are explicitly legacy/unclassified; do not infer a new market state.
alter table public.countries alter column market_status set default 'setup',alter column publication_status set default 'draft',alter column show_public set default false,alter column show_on_map set default false;
alter table public.departure_cities add column publication_status text check(publication_status in ('draft','published','hidden')),add column timezone text,add column show_on_map boolean;
alter table public.departure_cities alter column publication_status set default 'draft',alter column show_on_map set default true;
alter table public.program_meeting_points alter column program_id drop not null;
alter table public.program_meeting_points add column publication_status text check(publication_status in ('draft','published','hidden')),add column map_url text,add column arrival_instructions_ar text,add column arrival_instructions_en text;
alter table public.program_meeting_points alter column publication_status set default 'draft';
alter table public.program_departures add column meeting_point_id uuid references public.program_meeting_points(id) on delete restrict,add column departure_timezone text;
create index departures_meeting_point_idx on public.program_departures(meeting_point_id) where deleted_at is null;
create table public.meeting_point_operations(point_id uuid primary key references public.program_meeting_points(id) on delete restrict,contact_details text,updated_at timestamptz not null default now());
alter table public.meeting_point_operations enable row level security;
grant select,insert,update on public.meeting_point_operations to authenticated;
create policy point_ops_write on public.meeting_point_operations for all to authenticated using(public.current_user_has_permission('countries.update') or public.current_user_has_permission('programs.update')) with check(public.current_user_has_permission('countries.update') or public.current_user_has_permission('programs.update'));

insert into public.permissions(key,module,action,name_ar,name_en) values
 ('countries.publish','countries','publish','نشر الدول والمدن','Publish markets and cities'),
 ('website.edit','website','edit','تحرير مسودة الموقع','Edit website drafts'),
 ('website.publish','website','publish','نشر محتوى الموقع','Publish website content') on conflict(key) do nothing;

-- Private policy predicates have a fixed search_path and return only visibility booleans.
create function catalogue_private.country_visible(country_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.countries c where c.id=$1 and c.deleted_at is null and c.is_active and coalesce(c.show_public,c.is_active) and coalesce(c.publication_status,case when c.is_active then 'published' else 'hidden' end)='published')
$$;
create function catalogue_private.program_visible(program_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.programs p where p.id=$1 and p.status='published' and p.is_active and p.deleted_at is null and (p.country_id is null or exists(select 1 from public.countries c where c.id=p.country_id and catalogue_private.country_visible(c.id) and (c.market_status is null or c.market_status='browsable'))))
$$;
create function catalogue_private.city_visible(city_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.departure_cities c where c.id=$1 and c.deleted_at is null and c.is_active and coalesce(c.publication_status,'published')='published' and catalogue_private.country_visible(c.country_id))
$$;
revoke all on function catalogue_private.country_visible(uuid),catalogue_private.program_visible(uuid),catalogue_private.city_visible(uuid) from public;
grant execute on function catalogue_private.country_visible(uuid),catalogue_private.program_visible(uuid),catalogue_private.city_visible(uuid) to anon,authenticated,service_role;

-- Repair only the published read contract; never grant anonymous mutations/admin metadata.
grant select(id,name_ar,name_en,iso2,iso3,latitude,longitude,flag_media_id,is_active,deleted_at,sort_order,market_status,publication_status,show_public,show_on_map,status_label_ar,status_label_en,flag_emoji) on public.countries to anon;
grant select(id,title_ar,title_en,slug,summary_ar,summary_en,description_ar,description_en,country_id,duration_days,duration_nights,base_price,currency_code,cover_media_id,status,is_featured,is_active,sort_order,created_at,deleted_at,flight_inclusion,flight_notes_ar,flight_notes_en) on public.programs to anon;
grant select(id,bucket,path,file_name,mime_type,size_bytes,width,height,alt_ar,alt_en,deleted_at) on public.media to anon;
create policy catalogue_countries_public on public.countries for select to anon,authenticated using(catalogue_private.country_visible(id));
create policy catalogue_programs_public on public.programs for select to anon,authenticated using(catalogue_private.program_visible(id));
create policy catalogue_media_public on public.media for select to anon,authenticated using(deleted_at is null and (
 exists(select 1 from public.countries c where c.flag_media_id=media.id and catalogue_private.country_visible(c.id)) or
 exists(select 1 from public.programs p where p.cover_media_id=media.id and catalogue_private.program_visible(p.id)) or
 exists(select 1 from public.hotel_media hm join public.program_hotels ph on ph.hotel_id=hm.hotel_id where hm.media_id=media.id and catalogue_private.program_visible(ph.program_id)) or
 exists(select 1 from public.hotels h join public.program_hotels ph on ph.hotel_id=h.id where h.cover_media_id=media.id and catalogue_private.program_visible(ph.program_id))
));
drop policy cities_public_read on public.departure_cities;
create policy cities_public_read on public.departure_cities for select to anon,authenticated using(catalogue_private.city_visible(id));
drop policy "Public can read program departures" on public.program_departures;
create policy "Public can read program departures" on public.program_departures for select to anon,authenticated using(is_active and deleted_at is null and status<>'cancelled' and catalogue_private.program_visible(program_id) and (origin_city_id is null or catalogue_private.city_visible(origin_city_id)));
drop policy "Public can read program meeting points" on public.program_meeting_points;
create policy "Public can read program meeting points" on public.program_meeting_points for select to anon,authenticated using(is_active and deleted_at is null and coalesce(publication_status,'published')='published' and (city_id is null or catalogue_private.city_visible(city_id)) and (program_id is null or catalogue_private.program_visible(program_id)));
create policy catalogue_points_admin_read on public.program_meeting_points for select to authenticated using(public.current_user_has_permission('countries.read') or public.current_user_has_permission('programs.read'));
create policy catalogue_points_admin_insert on public.program_meeting_points for insert to authenticated with check(public.current_user_has_permission('countries.create') or public.current_user_has_permission('programs.update'));
create policy catalogue_points_admin_update on public.program_meeting_points for update to authenticated using(public.current_user_has_permission('countries.update') or public.current_user_has_permission('programs.update')) with check(public.current_user_has_permission('countries.update') or public.current_user_has_permission('programs.update'));

create or replace function public.validate_journey_location() returns trigger language plpgsql security invoker set search_path='' as $$
declare country uuid;city uuid;dep_city uuid;
begin
 if tg_table_name='program_departures' then city:=new.origin_city_id;else city:=new.city_id;end if;
 if city is not null then
  select c.country_id into country from public.departure_cities c where c.id=city and c.deleted_at is null;
  if country is null or (new.program_id is not null and not exists(select 1 from public.programs p where p.id=new.program_id and p.country_id=country)) then raise exception 'city_must_match_program_country';end if;
 end if;
 if tg_table_name='program_meeting_points' then
  if new.program_id is null and city is null then raise exception 'reusable_point_requires_city';end if;
  if new.departure_id is not null then
   select d.origin_city_id into dep_city from public.program_departures d where d.id=new.departure_id and d.program_id=new.program_id and d.deleted_at is null;
   if not found or dep_city is distinct from new.city_id then raise exception 'meeting_point_must_match_departure_city_and_program';end if;
  end if;
  if (new.latitude is null)<>(new.longitude is null) or new.latitude not between -90 and 90 or new.longitude not between -180 and 180 then raise exception 'invalid_map_coordinates';end if;
 end if;
 return new;
end $$;

create function catalogue_private.guard_location() returns trigger language plpgsql security invoker set search_path='' as $$
declare publication_changed boolean:=false;zone text;point_city uuid;point_program uuid;
begin
 if tg_table_name='countries' then
  zone:=new.timezone;
  if exists(select 1 from unnest(coalesce(new.timezones,'{}')) z where not exists(select 1 from pg_timezone_names t where t.name=z)) then raise exception 'invalid_timezone';end if;
  if tg_op='INSERT' then publication_changed:=coalesce(new.publication_status,'published')='published' or coalesce(new.show_public,false);
  else publication_changed:=new.publication_status is distinct from old.publication_status or new.show_public is distinct from old.show_public or new.show_on_map is distinct from old.show_on_map or ((new.market_status is null or new.market_status='browsable') and new.market_status is distinct from old.market_status) or ((new.is_active and new.deleted_at is null and coalesce(new.publication_status,'published')='published') and (new.is_active is distinct from old.is_active or new.deleted_at is distinct from old.deleted_at));end if;
 elsif tg_table_name='departure_cities' then
  zone:=new.timezone;
  if tg_op='INSERT' then publication_changed:=coalesce(new.publication_status,'published')='published';
  else publication_changed:=new.publication_status is distinct from old.publication_status or new.show_on_map is distinct from old.show_on_map or ((new.is_active and new.deleted_at is null and coalesce(new.publication_status,'published')='published') and (new.is_active is distinct from old.is_active or new.deleted_at is distinct from old.deleted_at));end if;
 elsif tg_table_name='program_departures' then
  zone:=new.departure_timezone;
  if new.meeting_point_id is not null then
   select m.city_id,m.program_id into point_city,point_program from public.program_meeting_points m where m.id=new.meeting_point_id and m.deleted_at is null;
   if point_city is null or point_city is distinct from new.origin_city_id or (point_program is not null and point_program<>new.program_id) then raise exception 'departure_point_city_program_mismatch';end if;
  end if;
 elsif tg_table_name='program_meeting_points' then
  if tg_op='INSERT' then publication_changed:=coalesce(new.publication_status,'published')='published';
  else publication_changed:=new.publication_status is distinct from old.publication_status or ((new.is_active and new.deleted_at is null and coalesce(new.publication_status,'published')='published') and (new.is_active is distinct from old.is_active or new.deleted_at is distinct from old.deleted_at));end if;
  if exists(select 1 from public.program_departures d where d.meeting_point_id=new.id and d.deleted_at is null and d.origin_city_id is distinct from new.city_id) then raise exception 'point_used_by_departure_city';end if;
  if new.map_url is not null and new.map_url !~ '^https://[^/@[:space:]]+(/[^[:space:]]*)?$' then raise exception 'invalid_map_url';end if;
  if new.publication_status='published' and (new.latitude is null or new.longitude is null or new.city_id is null) then raise exception 'published_point_requires_coordinates_city';end if;
  if publication_changed and new.program_id is not null and public.current_user_has_permission('programs.publish') then publication_changed:=false;end if;
 end if;
 if nullif(zone,'') is not null and not exists(select 1 from pg_timezone_names t where t.name=zone) then raise exception 'invalid_timezone';end if;
 if publication_changed and not public.current_user_has_permission('countries.publish') and current_user not in ('postgres','service_role') then raise exception 'publication_permission_required' using errcode='42501';end if;
 return new;
end $$;
create trigger catalogue_location_guard before insert or update on public.countries for each row execute function catalogue_private.guard_location();
create trigger catalogue_location_guard before insert or update on public.departure_cities for each row execute function catalogue_private.guard_location();
create trigger catalogue_location_guard before insert or update on public.program_meeting_points for each row execute function catalogue_private.guard_location();
create trigger catalogue_location_guard before insert or update on public.program_departures for each row execute function catalogue_private.guard_location();
create function catalogue_private.protect_location_delete() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_table_name='countries' then
  if exists(select 1 from public.departure_cities c where c.country_id=old.id) or exists(select 1 from public.programs p where p.country_id=old.id) then raise exception 'linked_location_archive_instead';end if;
 elsif tg_table_name='departure_cities' then
  if exists(select 1 from public.program_departures d where d.origin_city_id=old.id) or exists(select 1 from public.program_meeting_points m where m.city_id=old.id) then raise exception 'linked_location_archive_instead';end if;
 elsif tg_table_name='program_meeting_points' then
  if old.program_id is not null or old.departure_id is not null or exists(select 1 from public.program_departures d where d.meeting_point_id=old.id) then raise exception 'linked_location_archive_instead';end if;
 end if;
 return old;
end $$;
create trigger protect_catalogue_delete before delete on public.countries for each row execute function catalogue_private.protect_location_delete();
create trigger protect_catalogue_delete before delete on public.departure_cities for each row execute function catalogue_private.protect_location_delete();
create trigger protect_catalogue_delete before delete on public.program_meeting_points for each row execute function catalogue_private.protect_location_delete();
revoke all on function catalogue_private.guard_location(),catalogue_private.protect_location_delete() from public;
create index cities_country_live_idx on public.departure_cities(country_id) where deleted_at is null;
create function public.catalogue_country_counts() returns table(country_id uuid,cities bigint,published_programs bigint) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.current_user_has_permission('countries.read') then raise exception 'permission_denied' using errcode='42501';end if;
 return query select c.id,(select count(*) from public.departure_cities d where d.country_id=c.id and d.is_active and d.deleted_at is null and coalesce(d.publication_status,'published')='published'),(select count(*) from public.programs p where p.country_id=c.id and p.status='published' and p.is_active and p.deleted_at is null) from public.countries c where c.deleted_at is null;
end $$;
revoke all on function public.catalogue_country_counts() from public;
grant execute on function public.catalogue_country_counts() to authenticated;

create function public.catalogue_save_point(input jsonb,expected_at timestamptz default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare point public.program_meeting_points;previous public.program_meeting_points;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 point:=jsonb_populate_record(null::public.program_meeting_points,input-array['contact_details']);
 if point.id is null then
  if not(public.current_user_has_permission('countries.create') or public.current_user_has_permission('programs.update')) then raise exception 'permission_denied' using errcode='42501';end if;
  insert into public.program_meeting_points(program_id,city_id,name_ar,name_en,address_ar,address_en,latitude,longitude,is_active,sort_order,publication_status,map_url,arrival_instructions_ar,arrival_instructions_en) values(point.program_id,point.city_id,point.name_ar,point.name_en,point.address_ar,point.address_en,point.latitude,point.longitude,coalesce(point.is_active,true),coalesce(point.sort_order,0),coalesce(point.publication_status,'draft'),point.map_url,point.arrival_instructions_ar,point.arrival_instructions_en) returning * into point;
 else
  if not(public.current_user_has_permission('countries.update') or public.current_user_has_permission('programs.update')) then raise exception 'permission_denied' using errcode='42501';end if;
  select * into previous from public.program_meeting_points m where m.id=point.id for update;
  if not found then raise exception 'point_not_found';end if;
  if previous.updated_at is distinct from expected_at then raise exception 'edit_conflict' using errcode='PT409';end if;
  update public.program_meeting_points m set city_id=point.city_id,name_ar=point.name_ar,name_en=point.name_en,address_ar=point.address_ar,address_en=point.address_en,latitude=point.latitude,longitude=point.longitude,is_active=point.is_active,sort_order=point.sort_order,publication_status=point.publication_status,map_url=point.map_url,arrival_instructions_ar=point.arrival_instructions_ar,arrival_instructions_en=point.arrival_instructions_en,updated_at=clock_timestamp() where m.id=point.id returning * into point;
 end if;
 if input?'contact_details' then
  if length(coalesce(input->>'contact_details',''))>2000 then raise exception 'contact_too_long';end if;
  insert into public.meeting_point_operations(point_id,contact_details) values(point.id,nullif(btrim(input->>'contact_details'),'')) on conflict(point_id) do update set contact_details=excluded.contact_details,updated_at=clock_timestamp();
 end if;
 return to_jsonb(point);
end $$;
revoke all on function public.catalogue_save_point(jsonb,timestamptz) from public;
grant execute on function public.catalogue_save_point(jsonb,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
