import { requireOptionalNativeModule } from 'expo-modules-core';

export interface LocalMedia {
  id: string; uri: string; name: string; mime: string; kind: 'image' | 'video'; bytes: number; modified: number;
}
export interface NativeTransfer {
  state: 'pending' | 'running' | 'paused' | 'complete' | 'failed' | 'missing';
  bytes: number; total: number; uri?: string; reason?: number;
}
export interface StatusScan {
  state: 'ready' | 'needs_access' | 'missing';
  items: LocalMedia[];
  initialUri: string;
}
export interface StorageNative {
  discoverStatuses(treeUri: string | null): Promise<StatusScan>;
  allFilesAccess(): { supported: boolean; granted: boolean };
  openAllFilesAccessSettings(): Promise<void>;
  inspectStatuses(treeUri: string): Promise<{ found: boolean; items: LocalMedia[] }>;
  exportMedia(uri: string, treeUri: string | null, source: string, name: string, mime: string): Promise<{ uri: string; label: string }>;
  enqueue(url: string, name: string, key: string): Promise<string>;
  probeDirectory(treeUri: string): Promise<void>;
  thumbnail(uri: string, modified: number): Promise<string | null>;
  transfer(id: string): Promise<NativeTransfer>;
  removeTransfer(id: string): Promise<void>;
}
export const nativeStorage = requireOptionalNativeModule<StorageNative>('UltraSaveStorage');
