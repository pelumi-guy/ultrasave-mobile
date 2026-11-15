import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'UltraSave', slug: 'ultrasave', scheme: 'ultrasave', version: '0.1.0',
  icon: './assets/app-icon.png',
  backgroundColor: '#0B1019',
  orientation: 'portrait', userInterfaceStyle: 'dark',
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B1019',
    },
    package: 'com.ultrasave.mobile', permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    // Read permissions for WhatsApp statuses are declared in ./plugins/withAndroidStorage.
    blockedPermissions: ['android.permission.WRITE_EXTERNAL_STORAGE'],
  },
  ios: { bundleIdentifier: 'com.ultrasave.mobile', supportsTablet: true },
  plugins: [
    'expo-router', 'expo-secure-store', 'expo-sqlite',
    ['expo-splash-screen', {
      image: './assets/app-icon.png',
      imageWidth: 180,
      resizeMode: 'contain',
      backgroundColor: '#0B1019',
      dark: { image: './assets/app-icon.png', backgroundColor: '#0B1019' },
    }],
    './plugins/withAndroidStorage', './plugins/withWindowsCmakePaths',
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: {
      projectId: 'b86fb78c-5041-487e-8aac-8813215a2f5b',
    },
  },
};
export default config;
