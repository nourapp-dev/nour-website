import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {policy,rolePolicySql} from '../ops/dashboard-role-policy.mjs';
async function fixture(){
 const db=new PGlite();
 await db.exec(`create table roles(id uuid primary key default gen_random_uuid(),key text unique,name_ar text,name_en text,description_ar text,description_en text,sort_order integer default 0,is_system boolean default false,is_active boolean default true,deleted_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now());
 create table permissions(id uuid primary key default gen_random_uuid(),key text unique,is_active boolean default true,deleted_at timestamptz);
 create table role_permissions(role_id uuid references roles(id),permission_id uuid references permissions(id),created_at timestamptz default now(),primary key(role_id,permission_id));
 create table admin_user_roles(id uuid primary key default gen_random_uuid(),user_id uuid,role_id uuid references roles(id),deleted_at timestamptz);
 create table admin_audit_logs(actor_user_id uuid,action text,entity_type text,entity_id uuid,old_values jsonb,new_values jsonb,metadata jsonb);
 insert into roles(key,name_ar,name_en,is_system) values('super_admin','المدير الأعلى','Super Admin',true),('content_manager','قديم','Old',false),('unrelated_custom','مخصص','Custom',false);`);
 const keys=[...new Set([...policy.roles.flatMap(r=>r.permissions),'users.manage','roles.manage','settings.manage','feature_flags.manage','programs.delete','media.delete'])];
 for(const key of keys)await db.query('insert into permissions(key)values($1)',[key]);
 await db.exec("insert into role_permissions select r.id,p.id,now() from roles r cross join permissions p where r.key='super_admin'; insert into role_permissions select r.id,p.id,now() from roles r cross join permissions p where r.key='unrelated_custom' and p.key='media.read'; insert into admin_user_roles(user_id,role_id)select gen_random_uuid(),id from roles where key in ('super_admin','content_manager');");
 return db;
}
const snapshot=async(db,sql)=>(await db.query(sql)).rows;
test('functional roles cannot grant system administration or permanent deletion; viewer is read-only',()=>{
 assert.equal(policy.roles.length,10);
 for(const r of policy.roles){assert.notEqual(r.key,'super_admin');assert.ok(r.permissions.includes('dashboard.read'));assert.equal(new Set(r.permissions).size,r.permissions.length);for(const p of r.permissions)assert.ok(!/^(users|roles|settings|feature_flags|audit_logs)\./.test(p)&&!p.endsWith('.delete'),r.key+':'+p);}
 assert.ok(policy.roles.find(r=>r.key==='viewer').permissions.every(p=>/\.(read|view)$/.test(p)));
 assert.ok(policy.roles.find(r=>r.key==='content_manager').permissions.includes('website.publish'));
 assert.ok(!policy.roles.find(r=>r.key==='marketing_manager').permissions.includes('website.publish'));
});
test('policy creates roles idempotently, corrects content access and preserves root, custom roles and assignments',async()=>{
 const db=await fixture();try{
  const root=await snapshot(db,"select to_jsonb(r) as value from roles r where key='super_admin'");
  const assignments=await snapshot(db,'select * from admin_user_roles order by id');
  const custom=await snapshot(db,"select to_jsonb(r) as value from roles r where key='unrelated_custom'");
  await db.exec(rolePolicySql());
  assert.equal((await db.query('select count(*)::int as n from roles')).rows[0].n,12);
  assert.deepEqual(await snapshot(db,"select to_jsonb(r) as value from roles r where key='super_admin'"),root);
  assert.deepEqual(await snapshot(db,"select to_jsonb(r) as value from roles r where key='unrelated_custom'"),custom);
  assert.deepEqual(await snapshot(db,'select * from admin_user_roles order by id'),assignments);
  const grants=await snapshot(db,"select p.key from roles r join role_permissions rp on rp.role_id=r.id join permissions p on p.id=rp.permission_id where r.key='content_manager'");
  assert.ok(grants.some(p=>p.key==='articles.manage'));assert.ok(grants.some(p=>p.key==='media.upload'));
  const before=await snapshot(db,'select role_id,permission_id from role_permissions order by role_id,permission_id');
  await db.exec(rolePolicySql());assert.deepEqual(await snapshot(db,'select role_id,permission_id from role_permissions order by role_id,permission_id'),before);
  assert.equal((await db.query('select count(*)::int as n from admin_audit_logs')).rows[0].n,20);
  assert.deepEqual(await snapshot(db,'select * from admin_user_roles order by id'),assignments);
 }finally{await db.close();}
});
test('missing/disabled permissions fail before any role is changed',async()=>{
 const db=await fixture();try{
  await db.query("update permissions set is_active=false where key='programs.read'");
  const before=await snapshot(db,'select * from roles order by key');
  await assert.rejects(()=>db.exec(rolePolicySql()),/unknown_or_disabled_permission/);await db.exec('rollback');
  assert.deepEqual(await snapshot(db,'select * from roles order by key'),before);
  assert.equal((await db.query('select count(*)::int as n from admin_audit_logs')).rows[0].n,0);
 }finally{await db.close();}
});
