const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

// Read-only storage permissions used to list WhatsApp's cached statuses:
// - READ_EXTERNAL_STORAGE: Android 12 and earlier (runtime prompt).
// - READ_MEDIA_IMAGES/VIDEO: Android 13+ (runtime prompt).
// - MANAGE_EXTERNAL_STORAGE: Android 11+ "All files access" settings toggle.
//   Scoped storage hides the dot-prefixed .Statuses folder from media-only
//   access, so this is the dependable direct-read route for the private alpha.
//   Google Play restricts this permission; review it before any public release.
// WRITE_EXTERNAL_STORAGE stays blocked: saves use MediaStore or SAF grants.
const READ_PERMISSIONS = [
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
];

// HTTP is limited to Android's debug variant for a local emulator/LAN backend.
// Release builds must use HTTPS.
module.exports = (config) => {
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest.$['xmlns:tools'] ??= 'http://schemas.android.com/tools';
    const declared = (manifest['uses-permission'] ??= []);
    for (const name of READ_PERMISSIONS) {
      // Drop any earlier declaration (including a tools:node="remove" block) first.
      for (let i = declared.length - 1; i >= 0; i--) if (declared[i].$?.['android:name'] === name) declared.splice(i, 1);
      const entry = { $: { 'android:name': name } };
      if (name === 'android.permission.MANAGE_EXTERNAL_STORAGE') entry.$['tools:ignore'] = 'ScopedStorage';
      declared.push(entry);
    }
    const app = mod.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:usesCleartextTraffic'] = 'false';
      // Android 10 needs legacy storage for direct file reads of WhatsApp/Media/.Statuses.
      app.$['android:requestLegacyExternalStorage'] = 'true';
    }
    return mod;
  });
  return withDangerousMod(config, ['android', async (mod) => {
    const target = path.join(mod.modRequest.platformProjectRoot, 'gradle/wrapper/gradle-wrapper.properties');
    const text = await fs.readFile(target, 'utf8');
    // The wrapper default of 10 seconds is too short on slow development links.
    await fs.writeFile(target, /networkTimeout=/.test(text) ? text.replace(/networkTimeout=\d+/, 'networkTimeout=120000') : `${text}\nnetworkTimeout=120000\n`);
    return mod;
  }]);
};
