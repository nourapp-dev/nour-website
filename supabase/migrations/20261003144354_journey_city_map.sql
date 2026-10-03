-- Additive map data; existing programs, countries and departures remain intact.
create table public.departure_cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id),
  name_ar text not null check (length(trim(name_ar)) > 0),
  name_en text not null check (length(trim(name_en)) > 0),
  latitude numeric not null check (latitude between -90 and 90),
  longitude numeric not null check (longitude between -180 and 180),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index departure_cities_name_country on public.departure_cities(country_id, lower(name_en)) where deleted_at is null;
create trigger departure_cities_updated before update on public.departure_cities for each row execute function public.set_updated_at();
alter table public.departure_cities enable row level security;
create policy cities_public_read on public.departure_cities for select to anon, authenticated using (
 is_active and deleted_at is null and exists(select 1 from public.countries c where c.id=country_id and c.is_active and c.deleted_at is null)
);
create policy cities_admin_read on public.departure_cities for select to authenticated using(public.current_user_has_permission('countries.view'));
create policy cities_admin_insert on public.departure_cities for insert to authenticated with check(public.current_user_has_permission('countries.create'));
create policy cities_admin_update on public.departure_cities for update to authenticated using(public.current_user_has_permission('countries.update')) with check(public.current_user_has_permission('countries.update'));
revoke all on public.departure_cities from public, anon, authenticated;
grant select on public.departure_cities to anon;
grant select,insert,update on public.departure_cities to authenticated;
grant all on public.departure_cities to service_role;
alter table public.program_departures add column origin_city_id uuid references public.departure_cities(id);
alter table public.program_meeting_points add column city_id uuid references public.departure_cities(id), add column departure_id uuid references public.program_departures(id);
create index departures_origin_city on public.program_departures(origin_city_id) where deleted_at is null;
create index meeting_points_city on public.program_meeting_points(city_id) where deleted_at is null;
create index meeting_points_departure on public.program_meeting_points(departure_id) where deleted_at is null;

-- Reuse the existing departures and meeting-point editors, with server-side consistency checks.
create function public.validate_journey_location() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_country uuid; v_city uuid; v_departure_city uuid;
begin
 if tg_table_name='program_departures' then v_city:=new.origin_city_id; else v_city:=new.city_id; end if;
 if v_city is not null then
  select country_id into v_country from public.departure_cities where id=v_city and deleted_at is null;
  if v_country is null or not exists(select 1 from public.programs p where p.id=new.program_id and p.country_id=v_country) then raise exception 'city_must_match_program_country'; end if;
 end if;
 if tg_table_name='program_meeting_points' then
  if new.departure_id is not null then
   select origin_city_id into v_departure_city from public.program_departures where id=new.departure_id and program_id=new.program_id and deleted_at is null;
   if not found or v_departure_city is distinct from new.city_id then raise exception 'meeting_point_must_match_departure_city_and_program'; end if;
  end if;
  if (new.latitude is null) <> (new.longitude is null) or new.latitude not between -90 and 90 or new.longitude not between -180 and 180 then raise exception 'invalid_map_coordinates'; end if;
 end if;
 return new;
end; $$;
revoke all on function public.validate_journey_location() from public, anon, authenticated;
create trigger validate_departure_city before insert or update of origin_city_id,program_id on public.program_departures for each row execute function public.validate_journey_location();
create trigger validate_meeting_city before insert or update of city_id,departure_id,program_id,latitude,longitude on public.program_meeting_points for each row execute function public.validate_journey_location();

-- Initial city coordinates: GeoNames / Saudi Geographical Society. No programs are seeded.
insert into public.departure_cities(country_id,name_ar,name_en,latitude,longitude,sort_order)
select c.id,v.ar,v.en,v.lat,v.lon,v.ord from public.countries c cross join (values
 ('الرياض','Riyadh',24.7,46.7,0),('الدمام','Dammam',26.434417,50.103263,1),
 ('المدينة المنورة','Madinah',24.46861,39.61417,2),('جدة','Jeddah',21.49012,39.18624,3)
) as v(ar,en,lat,lon,ord) where upper(c.iso2)='SA' and c.deleted_at is null;
