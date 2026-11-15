import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLink, validateBackend } from '../src/utils/links.ts';
import { bytesLabel, stableName } from '../src/utils/media.ts';

test('accepts supported source links and strips tracking', () => {
  assert.equal(validateLink(' https://x.com/user/status/123?utm_source=share#video ', 'twitter').url, 'https://x.com/user/status/123');
  assert.ok(validateLink('https://www.instagram.com/p/AB_c-12/', 'instagram').url);
  assert.ok(validateLink('https://www.instagram.com/stories/user/123/', 'instagram').url);
  assert.ok(validateLink('https://www.threads.com/@user/post/AB12', 'threads').url);
  assert.ok(validateLink('https://www.threads.com/share/BAVaaLtd2V', 'threads').url);
  assert.ok(validateLink('https://vm.tiktok.com/AB12/', 'tiktok').url);
  assert.ok(validateLink('https://www.tiktok.com/@user/video/123', 'tiktok').url);
  assert.ok(validateLink('https://youtu.be/abcdefghijk?si=share', 'youtube').url);
});
test('rejects deceptive hosts, credentials, wrong-source and unsupported routes', () => {
  for (const link of ['https://x.com.evil.test/user/status/123', 'http://x.com/user/status/123', 'https://login@x.com/user/status/123', 'https://x.com:8443/user/status/123', 'https://x.com/user', 'not a URL']) assert.ok(validateLink(link, 'twitter').error, link);
  assert.match(validateLink('https://x.com/user/status/123', 'instagram').error!, /Twitter/);
  assert.ok(validateLink('https://youtube.com/watch?v=abcdefghijk&list=123', 'youtube').error);
  assert.ok(validateLink('https://youtu.be/abcdefghijk?list=123', 'youtube').error);
  assert.ok(validateLink('https://youtube.com/shorts/abcdefghijk?list=123', 'youtube').error);
});
test('backend HTTP is development-only and filenames are deterministic', () => {
  assert.equal(validateBackend('http://10.0.2.2:8000', true), true);
  assert.equal(validateBackend('http://10.0.2.2:8000', false), false);
  assert.equal(validateBackend('https://user:pass@example.com', true), false);
  assert.equal(stableName('id-1', '../a?b.mp4'), stableName('id-1', '../a?b.mp4'));
  assert.notEqual(stableName('id-1', 'a.mp4'), stableName('id-2', 'a.mp4'));
  assert.equal(bytesLabel(1024), '1.0 KB');
});
