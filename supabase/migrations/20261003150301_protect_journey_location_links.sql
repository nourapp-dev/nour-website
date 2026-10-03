create function public.protect_journey_location_links() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_table_name='departure_cities' then
  if new.country_id is distinct from old.country_id and (
   exists(select 1 from public.program_departures d join public.programs p on p.id=d.program_id where d.origin_city_id=new.id and p.country_id is distinct from new.country_id)
   or exists(select 1 from public.program_meeting_points m join public.programs p on p.id=m.program_id where m.city_id=new.id and p.country_id is distinct from new.country_id)
  ) then raise exception 'city_country_has_linked_programs'; end if;
 elsif tg_table_name='program_departures' then
  if exists(select 1 from public.program_meeting_points m where m.departure_id=new.id and m.deleted_at is null and (m.city_id is distinct from new.origin_city_id or m.program_id is distinct from new.program_id)) then raise exception 'departure_has_linked_meeting_points'; end if;
 elsif tg_table_name='programs' then
  if exists(select 1 from public.program_departures d join public.departure_cities c on c.id=d.origin_city_id where d.program_id=new.id and c.country_id is distinct from new.country_id)
   or exists(select 1 from public.program_meeting_points m join public.departure_cities c on c.id=m.city_id where m.program_id=new.id and c.country_id is distinct from new.country_id)
  then raise exception 'program_country_has_linked_cities'; end if;
 end if;
 return new;
end; $$;
revoke all on function public.protect_journey_location_links() from public,anon,authenticated;
create trigger protect_city_links before update of country_id on public.departure_cities for each row execute function public.protect_journey_location_links();
create trigger protect_departure_links before update of origin_city_id,program_id on public.program_departures for each row execute function public.protect_journey_location_links();
create trigger protect_program_city_links before update of country_id on public.programs for each row execute function public.protect_journey_location_links();
