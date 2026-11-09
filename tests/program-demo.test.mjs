import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { priceDescription } from '../src/features/programs/display.ts';

const migration = readFileSync(new URL('../supabase/migrations/20261109105406_program_demo_display.sql', import.meta.url), 'utf8');

test('demo prices remain explicit in both languages even if display facts fail', () => {
  assert.match(priceDescription(undefined, true, true, true), /عرض تجريبي.*أسعار مؤقتة.*يُؤكَّد لاحقًا.*غير متاح للحجز/);
  assert.match(priceDescription(undefined, false, false, true), /Demo.*Provisional prices.*Final price confirmed later.*Booking unavailable/);
  assert.equal(priceDescription({priceBasis:'per_person',taxStatus:'included'},false), 'per person · Tax included');
});

test('database migration preserves market/content checks and blocks every demo booking write', async () => {
  const db = new PGlite();
  try {
    // A minimal existing schema and standard-readiness contract. This exercises the
    // real migration in PostgreSQL without touching production or mocking its SQL.
    await db.exec(`
      create role anon; create role authenticated;
      create schema catalogue_private;
      create table public.programs(id uuid primary key, status text not null default 'draft', origin_city_id uuid, deleted_at timestamptz, test_errors jsonb not null default '[]');
      create table public.bookings(id int generated always as identity primary key, program_id uuid references public.programs(id), deleted_at timestamptz);
      create function catalogue_private.program_readiness(target uuid) returns jsonb language plpgsql as $$
      declare errors jsonb;
      begin
        if current_setting('test.read_allowed',true)='false' then raise exception 'permission_denied';end if;
        select test_errors into strict errors from public.programs where id=target;
        return jsonb_build_object('errors',errors,'warnings','[]'::jsonb,'ready',jsonb_array_length(errors)=0);
      end $$;
    `);
    await db.exec(migration);
    const demo='00000000-0000-0000-0000-000000000001';
    const regular='00000000-0000-0000-0000-000000000002';
    const pending=['tax_status_required','actual_flight_required','origin_city_required'];
    await db.query('insert into programs(id,is_demo,test_errors) values ($1,true,$3),($2,false,$3)',[demo,regular,JSON.stringify(pending)]);
    const readiness=async id=>(await db.query('select catalogue_private.program_readiness($1) as r',[id])).rows[0].r;
    assert.equal((await readiness(demo)).ready,true);
    assert.ok((await readiness(demo)).warnings.includes('demo_display_only'));
    assert.deepEqual((await readiness(regular)).errors,pending);
    const blockers=['country_not_browsable','cover_required','invalid_dates_or_origins','visa_inclusion_mismatch'];
    await db.query('update programs set test_errors=$2 where id=$1',[demo,JSON.stringify([...pending,...blockers])]);
    assert.deepEqual((await readiness(demo)).errors,blockers);
    assert.equal((await readiness(demo)).ready,false);
    await db.query('update programs set origin_city_id=$2 where id=$1',[demo,regular]);
    assert.ok((await readiness(demo)).errors.includes('origin_city_required'));
    await db.exec("set test.read_allowed='false'");
    await assert.rejects(readiness(demo),/permission_denied/);
    await db.exec("set test.read_allowed='true'");
    await assert.rejects(db.query('insert into bookings(program_id) values ($1)',[demo]),/demo_program_not_bookable/);
    assert.equal((await db.query('select count(*)::int as n from bookings')).rows[0].n,0);
    await db.query('insert into bookings(program_id) values ($1)',[regular]);
    await assert.rejects(db.query('update bookings set program_id=$1',[demo]),/demo_program_not_bookable/);
    await assert.rejects(db.query('update programs set is_demo=true where id=$1',[regular]),/program_with_bookings_cannot_change_demo_mode/);
    await db.query("update programs set status='published' where id=$1",[demo]);
    await assert.rejects(db.query('update programs set is_demo=false where id=$1',[demo]),/save_draft_before_demo_mode_change/);
    await db.query("update programs set status='draft' where id=$1",[demo]);
    await db.query('update programs set is_demo=false where id=$1',[demo]);
    assert.ok((await readiness(demo)).errors.includes('actual_flight_required'));
    const grants=await db.query("select has_function_privilege('anon','catalogue_private.program_readiness(uuid)','execute') as anonymous, has_function_privilege('authenticated','catalogue_private.program_readiness(uuid)','execute') as admin");
    assert.deepEqual(grants.rows[0],{anonymous:false,admin:true});
  } finally { await db.close(); }
});
