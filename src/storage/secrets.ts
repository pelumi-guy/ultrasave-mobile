import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
let previewToken = '';
export async function getToken() { return Platform.OS === 'web' ? previewToken : (await SecureStore.getItemAsync('backend-token')) ?? ''; }
export async function setToken(token: string) {
  if (Platform.OS === 'web') { previewToken = token; return; }
  if (token) await SecureStore.setItemAsync('backend-token', token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  else await SecureStore.deleteItemAsync('backend-token');
}
