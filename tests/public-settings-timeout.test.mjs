import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { performance } from 'node:perf_hooks';
import { createClient } from '@supabase/supabase-js';
import { readMaintenanceMode } from '../src/lib/supabase/maintenance.ts';

// server-only is a Next bundler boundary, not part of the function under test.
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,', shortCircuit: true };
  return next(specifier, context);
} });
const { getPublicServerSettings } = await import('../src/server/settings/public-settings.server.ts');

test('public metadata remains usable when its data service stops responding', async () => {
  let stalled = false;
  let aborted = false;
  const server = createServer((request, response) => {
    if (stalled) {
      response.on('close', () => { aborted = true; });
      return;
    }
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(request.url.endsWith('get_maintenance_mode') ? true : [{ setting_key: 'seo.meta_title_ar', value_json: 'نور آب' }]));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = { ...process.env };
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${server.address().port}`;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'local-test-key';
  let timer;
  try {
    assert.deepEqual(await getPublicServerSettings(), { 'seo.meta_title_ar': 'نور آب' });
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, 'local-test-key', { auth: { persistSession: false, autoRefreshToken: false } });
    assert.equal(await readMaintenanceMode(client), true);
    stalled = true;
    const started = performance.now();
    const value = await Promise.race([
      Promise.all([getPublicServerSettings(), readMaintenanceMode(client)]),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Metadata request still blocked after 3.8 seconds')), 3800); }),
    ]);
    assert.deepEqual(value, [{}, false]);
    assert.ok(performance.now() - started < 3800);
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.ok(aborted, 'the underlying HTTP request must also be cancelled');
  } finally {
    clearTimeout(timer);
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});
