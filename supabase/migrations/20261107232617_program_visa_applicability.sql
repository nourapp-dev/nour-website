begin;
-- NULL preserves the unknown state of legacy records. Arrival mode never infers visa requirements.
alter table public.programs add column visa_status text check(visa_status in ('included','excluded','not_applicable'));
grant select(visa_status) on public.programs to anon;
alter function catalogue_private.program_readiness(uuid) rename to program_readiness_core;
revoke all on function catalogue_private.program_readiness_core(uuid) from public,anon,authenticated;
create function catalogue_private.program_readiness(target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;state text;errors jsonb;warnings jsonb;valid_links integer;included_links integer;all_links integer;
begin
 if auth.uid() is null and session_user<>'postgres' then raise exception 'permission_denied' using errcode='42501';end if;
 result:=catalogue_private.program_readiness_core(target);errors:=result->'errors';warnings:=result->'warnings';
 select visa_status into state from public.programs where id=target and deleted_at is null;
 select count(*),count(*) filter(where pv.is_included) into valid_links,included_links from public.program_visas pv join public.visas v on v.id=pv.visa_id where pv.program_id=target and v.deleted_at is null and v.is_active;
 select count(*) into all_links from public.program_visas where program_id=target;
 if state is null then warnings:=warnings||jsonb_build_array('visa_status_unspecified');
 elsif state='not_applicable' and all_links>0 then errors:=errors||jsonb_build_array('visa_not_applicable_has_services');
 elsif state in ('included','excluded') and valid_links=0 then errors:=errors||jsonb_build_array('visa_details_required');
 elsif (state='included' and included_links=0) or (state='excluded' and included_links>0) then errors:=errors||jsonb_build_array('visa_inclusion_mismatch');end if;
 return result||jsonb_build_object('errors',errors,'warnings',warnings,'ready',jsonb_array_length(errors)=0);
end $$;
revoke all on function catalogue_private.program_readiness(uuid) from public,anon;
grant execute on function catalogue_private.program_readiness(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
