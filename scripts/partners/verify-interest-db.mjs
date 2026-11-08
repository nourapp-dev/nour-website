import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Optional test-only dependency, installed outside the repository. No network,
// remote credentials or production database are used by this verification.
if (!process.env.PARTNER_PGLITE_PATH) throw new Error("Set PARTNER_PGLITE_PATH to a local @electric-sql/pglite/dist/index.js");
const { PGlite } = await import(pathToFileURL(process.env.PARTNER_PGLITE_PATH).href);
const db = new PGlite();
const read = name => readFileSync(resolve(name), "utf8").replace(/^\uFEFF/, "");
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    create function public.current_user_has_permission(text) returns boolean language sql stable as $$select coalesce(current_setting('test.manage',true),'false')='true'$$;
    create table storage.buckets(id text primary key,public boolean);
    insert into storage.buckets values('application-files',false);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
    grant usage on schema public,auth,storage to anon,authenticated;
    grant select,insert,delete on storage.objects to anon,authenticated;
  `);
  await db.exec(read('supabase/migrations/20260815000100_create_applications_module.sql'));
  const legacyId = (await db.query(`insert into public.partner_applications(company_name,contact_name,email,phone,partner_type,status,country) values ('Legacy','Existing','legacy@example.test','123','hotel','approved','Old country label') returning id`)).rows[0].id;
  await db.exec(read('supabase/migrations/20261106201850_partner_interest_workflow.sql'));
  await db.exec(read('supabase/migrations/20261106210049_partner_interest_wizard.sql'));
  const legacy = (await db.query('select * from public.partner_applications where id=$1',[legacyId])).rows[0];
  assert.equal(legacy.status,'approved'); assert.equal(legacy.country,'Old country label'); assert.equal(legacy.headquarters_country,null);
  const payload = { submission_key:'36086a18-c19d-487e-b12a-51d6b61447ed', partnership_track:'service_provider', headquarters_country:'NG', country:'SA',city:'Lagos',service_types:['hotel','transport'],served_countries:['NG','SA'],company_name:'Fixture travel',website_url:'https://example.test',company_description:'Isolated test only',contact_name:'Test Contact',contact_role:'Manager',email:'TEST@example.test',phone:'+2348012345678',terms_accepted:true,status:'approved',operational_active:true };
  await db.exec('set role anon');
  await assert.rejects(db.query('select * from public.partner_applications'),/permission denied/);
  const register = async value => (await db.query('select public.submit_partner_interest($1::jsonb) id',[JSON.stringify(value)])).rows[0].id;
  const id = await register(payload);
  assert.match(id,/^[0-9a-f-]{36}$/); assert.equal(await register(payload),id);
  for (const change of [{terms_accepted:false},{service_types:[]},{headquarters_country:''},{phone:'0501234567'},{website_url:'javascript:alert(1)'},{service_types:['invalid']},{served_countries:['not a country']},{company_name:' '},{partnership_track:'international',service_types:['hotel']}]) await assert.rejects(register({...payload,...change}));
  await db.exec('reset role');
  const row=(await db.query('select * from public.partner_applications where id=$1',[id])).rows[0];
  assert.equal(row.status,'new');assert.equal(row.operational_active,false);assert.equal(row.headquarters_country,'NG');assert.deepEqual(row.service_types,['hotel','transport']);assert.deepEqual(row.served_countries,['NG','SA']);assert.equal(row.email,'test@example.test');assert.equal(row.partner_type,'hotel');
  assert.equal((await db.query('select count(*)::int n from public.partner_applications')).rows[0].n,2);
  await db.exec('set role authenticated');
  assert.equal((await db.query(`update public.partner_applications set status='approved' where id=$1 returning id`,[id])).rows.length,0);
  await db.exec('reset role');
  console.log('PASS: real PostgreSQL insert/read-back, server-issued ID, idempotent retry, field preservation, invalid input rejection, no approval injection, anonymous read denial, unauthorized update denial, legacy row preservation.');
} finally { await db.close(); }
