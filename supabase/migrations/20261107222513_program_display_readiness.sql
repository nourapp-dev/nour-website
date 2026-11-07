begin;
-- Descriptive display metadata only; no pricing/booking calculations are changed.
alter table public.programs add column origin_city_id uuid references public.departure_cities(id) on delete restrict,
 add column travel_mode text check(travel_mode in ('bus','air','own','mixed')),
 add column price_basis text check(price_basis in ('per_person','per_room','per_group')),
 add column tax_status text check(tax_status in ('included','excluded'));
alter table public.program_hotels add column occupancy integer check(occupancy between 1 and 20);
create index programs_origin_city_live_idx on public.programs(origin_city_id) where deleted_at is null;
grant select(origin_city_id,travel_mode,price_basis,tax_status) on public.programs to anon;
grant select(id,program_id,direction,airline_name_ar,airline_name_en,flight_number,departure_airport_ar,departure_airport_en,arrival_airport_ar,arrival_airport_en,departure_at,arrival_at,flight_type,transit_airport_ar,transit_airport_en,transit_duration_minutes,cabin_class_ar,cabin_class_en,baggage_allowance_kg,notes_ar,notes_en,sort_order) on public.program_flights to authenticated;
-- The legacy flight table had RLS but no anonymous column grants locally.
grant select(id,program_id,direction,airline_name_ar,airline_name_en,flight_number,departure_airport_ar,departure_airport_en,arrival_airport_ar,arrival_airport_en,departure_at,arrival_at,flight_type,transit_airport_ar,transit_airport_en,transit_duration_minutes,cabin_class_ar,cabin_class_en,baggage_allowance_kg,notes_ar,notes_en,sort_order) on public.program_flights to anon;


create function public.program_display_facts(program_ids uuid[],include_drafts boolean default false) returns table(program_id uuid,facts jsonb) language plpgsql stable security invoker set search_path='' as $$
begin
 if cardinality(program_ids)>200 then raise exception 'too_many_programs';end if;
 if include_drafts then
  if auth.uid() is null or not public.current_user_has_permission('programs.read') then raise exception 'permission_denied' using errcode='42501';end if;
 end if;
 return query select p.id,jsonb_build_object(
 'travelMode',p.travel_mode,'priceBasis',p.price_basis,'taxStatus',p.tax_status,
 'origins',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'countryId',c.country_id,'nameAr',c.name_ar,'nameEn',c.name_en,'timezone',c.timezone) order by c.sort_order,c.name_en) from public.departure_cities c where c.deleted_at is null and c.is_active and (include_drafts or catalogue_private.city_visible(c.id)) and (c.id=p.origin_city_id or exists(select 1 from public.program_departures d where d.program_id=p.id and d.origin_city_id=c.id and d.deleted_at is null and d.is_active))),'[]'::jsonb),
 'departures',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'cityId',d.origin_city_id,'startAt',d.start_at,'endAt',d.end_at,'timezone',d.departure_timezone,'status',d.status,'capacity',d.capacity_total,'seats',d.seats_available) order by d.start_at) from public.program_departures d where d.program_id=p.id and d.is_active and d.deleted_at is null and d.status<>'cancelled'),'[]'::jsonb),
 'stays',coalesce((select jsonb_agg(jsonb_build_object('id',ph.id,'hotelId',h.id,'nameAr',h.name_ar,'nameEn',h.name_en,'cityAr',h.city_ar,'cityEn',h.city_en,'nights',ph.nights,'roomAr',ph.room_type_ar,'roomEn',ph.room_type_en,'occupancy',ph.occupancy,'mealAr',ph.meal_plan_ar,'mealEn',ph.meal_plan_en) order by ph.sort_order) from public.program_hotels ph join public.hotels h on h.id=ph.hotel_id and h.is_active and h.deleted_at is null where ph.program_id=p.id),'[]'::jsonb),
 'transports',coalesce((select jsonb_agg(jsonb_build_object('id',pt.id,'nameAr',t.name_ar,'nameEn',t.name_en,'mode',t.mode,'vehicle',t.vehicle_type,'included',pt.is_included) order by pt.sort_order) from public.program_transports pt join public.transports t on t.id=pt.transport_id and t.is_active and t.deleted_at is null where pt.program_id=p.id),'[]'::jsonb),
 'actualFlightCount',(select count(*) from public.program_flights f where f.program_id=p.id and nullif(btrim(coalesce(f.departure_airport_ar,f.departure_airport_en,'')),'') is not null and nullif(btrim(coalesce(f.arrival_airport_ar,f.arrival_airport_en,'')),'') is not null and f.departure_at is not null and f.arrival_at>f.departure_at)
 ) from public.programs p where p.id=any(program_ids) and p.deleted_at is null and (include_drafts or catalogue_private.program_visible(p.id));
