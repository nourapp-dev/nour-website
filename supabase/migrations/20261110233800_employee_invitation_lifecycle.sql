-- Service-only invitation ledger. Tokens are hashed; no public/authenticated grants.
create table public.employee_invitations (
 id uuid primary key default gen_random_uuid(), email text not null,
 full_name text not null check(length(full_name) between 1 and 100),
 role_id uuid not null references public.roles(id),
 invited_by uuid references public.admin_profiles(id) on delete set null,
 invited_by_name text not null, target_user_id uuid references auth.users(id) on delete set null,
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 status text not null default 'pending' check(status in ('pending','processing','accepted','revoked','failed')),
 created_at timestamptz not null default now(), sent_at timestamptz,
 expires_at timestamptz not null default now()+interval '24 hours',
 accepted_at timestamptz, revoked_at timestamptz, accepted_user_id uuid references auth.users(id) on delete set null
);
create unique index employee_invitations_open_email on public.employee_invitations(lower(email)) where status in ('pending','processing');
create index employee_invitations_created_at on public.employee_invitations(created_at desc);
alter table public.employee_invitations enable row level security;
revoke all on public.employee_invitations from public,anon,authenticated;
grant select,insert,update on public.employee_invitations to service_role;

create function public.employee_invitation_can_assign(actor uuid, target_role uuid)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.admin_profiles p where p.id=actor and p.status='active' and p.deleted_at is null)
 and public.has_permission(actor,'users.manage')
 and exists(select 1 from public.roles r where r.id=target_role and r.is_active and r.deleted_at is null
 and (public.is_super_admin(actor) or (r.key<>'super_admin' and not exists(
 select 1 from public.role_permissions rp join public.permissions pm on pm.id=rp.permission_id
 where rp.role_id=r.id and pm.is_active and pm.deleted_at is null and not public.has_permission(actor,pm.key)))));
$$;

create function public.employee_invitation_issue(actor uuid, recipient text, employee_name text, target_role uuid, digest text, previous_id uuid default null)
returns public.employee_invitations language plpgsql security invoker set search_path='' as $$
declare result public.employee_invitations; old public.employee_invitations; target_id uuid; profile public.admin_profiles;
begin
 if not public.employee_invitation_can_assign(actor,target_role) then raise exception 'invitation_role_forbidden' using errcode='42501'; end if;
 if recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(recipient)>254 or length(btrim(employee_name)) not between 1 and 100 then raise exception 'invalid_invitation'; end if;
 recipient:=lower(btrim(recipient));
 -- Serialise issue/resend for the same address, including concurrent new invites.
 perform pg_advisory_xact_lock(hashtextextended(recipient,0));
 if previous_id is not null then
  select * into old from public.employee_invitations where id=previous_id for update;
  if not found or old.email<>recipient or old.status not in ('pending','failed') then raise exception 'invitation_not_resendable'; end if;
 end if;
 if exists(select 1 from public.employee_invitations where email=recipient and created_at>now()-interval '60 seconds') then raise exception 'invitation_rate_limited'; end if;
 if previous_id is null and exists(select 1 from public.employee_invitations where email=recipient and status in ('pending','processing')) then raise exception 'invitation_already_pending'; end if;
 select id into target_id from public.admin_profiles where lower(email)=recipient;
 if target_id is null then raise exception 'account_already_exists'; end if;
 if target_id is not null then
  select * into profile from public.admin_profiles where id=target_id;
  if not found or profile.status<>'invited' or profile.deleted_at is not null or profile.last_login_at is not null then raise exception 'account_already_exists'; end if;
 end if;
 if previous_id is not null then update public.employee_invitations set status='revoked',revoked_at=now() where id=previous_id; end if;
 insert into public.employee_invitations(email,full_name,role_id,invited_by,invited_by_name,target_user_id,token_hash)
 values(recipient,btrim(employee_name),target_role,actor,(select full_name from public.admin_profiles where id=actor),target_id,digest) returning * into result;
 insert into public.admin_audit_logs(actor_user_id,action,entity_type,entity_id,new_values)
 values(actor,case when previous_id is null then 'employee_invitation_created' else 'employee_invitation_resent' end,'employee_invitations',result.id,jsonb_build_object('email',recipient,'role_id',target_role));
 return result;
