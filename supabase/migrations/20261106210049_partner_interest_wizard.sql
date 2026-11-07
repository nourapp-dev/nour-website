-- Local-only. Requires 20261106201850_partner_interest_workflow.sql.
-- Extend the existing request table; keep legacy rows, columns, grants and RLS.
begin;
alter table public.partner_applications
  add column headquarters_country text check (headquarters_country is null or headquarters_country ~ '^[A-Z]{2}$'),
  add column service_types text[] check (service_types is null or service_types <@ array['hotel','transport','airline','visa','other','umrah_company','guide','technology','service_provider']::text[]),
  add column submission_key uuid unique;

-- Public create-only boundary: no listing, lookup or modification of requests.
-- SECURITY DEFINER permits returning this insert's ID without granting anonymous
-- SELECT access to application records. Only the allowlisted input is persisted.
create or replace function public.submit_partner_interest(input jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  request_key uuid;
  result_id uuid;
  selected_services text[];
  coverage text[];
  primary_service public.partner_type;
  field_name text;
begin
  -- Anonymous visitors are intentionally allowed; auth.uid() is only used by
  -- the existing INSERT audit trigger, never as an authorization claim here.
  if input is null or jsonb_typeof(input) <> 'object' or char_length(input::text) > 20000 then
    raise exception 'Invalid interest payload' using errcode='22023';
  end if;
  if (input->>'partnership_track') is null or (input->>'partnership_track') not in ('international','service_provider')
     or (input->'terms_accepted') is distinct from 'true'::jsonb then
    raise exception 'Track and privacy consent are required' using errcode='22023';
  end if;
  foreach field_name in array array['company_name','contact_name','contact_role','email','phone','city','country','headquarters_country'] loop
    if nullif(btrim(input->>field_name),'') is null or char_length(input->>field_name)>200 then
      raise exception 'Required field missing or too long: %',field_name using errcode='22023';
    end if;
  end loop;
  if (input->>'country') !~ '^[A-Z]{2}$' or (input->>'headquarters_country') !~ '^[A-Z]{2}$'
    or (input->>'phone') !~ '^\+[1-9][0-9]{7,14}$'
    or btrim(input->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or nullif(btrim(input->>'company_description'),'') is null
    or char_length(input->>'company_description')>3000
    or (nullif(btrim(input->>'website_url'),'') is not null and
       ((input->>'website_url') !~* '^https?://[^/@[:space:]]+(\.[^/@[:space:]]+)[^[:space:]]*$' or (input->>'website_url') ~* '^https?://[^/]*@' or char_length(input->>'website_url')>500)) then
    raise exception 'Invalid contact or organization details' using errcode='22023';
  end if;
  if jsonb_typeof(input->'service_types') is distinct from 'array'
     or jsonb_typeof(input->'served_countries') is distinct from 'array' then
    raise exception 'Service areas and coverage must be arrays' using errcode='22023';
  end if;
  selected_services := array(select jsonb_array_elements_text(input->'service_types'));
  coverage := array(select jsonb_array_elements_text(input->'served_countries'));
  if cardinality(selected_services)>9 or not selected_services <@ array['hotel','transport','airline','visa','other','umrah_company','guide','technology','service_provider']::text[]
    or array_position(selected_services,null) is not null
    or (input->>'partnership_track'='service_provider' and cardinality(selected_services)=0)
    or (input->>'partnership_track'='international' and cardinality(selected_services)>0)
    or cardinality(coverage)>250 or exists(select 1 from unnest(coverage) c where c is null or c !~ '^[A-Z]{2}$') then
    raise exception 'Invalid service areas or coverage' using errcode='22023';
  end if;
  request_key := nullif(input->>'submission_key','')::uuid;
  if request_key is null then raise exception 'Submission key is required' using errcode='22023'; end if;
  primary_service := case when input->>'partnership_track'='international' then 'other'::public.partner_type else selected_services[1]::public.partner_type end;
  insert into public.partner_applications (
    submission_key,partnership_track,headquarters_country,country,city,partner_type,service_types,served_countries,
    company_name,website_url,company_description,contact_name,contact_role,email,phone,terms_accepted,status,source
  ) values (
    request_key,input->>'partnership_track',input->>'headquarters_country',input->>'country',btrim(input->>'city'),primary_service,selected_services,coverage,
    btrim(input->>'company_name'),nullif(btrim(input->>'website_url'),''),btrim(input->>'company_description'),
    btrim(input->>'contact_name'),btrim(input->>'contact_role'),lower(btrim(input->>'email')),input->>'phone',true,'new','website'
  ) on conflict (submission_key) do nothing returning id into result_id;
  if result_id is null then
    select id into result_id from public.partner_applications where submission_key=request_key;
  end if;
  return result_id;
end $$;
revoke all on function public.submit_partner_interest(jsonb) from public;
grant execute on function public.submit_partner_interest(jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
