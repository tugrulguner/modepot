import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { sanitizePosthogEvent } from './privacy-sanitizer.js';
const secret = 'MODEPOT_PRIVATE_SENTINEL_92731';
test('recursive sanitation preserves required metadata without private acquisition', () => {
  const timestamp = new Date('2025-01-02T03:04:05Z');
  const token = 'phc_publicFixture92731';
  const result = sanitizePosthogEvent({ timestamp, properties: { token, distinct_id: 'fixture', $session_id: 'session', mystery: [`https://site.test/a?secret=${secret}#private`, `//site.test/b?secret=${secret}`], $set: { $initial_utm_source: secret, $session_entry_gclid: secret, $initial_referrer: `https://ref.test/a?secret=${secret}` }, campaign: secret, $fbp: secret, $initial_fbc: secret, api_key: secret, custom_token: secret } });
  assert.equal(result.timestamp, timestamp);
  assert.equal(result.properties.token, token);
  assert.equal(result.properties.distinct_id, 'fixture');
  assert.equal(result.properties.$session_id, 'session');
  assert.deepEqual(result.properties.mystery, ['https://site.test/a', 'https://site.test/b']);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(secret));
});
test('recursive sanitation removes credential keys and bounded acquisition fields without stripping ordinary network fields', () => {
  const secret = 'MODEPOT_REVIEW_SECRET_731';
  const result = sanitizePosthogEvent({
    properties: {
      client_secret: secret, password: secret, access_token: secret,
      network_name: 'public-network-name',
      $initial_adgroup: secret,
      $set: { $session_entry_adgroup: secret, $session_exit_campaign: secret, $initial_password: secret },
      unrelated: { password: secret, keep: 'ordinary value' },
      token: 'not-a-public-project-token',
    },
  });
  const serialized = JSON.stringify(result);
  for (const key of ['client_secret', 'password', 'access_token', '$initial_adgroup', '$session_entry_adgroup', '$session_exit_campaign', '$initial_password']) assert.ok(!serialized.includes(key), `${key} remains in ${serialized}`);
  assert.ok(!serialized.includes(secret));
  assert.equal(result.properties.network_name, 'public-network-name');
  assert.equal(result.properties.unrelated.keep, 'ordinary value');
  assert.equal(result.properties.token, undefined);
});
test('built page initializes SDK once with a standalone sanitizer and disabled flag transport', () => {
  const html = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/posthog\.init\(/g) || []).length, 1);
  assert.match(html, /advanced_disable_flags:\s*true/);
  assert.match(html, /capture_performance:\s*true/);
  const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('window.modepotSanitize ='));
  assert.ok(source, 'standalone sanitizer script');
  const context = vm.createContext({ window: {}, Date, URL });
  vm.runInContext(source, context);
  const result = context.window.modepotSanitize({ timestamp: new Date(), properties: { token: 'phc_fixture', url: `https://site.test/a?secret=${secret}` } });
  assert.equal(result.properties.url, 'https://site.test/a');
  assert.ok(result.timestamp instanceof Date);
});