end $$;

create function public.employee_invitation_revoke(actor uuid, invitation_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare r public.employee_invitations;
begin
 select * into r from public.employee_invitations where id=invitation_id for update;
 if not found or not public.employee_invitation_can_assign(actor,r.role_id) then raise exception 'invitation_forbidden' using errcode='42501'; end if;
 if r.status not in ('pending','processing','failed') then raise exception 'invitation_not_revocable'; end if;
 update public.employee_invitations set status='revoked',revoked_at=now() where id=r.id;
 insert into public.admin_audit_logs(actor_user_id,action,entity_type,entity_id) values(actor,'employee_invitation_revoked','employee_invitations',r.id);
end $$;

create function public.employee_invitation_claim(digest text)
returns public.employee_invitations language plpgsql security invoker set search_path='' as $$
declare r public.employee_invitations;
begin
 select * into r from public.employee_invitations where token_hash=digest for update;
 if not found or r.status<>'pending' or r.sent_at is null or r.expires_at<=now() or not public.employee_invitation_can_assign(r.invited_by,r.role_id) then raise exception 'invitation_unavailable'; end if;
 update public.employee_invitations set status='processing' where id=r.id returning * into r;
 return r;
end $$;

create function public.employee_invitation_complete(digest text, target_user uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare r public.employee_invitations;
begin
 select * into r from public.employee_invitations where token_hash=digest for update;
 if not found or r.status<>'processing' or r.expires_at<=now() or not public.employee_invitation_can_assign(r.invited_by,r.role_id) then raise exception 'invitation_unavailable'; end if;
 if r.target_user_id is null or r.target_user_id<>target_user or not exists(select 1 from public.admin_profiles where id=target_user and lower(email)=r.email) then raise exception 'invitation_user_mismatch'; end if;
 if exists(select 1 from public.admin_profiles where id=target_user and (status<>'invited' or deleted_at is not null)) then raise exception 'account_already_active'; end if;
 insert into public.admin_profiles(id,email,full_name,status) values(target_user,r.email,r.full_name,'active')
 on conflict(id) do update set full_name=excluded.full_name,status='active',updated_at=now();
 update public.admin_user_roles set deleted_at=now(),updated_at=now() where user_id=target_user and deleted_at is null;
 insert into public.admin_user_roles(user_id,role_id,assigned_by) values(target_user,r.role_id,r.invited_by)
 on conflict(user_id,role_id) do update set deleted_at=null,updated_at=now(),assigned_by=excluded.assigned_by;
 update public.employee_invitations set status='accepted',accepted_at=now(),accepted_user_id=target_user where id=r.id;
 insert into public.admin_audit_logs(actor_user_id,action,entity_type,entity_id,new_values) values(r.invited_by,'employee_invitation_accepted','employee_invitations',r.id,jsonb_build_object('user_id',target_user,'role_id',r.role_id));
end $$;

revoke all on function public.employee_invitation_can_assign(uuid,uuid),public.employee_invitation_issue(uuid,text,text,uuid,text,uuid),public.employee_invitation_revoke(uuid,uuid),public.employee_invitation_claim(text),public.employee_invitation_complete(text,uuid) from public,anon,authenticated;
grant execute on function public.employee_invitation_can_assign(uuid,uuid),public.employee_invitation_issue(uuid,text,text,uuid,text,uuid),public.employee_invitation_revoke(uuid,uuid),public.employee_invitation_claim(text),public.employee_invitation_complete(text,uuid) to service_role;
