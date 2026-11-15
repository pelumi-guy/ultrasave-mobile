export const sourceIds = ['whatsapp', 'twitter', 'instagram', 'threads', 'tiktok', 'youtube'] as const;
export type SourceId = (typeof sourceIds)[number];
export type RemoteSource = Exclude<SourceId, 'whatsapp'>;
export type Destination = { kind: 'default' | 'tree'; uri?: string; label: string };
export type Preferences = {
  destinations: Record<SourceId, Destination>; whatsappTree?: string; backendUrl: string;
};
export type MediaItem = {
  id: string; name: string; mime: string; kind: 'image' | 'video'; bytes: number;
  url?: string; state: 'ready' | 'downloading' | 'saved' | 'failed';
  nativeId?: string; savedUri?: string; savedLabel?: string; error?: string; attempts?: number;
  transferred?: number; total?: number;
  duration?: number; has_audio?: boolean;
};
export type Job = {
  id: string; serverId?: string; source: SourceId; url: string; demo: boolean; createdAt: number;
  state: 'resolving' | 'selecting' | 'downloading' | 'needs_action' | 'completed' | 'cancelled' | 'failed';
  destination: Destination; items: MediaItem[]; selected: string[]; error?: string;
};
export type ServerJob = {
  id: string; state: 'queued' | 'resolving' | 'awaiting_selection' | 'ready' | 'completed' | 'cancelled' | 'failed' | 'expired';
  items: Array<{ id: string; name: string; mime: string; kind: 'image' | 'video'; bytes: number; url?: string; duration?: number; has_audio?: boolean }>;
  error?: { code: string; message: string }; demo: boolean;
};
