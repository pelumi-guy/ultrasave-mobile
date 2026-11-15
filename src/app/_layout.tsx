import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../providers/AppProvider';
import { colors } from '../styles/theme';
// Run before React mounts so native startup stays branded while storage loads.
void SplashScreen.preventAutoHideAsync().catch(error => console.warn('Could not keep the splash screen visible', error));

function AppNavigator() {
  const { settings, startupError } = useApp();
  const [laidOut, setLaidOut] = useState(false);
  const ready = settings !== undefined || startupError !== undefined;
  useEffect(() => {
    // Release on failure too, so Home can show its storage recovery message.
    if (laidOut && ready) {
      void SplashScreen.hideAsync().catch(error => console.warn('Could not hide the splash screen', error));
    }
  }, [laidOut, ready]);
  return <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={() => setLaidOut(true)}><StatusBar style="light" /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.bg }, headerShadowVisible: false }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="source/[source]" options={{ title: 'Save media' }} />
    <Stack.Screen name="preview" options={{ title: 'Preview', presentation: 'modal' }} />
  </Stack></View>;
}

export default function Layout() {
  return <SafeAreaProvider><AppProvider><AppNavigator /></AppProvider></SafeAreaProvider>;
}
