import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { sources, hasRemoteExtraction } from '../../constants/sources';
import { colors, ui } from '../../styles/theme';
import { useApp } from '../../providers/AppProvider';
import { Notice } from '../../components/Notice';
export default function Home() {
  const { jobs, startupError } = useApp();
  const saved = jobs.reduce((count, j) => count + j.items.filter(i => i.state === 'saved').length, 0);
  return <SafeAreaView style={ui.screen} edges={['top']}><ScrollView contentContainerStyle={ui.content}>
    <View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.eyebrow}>ULTRASAVE</Text><Text style={styles.badge}>PRIVATE ALPHA · 0.1</Text></View>
    <View style={{ gap: 9 }}><Text style={ui.title}>Good content.{'\n'}Yours to keep.</Text><Text style={ui.body}>One quiet place for the moments you want to save.</Text></View>
    {startupError && <Notice error title="Storage needs attention">{startupError}</Notice>}
    <View style={[ui.card, ui.row, { backgroundColor: '#143127', borderColor: '#275340' }]}>
      <Ionicons name="leaf-outline" size={28} color={colors.accent} /><View style={{ flex: 1 }}><Text style={ui.label}>No ads. No interruptions.</Text><Text style={ui.small}>{saved} {saved === 1 ? 'file' : 'files'} saved · Separate folders for every source</Text></View>
    </View>
    <Text style={ui.heading}>Choose a source</Text>
    <View style={styles.grid}>{sources.map(source => <Pressable key={source.id} accessibilityRole="button" accessibilityLabel={`Open ${source.name}`}
      onPress={() => router.push({ pathname: '/source/[source]', params: { source: source.id } })}
      style={({ pressed }) => [styles.tile, pressed && { opacity: .7 }]}>
      <View style={[styles.icon, { backgroundColor: `${source.color}18` }]}><Ionicons name={source.icon} color={source.color} size={27} /></View>
      <Text style={ui.label}>{source.name}</Text><Text style={ui.small}>{source.hint}</Text>
      <Text style={[styles.capability, { color: source.id === 'whatsapp' || hasRemoteExtraction(source.id) ? colors.accent : colors.muted }]}>{source.id === 'whatsapp' ? 'ON-DEVICE' : hasRemoteExtraction(source.id) ? 'VIA YOUR BACKEND' : 'EXTRACTION PLANNED'}</Text>
    </Pressable>)}</View>
    <Text style={ui.small}>Save content you own or have permission to keep. Public videos from X, Threads, TikTok, and YouTube are prepared by your private backend.</Text>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  badge: { color: colors.muted, fontSize: 9, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47.8%', flexGrow: 1, backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 19, padding: 17, gap: 9, minHeight: 181 },
  icon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  capability: { fontSize: 9, letterSpacing: 1, fontWeight: '600', marginTop: 7 },
});
