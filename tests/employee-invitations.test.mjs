import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {loadServerModule} from './helpers/load-server-module.mjs';
const {invitationEmail}=loadServerModule('src/server/invitations/email.ts');
import {invitationState,validInvitationInput} from '../src/features/users/invitations.ts';
const actor='00000000-0000-4000-8000-000000000001',employee='00000000-0000-4000-8000-000000000002',role='00000000-0000-4000-8000-000000000003';
const migration=await readFile(new URL('../supabase/migrations/20261110233800_employee_invitation_lifecycle.sql',import.meta.url),'utf8');
async function database(){
 const db=new PGlite();
 await db.exec(`create schema auth; create role anon;create role authenticated;create role service_role bypassrls;
 create table auth.users(id uuid primary key,email text);
 create table public.admin_profiles(id uuid primary key references auth.users(id),email text,full_name text,status text,deleted_at timestamptz,last_login_at timestamptz,updated_at timestamptz);
 create table public.roles(id uuid primary key,key text,name_ar text,name_en text,is_active boolean default true,deleted_at timestamptz);
 create table public.permissions(id uuid primary key,key text,is_active boolean default true,deleted_at timestamptz);
 create table public.role_permissions(role_id uuid,permission_id uuid);
 create table public.admin_user_roles(user_id uuid,role_id uuid,assigned_by uuid,deleted_at timestamptz,updated_at timestamptz,unique(user_id,role_id));
 create table public.admin_audit_logs(actor_user_id uuid,action text,entity_type text,entity_id uuid,new_values jsonb);
 create function public.has_permission(actor uuid,p text) returns boolean language sql as $$ select actor='${actor}'::uuid and p in ('users.manage','articles.read') $$;
 create function public.is_super_admin(actor uuid) returns boolean language sql as $$ select false $$;
 insert into auth.users values('${actor}','manager@example.test'),('${employee}','employee@example.test');
 insert into admin_profiles(id,email,full_name,status)values('${actor}','manager@example.test','Manager','active'),('${employee}','employee@example.test','Employee','invited');
 insert into roles(id,key,name_ar,name_en)values('${role}','content','المحتوى','Content');
 `);
 await db.exec(migration);return db;
}
async function issue(db,digest='a'.repeat(64),previous=null){return (await db.query('select to_jsonb(public.employee_invitation_issue($1,$2,$3,$4,$5,$6)) as value',[actor,'employee@example.test','Employee',role,digest,previous])).rows[0].value;}
async function sent(db,id){await db.query('update employee_invitations set sent_at=now() where id=$1',[id]);}
test('invitation is service-only, single use, and atomically assigns the selected role',async()=>{
 const db=await database();try{
  const row=await issue(db);assert.equal(Date.parse(row.expires_at)-Date.parse(row.created_at),86400000);assert.equal(row.target_user_id,employee);
  await assert.rejects(()=>db.query('select public.employee_invitation_claim($1)',['a'.repeat(64)]),/invitation_unavailable/);
  await sent(db,row.id);await db.query('select public.employee_invitation_claim($1)',['a'.repeat(64)]);
  await assert.rejects(()=>db.query('select public.employee_invitation_claim($1)',['a'.repeat(64)]),/invitation_unavailable/);
  await db.query('select public.employee_invitation_complete($1,$2)',['a'.repeat(64),employee]);
  assert.equal((await db.query('select status from admin_profiles where id=$1',[employee])).rows[0].status,'active');
  assert.equal((await db.query('select role_id from admin_user_roles where user_id=$1 and deleted_at is null',[employee])).rows[0].role_id,role);
  assert.equal((await db.query('select status from employee_invitations')).rows[0].status,'accepted');
  const grants=await db.query("select has_table_privilege('anon','employee_invitations','SELECT') as readable,has_function_privilege('authenticated','employee_invitation_claim(text)','EXECUTE') as callable");assert.deepEqual(grants.rows[0],{readable:false,callable:false});
 }finally{await db.close();}
});
test('expiry, cancellation, resend rotation and role escalation are enforced in the database',async()=>{
 const db=await database();try{
  let row=await issue(db);await sent(db,row.id);
  await assert.rejects(()=>issue(db,'b'.repeat(64),row.id),/invitation_rate_limited/);
  await db.query("update employee_invitations set created_at=now()-interval '2 minutes' where id=$1",[row.id]);
  row=await issue(db,'b'.repeat(64),row.id);await sent(db,row.id);
  await assert.rejects(()=>db.query('select employee_invitation_claim($1)',['a'.repeat(64)]),/invitation_unavailable/);
  await db.query('select employee_invitation_claim($1)',['b'.repeat(64)]);
  await db.query('select employee_invitation_revoke($1,$2)',[actor,row.id]);
  await assert.rejects(()=>db.query('select employee_invitation_complete($1,$2)',['b'.repeat(64),employee]),/invitation_unavailable/);
  assert.equal((await db.query('select status from admin_profiles where id=$1',[employee])).rows[0].status,'invited');
  await db.query("update employee_invitations set created_at=now()-interval '2 minutes'");
  row=await issue(db,'c'.repeat(64));await sent(db,row.id);await db.query("update employee_invitations set expires_at=now()-interval '1 second' where id=$1",[row.id]);
  await assert.rejects(()=>db.query('select employee_invitation_claim($1)',['c'.repeat(64)]),/invitation_unavailable/);
  await db.query("update roles set key='super_admin' where id=$1",[role]);
  await assert.rejects(()=>issue(db,'d'.repeat(64)),/invitation_role_forbidden/);
 }finally{await db.close();}
});
test('branded email safely escapes content and never places the token in the HTTP URL',()=>{
 const link='https://nourappglobal.com/admin/login/invite#token=example';
 const message=invitationEmail({email:'employee@example.test',name:'<script>alert(1)</script>',inviter:'Manager',role:'Content',link});
 assert.match(message,/From: Nour App <noreply@nourappglobal.com>/);assert.match(message,/Reply-To: support@nourappglobal.com/);
 const bodies=[...message.matchAll(/Content-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+)\r\n--/g)].map(m=>Buffer.from(m[1].replace(/\s/g,''),'base64').toString());
 assert.equal(bodies.length,2);assert.ok(bodies[1].includes('&lt;script&gt;'));assert.ok(!bodies[1].includes('<script>'));assert.ok(bodies[1].includes('#token=example'));
 assert.throws(()=>invitationEmail({email:'a@b.test\r\nBcc: x@y.test',name:'A',inviter:'B',role:'C',link}));
 assert.equal(new URL(link).search,'');
 assert.equal(validInvitationInput({email:'a@b.test',fullName:'A',roleId:role}),true);
 assert.equal(validInvitationInput({email:'invalid',fullName:'A',roleId:role}),false);
 assert.equal(invitationState({status:'pending',expires_at:'2000-01-01'}),'expired');
});

test('mail transport uses verified local SMTP, checks acceptance, and closes on failure',async()=>{
 let accepted=true,closed=0;
 const service=loadServerModule('src/server/invitations/email.ts',{'nodemailer':{createTransport:options=>{
  assert.equal(options.host,'127.0.0.1');assert.equal(options.requireTLS,true);assert.equal(options.tls.servername,'mail.nourappglobal.com');assert.equal(options.disableFileAccess,true);assert.equal(options.disableUrlAccess,true);
  return {sendMail:async mail=>{assert.equal(mail.raw,'synthetic message');assert.deepEqual(mail.envelope,{from:'noreply@nourappglobal.com',to:['employee@example.test']});return {accepted:accepted?['employee@example.test']:[]};},close:()=>closed++};
 }}});
 await service.queueInvitationMail('synthetic message','employee@example.test');assert.equal(closed,1);
 accepted=false;await assert.rejects(()=>service.queueInvitationMail('synthetic message','employee@example.test'),/mail_queue_failed/);assert.equal(closed,2);
});
