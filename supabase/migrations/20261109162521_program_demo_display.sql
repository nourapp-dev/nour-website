begin;
-- Opt-in presentation mode. Existing programs keep every operational requirement.
alter table public.programs add column is_demo boolean not null default false;
grant select(is_demo) on public.programs to anon;

alter function catalogue_private.program_readiness(uuid) rename to program_readiness_standard;
revoke all on function catalogue_private.program_readiness_standard(uuid) from public,anon,authenticated;
create function catalogue_private.program_readiness(target uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;p public.programs;errors jsonb;
begin
 -- Standard readiness retains authentication, content, market and visa checks.
 result:=catalogue_private.program_readiness_standard(target);
 select * into strict p from public.programs where id=target and deleted_at is null;
 if not p.is_demo then return result;end if;
 select coalesce(jsonb_agg(value),'[]'::jsonb) into errors
 from jsonb_array_elements_text(result->'errors') e(value)
 where value not in ('tax_status_required','actual_flight_required')
   and not(value='origin_city_required' and p.origin_city_id is null);
 return result||jsonb_build_object('errors',errors,
   'warnings',(result->'warnings')||jsonb_build_array('demo_display_only'),
   'ready',jsonb_array_length(errors)=0);
end $$;
revoke all on function catalogue_private.program_readiness(uuid) from public,anon;
grant execute on function catalogue_private.program_readiness(uuid) to authenticated;

-- Changing the presentation mode must pass through a draft and publication review.
create function catalogue_private.guard_program_demo_mode() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.is_demo is distinct from old.is_demo then
  if old.status::text<>'draft' or new.status::text<>'draft' then
   raise exception 'save_draft_before_demo_mode_change' using errcode='23514';
  end if;
  if exists(select 1 from public.bookings b where b.program_id=new.id and b.deleted_at is null) then
   raise exception 'program_with_bookings_cannot_change_demo_mode' using errcode='23514';
  end if;
 end if;
 return new;
end $$;
revoke all on function catalogue_private.guard_program_demo_mode() from public,anon,authenticated;
create trigger program_demo_mode_guard before update of is_demo on public.programs
for each row execute function catalogue_private.guard_program_demo_mode();

-- Defense in depth: demo programs cannot receive bookings through RPC or direct writes,
-- even if website booking is enabled later. The row lock serializes mode changes.
create function catalogue_private.reject_demo_program_booking() returns trigger
language plpgsql security invoker set search_path='' as $$
declare demo boolean;
begin
 select p.is_demo into demo from public.programs p where p.id=new.program_id for share;
 if demo then raise exception 'demo_program_not_bookable' using errcode='23514';end if;
 return new;
end $$;
revoke all on function catalogue_private.reject_demo_program_booking() from public,anon,authenticated;
create trigger bookings_reject_demo_program before insert or update of program_id on public.bookings
for each row execute function catalogue_private.reject_demo_program_booking();
notify pgrst,'reload schema';
commit;
