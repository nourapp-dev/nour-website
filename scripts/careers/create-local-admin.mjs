import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { canAccessAdmin } from '../../src/features/auth/services/account-access.ts';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
  const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1).trim().replace(/^(["'])(.*)\1$/, '$2')];
}));
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.port === '54331', 'Only the isolated local database is allowed');
const loginPage = await fetch('http://localhost:3107/admin/login');
assert.equal(loginPage.status, 200);
const csp = loginPage.headers.get('content-security-policy') ?? '';
const connectSources = csp.split(';').find(directive => directive.trim().startsWith('connect-src '))?.trim().split(/\s+/).slice(1) ?? [];
assert.ok(connectSources.includes(url.origin), 'Browser CSP blocks local Supabase. Restart Next.js after changing .env.local, then reload the login page.');
const admin = createClient(url.origin, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const file = '.next-ui-preview/local-admin-account.json';
let account;
if (existsSync(file)) account = JSON.parse(readFileSync(file, 'utf8'));
else {
  account = { email: 'admin@nour.local', password: `Nour!${randomBytes(18).toString('base64url')}9aA` };
  const { data, error } = await admin.auth.admin.createUser({ email: account.email, password: account.password, email_confirm: true });
  assert.ifError(error); account.id = data.user.id;
  // Store only the new local credentials in the ignored preview directory.
  writeFileSync(file, JSON.stringify(account), { mode: 0o600, flag: 'wx' });
}
const role = '37601ddf-d590-4ceb-8808-de0a7ce35327';
for (const [table, row, onConflict] of [
  ['admin_profiles', { id: account.id, email: account.email, full_name: 'Local Administrator', status: 'active', deleted_at: null }, 'id'],
  ['admin_user_roles', { user_id: account.id, role_id: role, deleted_at: null }, 'user_id,role_id'],
  ['admin_profile_roles', { admin_profile_id: account.id, role_id: role }, 'admin_profile_id,role_id'],
]) { const result = await admin.from(table).upsert(row, { onConflict }); assert.ifError(result.error); }
const cookies = new Map();
const client = createServerClient(url.origin, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  cookieOptions: { name: `nour-${url.hostname.split('.')[0]}-admin-auth-v1`, path: '/', sameSite: 'lax', secure: false },
  cookies: { getAll: () => [...cookies].map(([name, value]) => ({ name, value })), setAll: values => values.forEach(({ name, value }) => cookies.set(name, value)) },
});
const login = await client.auth.signInWithPassword({ email: account.email, password: account.password });
assert.ifError(login.error); assert.equal(login.data.user.id, account.id);
assert.equal(await canAccessAdmin(client, account.id), true);
for (const permission of ['applications.view', 'applications.manage', 'partners.view', 'partners.manage']) {
  const result = await client.rpc('current_user_has_permission', { permission_code: permission }); assert.ifError(result.error); assert.equal(result.data, true);
}
for (const table of ['job_applications', 'partner_applications']) { const result = await client.from(table).select('id').limit(1); assert.ifError(result.error); }
const cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
for (const path of ['/admin/dashboard', '/admin/partners', '/admin/applications']) {
  const response = await fetch(`http://localhost:3107${path}`, { headers: { cookie }, redirect: 'manual' }); assert.equal(response.status, 200, `Admin access failed for ${path}`);
}
const anonymous = await fetch('http://localhost:3107/admin/partners', { redirect: 'manual' }); assert.ok([302, 303, 307, 308].includes(anonymous.status));
await client.auth.signOut({ scope: 'local' });
console.log('PASS: local login, active super-admin role, application/partner permissions, protected admin routes and anonymous denial.');
console.log('Local admin verified. Credentials remain only in the ignored local account file.');
