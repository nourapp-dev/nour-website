import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Capture credentials in memory. Never print CLI status or credential values.
const output = execFileSync(process.execPath, ['node_modules/supabase/dist/supabase.js', 'status', '--workdir', '.next-ui-preview/supabase-local', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const status = JSON.parse(output.slice(output.indexOf('{')));
const url = new URL(status.API_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.port === '54331', 'Only the isolated local API is permitted');
assert.ok(status.ANON_KEY && status.SERVICE_ROLE_KEY, 'Local stack credentials are missing');
let env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '';
if (existsSync('.env.local') && !env.includes('http://127.0.0.1:54331') && !existsSync('.env.local.before-isolated-supabase')) copyFileSync('.env.local', '.env.local.before-isolated-supabase');
const values = {
  NEXT_PUBLIC_SUPABASE_URL: url.origin,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3107',
  NEXT_PUBLIC_UI_PREVIEW: 'false',
};
for (const [name, value] of Object.entries(values)) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, 'm');
  env = pattern.test(env) ? env.replace(pattern, line) : `${env.trimEnd()}\n${line}\n`;
}
writeFileSync('.env.local', env, { mode: 0o600 });
console.log('Connected .env.local to isolated API http://127.0.0.1:54331. Credentials were not printed; existing settings were preserved.');
