import type { SourceId } from '../types';

export const sources = [
  { id: 'whatsapp', name: 'WhatsApp', folder: 'WhatsApp', icon: 'logo-whatsapp', color: '#55D99A', caption: 'Save a moment', hint: 'Images & videos on your device' },
  { id: 'twitter', name: 'X / Twitter', folder: 'X', icon: 'logo-twitter', color: '#91BFFF', caption: 'Keep the conversation', hint: 'Video post link', example: 'https://x.com/user/status/123456789' },
  { id: 'instagram', name: 'Instagram', folder: 'Instagram', icon: 'logo-instagram', color: '#F7A3C5', caption: 'Collect your inspiration', hint: 'Post, reel or story link', example: 'https://www.instagram.com/p/ABC123/' },
  { id: 'threads', name: 'Threads', folder: 'Threads', icon: 'at-outline', color: '#D1C5F8', caption: 'Save something good', hint: 'Video post link', example: 'https://www.threads.net/@user/post/ABC123' },
  { id: 'tiktok', name: 'TikTok', folder: 'TikTok', icon: 'logo-tiktok', color: '#6DE5EA', caption: 'Replay the good bits', hint: 'Video or share link', example: 'https://www.tiktok.com/@user/video/123456789' },
  { id: 'youtube', name: 'YouTube', folder: 'YouTube', icon: 'logo-youtube', color: '#FF9290', caption: 'Make time to watch', hint: 'Single video link', example: 'https://www.youtube.com/watch?v=abcdefghijk' },
] as const;
export function sourceById(id: string) { return sources.find(s => s.id === id); }
export const sourceFolder = (id: SourceId) => sources.find(s => s.id === id)!.folder;
export const hasRemoteExtraction = (id: SourceId) => ['twitter', 'threads', 'tiktok', 'youtube'].includes(id);
