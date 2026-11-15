import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/theme';
export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border }, tabBarLabelStyle: { fontSize: 11 } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={typeof color === 'string' ? color : colors.muted} size={size} /> }} />
    <Tabs.Screen name="downloads" options={{ title: 'Downloads', tabBarIcon: ({ color, size }) => <Ionicons name="download-outline" color={typeof color === 'string' ? color : colors.muted} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Ionicons name="options-outline" color={typeof color === 'string' ? color : colors.muted} size={size} /> }} />
  </Tabs>;
}
