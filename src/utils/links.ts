import type { RemoteSource } from '../types/index.ts';

const rules: Record<RemoteSource, { hosts: string[]; route: (url: URL) => boolean }> = {
  twitter: { hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'], route: u => /^\/(?:[^/]+\/status|i\/web\/status)\/\d+\/?$/.test(u.pathname) },
  instagram: { hosts: ['instagram.com', 'www.instagram.com'], route: u => /^\/(?:p|reel)\/[\w-]+\/?$/.test(u.pathname) || /^\/stories\/[^/]+\/\d+\/?$/.test(u.pathname) },
  threads: { hosts: ['threads.net', 'www.threads.net', 'threads.com', 'www.threads.com'], route: u => /^\/@[^/]+\/post\/[\w-]+\/?$/.test(u.pathname) || /^\/share\/[\w-]+\/?$/.test(u.pathname) },
  tiktok: { hosts: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'], route: u => /^\/@[^/]+\/video\/\d+\/?$/.test(u.pathname) || (/^(vm|vt)\.tiktok\.com$/.test(u.hostname) && /^\/[\w-]+\/?$/.test(u.pathname)) || /^\/t\/[\w-]+\/?$/.test(u.pathname) },
  youtube: { hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'], route: u => !u.searchParams.has('list') && (u.hostname === 'youtu.be' ? /^\/[\w-]{11}\/?$/.test(u.pathname) : (u.pathname === '/watch' && /^[\w-]{11}$/.test(u.searchParams.get('v') ?? '')) || /^\/shorts\/[\w-]{11}\/?$/.test(u.pathname)) },
};
export function validateLink(input: string, source: RemoteSource): { url?: string; error?: string } {
  const value = input.trim();
  if (!value) return { error: 'Paste a post or video link first.' };
  let parsed: URL;
  try { parsed = new URL(value); } catch { return { error: 'Enter a complete link starting with https://.' }; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return { error: 'Use a normal HTTPS link without a login or custom port.' };
  const detected = (Object.entries(rules) as [RemoteSource, typeof rules.twitter][]).find(([, rule]) => rule.hosts.includes(parsed.hostname));
  if (!detected) return { error: 'This website is not supported. Paste the original social post link.' };
  if (detected[0] !== source) return { error: `This is a ${detected[0] === 'twitter' ? 'X / Twitter' : detected[0]} link. Open that source from Home.` };
  if (!rules[source].route(parsed)) return { error: 'Use a single post, reel, story or video link. Profiles and playlists are not supported.' };
  parsed.hash = '';
  ['utm_source', 'utm_medium', 'utm_campaign', 'si', 'igsh'].forEach(key => parsed.searchParams.delete(key));
  return { url: parsed.toString() };
}
export function validateBackend(value: string, development: boolean) {
  try {
    const u = new URL(value.trim());
    if (u.username || u.password || u.search || u.hash || (u.pathname !== '/' && u.pathname !== '')) return false;
    return u.protocol === 'https:' || (development && u.protocol === 'http:');
  } catch { return false; }
}
