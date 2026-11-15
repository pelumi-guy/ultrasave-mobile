import { Linking, PermissionsAndroid, Platform } from 'react-native';
import * as FS from 'expo-file-system/legacy';
import { nativeStorage } from '../../modules/ultrasave-storage';
import { sourceFolder } from '../constants/sources';
import { stableName } from '../utils/media';
import type { Destination, SourceId } from '../types';

export const nativeReady = Platform.OS === 'android' && !!nativeStorage;
export const whatsappReady = nativeReady && typeof nativeStorage?.discoverStatuses === 'function';
export async function pickFolder(initialUri?: string) {
  if (Platform.OS !== 'android') throw new Error('Custom folders are available on Android in this build.');
  const result = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
  return result.granted ? result.directoryUri : undefined;
}
export interface StorageAccess {
  /** Runtime media/storage read permission (READ_MEDIA_* on 13+, READ_EXTERNAL_STORAGE before). */
  media: 'granted' | 'denied' | 'blocked';
  /** Android 11+ "All files access"; needed to read the hidden .Statuses folder directly. */
  allFiles: 'granted' | 'denied' | 'unsupported';
}

function mediaPermissions() {
  const P = PermissionsAndroid.PERMISSIONS;
  return Number(Platform.Version) >= 33 ? [P.READ_MEDIA_IMAGES, P.READ_MEDIA_VIDEO] : [P.READ_EXTERNAL_STORAGE];
}
function allFilesState(): StorageAccess['allFiles'] {
  if (typeof nativeStorage?.allFilesAccess !== 'function') return 'unsupported';
  const access = nativeStorage.allFilesAccess();
  return !access.supported ? 'unsupported' : access.granted ? 'granted' : 'denied';
}
/** True when nothing more can be requested: all-files access, or media access on Android 10 and earlier. */
export function storageAccessComplete(access?: StorageAccess) {
  return !!access && (access.allFiles === 'granted' || access.allFiles === 'unsupported' && access.media === 'granted');
}

export async function checkStorageAccess(): Promise<StorageAccess | undefined> {
  if (Platform.OS !== 'android') return undefined;
  const granted = await Promise.all(mediaPermissions().map(p => PermissionsAndroid.check(p)));
  return { media: granted.every(Boolean) ? 'granted' : 'denied', allFiles: allFilesState() };
}

/** Shows Android's runtime storage/media permission dialog. */
export async function requestMediaAccess(): Promise<StorageAccess['media']> {
  if (Platform.OS !== 'android') return 'denied';
  const results = Object.values(await PermissionsAndroid.requestMultiple(mediaPermissions()));
  if (results.every(r => r === PermissionsAndroid.RESULTS.GRANTED)) return 'granted';
  return results.includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) ? 'blocked' : 'denied';
}

/** Opens the All files access page for UltraSave; the user returns to the app afterwards. */
export async function openAllFilesAccess() {
  if (typeof nativeStorage?.openAllFilesAccessSettings !== 'function') throw new Error('Install the rebuilt UltraSave APK to request All files access.');
  await nativeStorage.openAllFilesAccessSettings();
}

export function openAppSettings() { return Linking.openSettings(); }

export async function probeDestination(tree: string) {
  if (!nativeStorage) throw new Error('Install the UltraSave development build to validate a save folder.');
  await nativeStorage.probeDirectory(tree);
}
export async function statuses(tree?: string) {
  if (!whatsappReady || !nativeStorage) throw new Error('Install a rebuilt UltraSave Android APK to enable WhatsApp folder access.');
  return nativeStorage.discoverStatuses(tree ?? null);
}
export async function exportMedia(uri: string, destination: Destination, source: SourceId, id: string, name: string, mime: string) {
  if (!nativeStorage) throw new Error('Saving to Android folders requires the UltraSave development build.');
  return nativeStorage.exportMedia(uri, destination.kind === 'tree' ? destination.uri! : null, sourceFolder(source), stableName(id, name), mime);
}
