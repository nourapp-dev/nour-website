import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
  const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1).trim().replace(/^(["'])(.*)\1$/, '$2')];
}));
const api = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(api.hostname) && api.port === '54331', 'Refusing to test a non-isolated database');
const origin = 'http://localhost:3107';
const admin = createClient(api.origin, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(api.origin, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const keys = [crypto.randomUUID(), crypto.randomUUID()];
const fixture = key => ({ submissionKey: key, applicationKind: 'talent_pool', careerArea: 'technology_product', opportunityType: 'full_time', employmentType: 'full_time', workMode: 'remote', fullName: 'Local Integration Fixture', email: 'local-intake@example.test', phone: '+2348012345678', country: 'NG', city: 'Lagos', yearsOfExperience: 0, currentJobTitle: 'Local test only', portfolioUrl: 'https://example.test/work', linkedinUrl: '', message: 'Disposable local verification', privacyAccepted: true });
// A complete synthetic one-page PDF; contains no personal data.
const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>', '<< /Length 0 >>\nstream\n\nendstream'];
let pdf = '%PDF-1.4\n'; const offsets = [0];
for (let i = 0; i < objects.length; i++) { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; }
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 5\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const submit = async (key, withCv) => {
  const body = new FormData(); body.set('input', JSON.stringify(fixture(key)));
  if (withCv) body.set('cv', new File([pdf], 'local-fixture.pdf', { type: 'application/pdf' }));
  const response = await fetch(`${origin}/api/applications/join`, { method: 'POST', headers: { origin }, body });
  const result = await response.json(); assert.equal(response.status, 201, `Local intake failed: ${result.code ?? response.status}`); return result;
};
try {
  const bucket = await admin.storage.getBucket('application-files'); assert.ifError(bucket.error); assert.equal(bucket.data.public, false);
  const saved = await submit(keys[0], true);
  assert.match(saved.id, /^[0-9a-f-]{36}$/i);
  const retry = await submit(keys[0], true); assert.equal(retry.id, saved.id);
  const rows = await admin.from('job_applications').select('*').eq('submission_key', keys[0]); assert.ifError(rows.error); assert.equal(rows.data.length, 1);
  const row = rows.data[0]; assert.equal(row.id, saved.id); assert.equal(row.work_mode, 'remote'); assert.equal(row.opportunity_type, 'full_time'); assert.equal(row.years_of_experience, 0); assert.equal(row.status, 'new'); assert.equal(row.portfolio_url, 'https://example.test/work'); assert.equal(row.application_kind, 'talent_pool'); assert.ok(row.cv_path);
  const file = await admin.storage.from('application-files').download(row.cv_path); assert.ifError(file.error); assert.equal(file.data.size, Buffer.byteLength(pdf));
  const denied = await anon.storage.from('application-files').download(row.cv_path); assert.ok(denied.error, 'Anonymous CV download must fail');
  const deniedUpload = await anon.storage.from('application-files').upload(`job-applications/${keys[0]}/bypass.pdf`, Buffer.from(pdf), { contentType: 'application/pdf' }); assert.ok(deniedUpload.error, 'Anonymous direct CV upload must fail');
  const deniedRows = await anon.from('job_applications').select('id').eq('id', saved.id); assert.ok(deniedRows.error || deniedRows.data.length === 0);
  const withoutCv = await submit(keys[1], false); assert.ok(withoutCv.id);
  const optional = await admin.from('job_applications').select('cv_path').eq('id', withoutCv.id).single(); assert.ifError(optional.error); assert.equal(optional.data.cv_path, null);
  console.log('PASS: live local Next.js API, real database references, private PDF upload/read-back, retry deduplication, zero experience, independent preferences, optional CV, anonymous read/upload denial.');
} finally {
  const rows = await admin.from('job_applications').select('cv_path').in('submission_key', keys); assert.ifError(rows.error);
  const paths = rows.data.map(row => row.cv_path).filter(Boolean);
  if (paths.length) { const removed = await admin.storage.from('application-files').remove(paths); assert.ifError(removed.error); }
  const removed = await admin.from('job_applications').delete().in('submission_key', keys); assert.ifError(removed.error);
  console.log('Removed only this run’s disposable local records and files.');
}