end $$;
revoke all on function public.program_display_facts(uuid[],boolean) from public;
grant execute on function public.program_display_facts(uuid[],boolean) to anon,authenticated;

create function catalogue_private.program_readiness(target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.programs;errors text[]:='{}';warnings text[]:='{}';hotel_nights integer;
begin
 if session_user<>'postgres' and (auth.uid() is null or not public.current_user_has_permission('programs.read')) then raise exception 'permission_denied' using errcode='42501';end if;
 select * into p from public.programs where id=target and deleted_at is null;if not found then raise exception 'program_not_found';end if;
 if nullif(btrim(p.title_ar),'') is null or nullif(btrim(p.title_en),'') is null or nullif(btrim(p.summary_ar),'') is null or nullif(btrim(p.summary_en),'') is null then errors:=array_append(errors,'bilingual_copy');end if;
 if p.cover_media_id is null then errors:=array_append(errors,'cover_required');end if;
 if p.country_id is null or not catalogue_private.country_visible(p.country_id) or not exists(select 1 from public.countries c where c.id=p.country_id and (c.market_status='browsable' or c.market_status is null)) then errors:=array_append(errors,'country_not_browsable');end if;
 if p.origin_city_id is null or not exists(select 1 from public.departure_cities c where c.id=p.origin_city_id and c.country_id=p.country_id and catalogue_private.city_visible(c.id)) then errors:=array_append(errors,'origin_city_required');end if;
 if p.duration_days<1 or p.duration_nights<0 or p.duration_nights>=p.duration_days then errors:=array_append(errors,'invalid_duration');end if;
 if p.travel_mode is null then errors:=array_append(errors,'travel_mode_required');end if;
 if p.base_price is null or p.base_price<0 or p.currency_code!~'^[A-Z]{3}$' then errors:=array_append(errors,'invalid_price_currency');end if;
 if p.price_basis is null then errors:=array_append(errors,'price_basis_required');end if;
 if p.tax_status is null then errors:=array_append(errors,'tax_status_required');end if;
 select coalesce(sum(h.nights),0) into hotel_nights from public.program_hotels h where h.program_id=p.id;
 if p.duration_nights>0 and hotel_nights<>p.duration_nights then errors:=array_append(errors,'stay_nights_mismatch');end if;
 if exists(select 1 from public.program_hotels ph join public.hotels h on h.id=ph.hotel_id where ph.program_id=p.id and (not h.is_active or h.deleted_at is not null or nullif(btrim(ph.room_type_ar),'') is null or nullif(btrim(ph.room_type_en),'') is null or ph.occupancy is null or (ph.check_in_date is not null and ph.check_out_date is not null and (ph.check_out_date-ph.check_in_date)<>ph.nights))) then errors:=array_append(errors,'invalid_stay_room');end if;
 if p.travel_mode='bus' and exists(select 1 from public.program_flights f where f.program_id=p.id) then errors:=array_append(errors,'bus_has_flight_records');end if;
 if p.travel_mode='bus' and not exists(select 1 from public.program_transports pt join public.transports t on t.id=pt.transport_id where pt.program_id=p.id and t.is_active and t.deleted_at is null and t.vehicle_type::text='bus') then errors:=array_append(errors,'bus_transport_required');end if;
 if p.travel_mode='air' and not exists(select 1 from public.program_flights f where f.program_id=p.id and f.departure_at is not null and f.arrival_at>f.departure_at and nullif(btrim(coalesce(f.departure_airport_ar,f.departure_airport_en,'')),'') is not null and nullif(btrim(coalesce(f.arrival_airport_ar,f.arrival_airport_en,'')),'') is not null) then errors:=array_append(errors,'actual_flight_required');end if;
 if exists(select 1 from public.program_flights f where f.program_id=p.id and f.arrival_at<=f.departure_at) or exists(select 1 from public.program_departures d where d.program_id=p.id and d.deleted_at is null and (d.end_at<d.start_at or (d.origin_city_id is not null and d.origin_city_id<>p.origin_city_id and not exists(select 1 from public.departure_cities c where c.id=d.origin_city_id and c.country_id=p.country_id)))) then errors:=array_append(errors,'invalid_dates_or_origins');end if;
 if not exists(select 1 from public.program_departures d where d.program_id=p.id and d.is_active and d.deleted_at is null and d.status<>'cancelled' and d.start_at>now()) then warnings:=array_append(warnings,'no_upcoming_departures');end if;
 if not exists(select 1 from public.program_inclusion_items i where i.program_id=p.id and i.deleted_at is null) then warnings:=array_append(warnings,'review_inclusions');end if;
 return jsonb_build_object('errors',errors,'warnings',warnings,'info',jsonb_build_array('review_free_text_after_structured_changes'),'ready',cardinality(errors)=0);
end $$;
revoke all on function catalogue_private.program_readiness(uuid) from public;
create function public.program_publication_readiness(program_id uuid) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin if auth.uid() is null or not public.current_user_has_permission('programs.read') then raise exception 'permission_denied' using errcode='42501';end if;return catalogue_private.program_readiness(program_id);end $$;
grant execute on function catalogue_private.program_readiness(uuid) to authenticated;
revoke all on function public.program_publication_readiness(uuid) from public;
grant execute on function public.program_publication_readiness(uuid) to authenticated;
create function catalogue_private.guard_program_publication() returns trigger language plpgsql security definer set search_path='' as $$
declare readiness jsonb;
begin
 if new.status::text='published' and new.is_active and new.deleted_at is null then
  if tg_op='INSERT' or old.status::text<>'published' or not old.is_active then
   if session_user<>'postgres' and (auth.uid() is null or not public.current_user_has_permission('programs.publish')) then raise exception 'publish_permission_required' using errcode='42501';end if;
   readiness:=catalogue_private.program_readiness(new.id);if not (readiness->>'ready')::boolean then raise exception 'program_not_ready' using detail=(readiness->'errors')::text,errcode='23514';end if;
  end if;
 end if;return new;
end $$;
revoke all on function catalogue_private.guard_program_publication() from public;
create trigger program_readiness_guard after insert or update of status,is_active on public.programs for each row execute function catalogue_private.guard_program_publication();
create function catalogue_private.guard_program_origin() returns trigger language plpgsql security invoker set search_path='' as $$
begin if new.origin_city_id is not null and not exists(select 1 from public.departure_cities c where c.id=new.origin_city_id and c.country_id=new.country_id and c.deleted_at is null) then raise exception 'program_city_country_mismatch';end if;return new;end $$;
revoke all on function catalogue_private.guard_program_origin() from public;
create trigger program_origin_guard before insert or update of origin_city_id,country_id on public.programs for each row execute function catalogue_private.guard_program_origin();
-- Narrow transactional flight writer. Authenticated roles receive no new table
-- INSERT/UPDATE/DELETE grants. Permission and draft/creator checks are enforced here.
create function catalogue_private.replace_program_flights(target uuid,flight_rows jsonb) returns void language plpgsql security definer set search_path='' as $$
declare p public.programs;
begin
 if auth.uid() is null or not public.current_user_has_permission('programs.read') then raise exception 'permission_denied' using errcode='42501';end if;
 select * into p from public.programs where id=target and deleted_at is null for update;
 if not found or not(public.current_user_has_permission('programs.update') or (public.current_user_has_permission('programs.create') and p.created_by=auth.uid())) then raise exception 'permission_denied' using errcode='42501';end if;
 if p.status::text<>'draft' then raise exception 'save_draft_before_flight_changes';end if;
 if jsonb_typeof(flight_rows)<>'array' or jsonb_array_length(flight_rows)>50 then raise exception 'invalid_flights';end if;
 delete from public.program_flights f where f.program_id=target;
 insert into public.program_flights(program_id,direction,airline_name_ar,airline_name_en,flight_number,departure_airport_ar,departure_airport_en,arrival_airport_ar,arrival_airport_en,departure_at,arrival_at,flight_type,transit_airport_ar,transit_airport_en,transit_duration_minutes,cabin_class_ar,cabin_class_en,baggage_allowance_kg,notes_ar,notes_en,sort_order)
 select target,f.direction,f.airline_name_ar,f.airline_name_en,f.flight_number,f.departure_airport_ar,f.departure_airport_en,f.arrival_airport_ar,f.arrival_airport_en,f.departure_at,f.arrival_at,f.flight_type,f.transit_airport_ar,f.transit_airport_en,coalesce(f.transit_duration_minutes,0),f.cabin_class_ar,f.cabin_class_en,coalesce(f.baggage_allowance_kg,0),f.notes_ar,f.notes_en,coalesce(f.sort_order,0) from jsonb_populate_recordset(null::public.program_flights,flight_rows) f;
end $$;
revoke all on function catalogue_private.replace_program_flights(uuid,jsonb) from public;
grant execute on function catalogue_private.replace_program_flights(uuid,jsonb) to authenticated;
create function public.replace_program_flights(p_program_id uuid,p_flights jsonb) returns void language sql security invoker set search_path='' as $$select catalogue_private.replace_program_flights(p_program_id,p_flights)$$;
revoke all on function public.replace_program_flights(uuid,jsonb) from public;
grant execute on function public.replace_program_flights(uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
