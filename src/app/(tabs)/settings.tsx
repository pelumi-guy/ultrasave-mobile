import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../providers/AppProvider';
import { ui, colors } from '../../styles/theme';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { sources } from '../../constants/sources';
import { pickFolder, probeDestination } from '../../services/storage';
import { setToken } from '../../storage/secrets';
import { request } from '../../services/api';
import { validateBackend } from '../../utils/links';
import { message } from '../../utils/media';
import type { SourceId } from '../../types';

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const [url, setUrl] = useState(''); const [token, setTokenInput] = useState('');
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (settings) setUrl(settings.backendUrl); }, [settings?.backendUrl]);
  async function action(fn: () => Promise<void>) { setBusy(true); setError(''); setNotice(''); try { await fn(); } catch (e) { setError(message(e)); } finally { setBusy(false); } }
  async function connect() {
    if (!settings || !validateBackend(url, __DEV__)) throw new Error('Enter an HTTPS backend address. Local HTTP is available in development builds only.');
    const next = { ...settings, backendUrl: url.trim().replace(/\/$/, '') };
    // Never erase an existing token when the field is left blank.
    await request(next, '/v1/session', undefined, undefined, token.trim() || undefined);
    await updateSettings(next);
    if (token.trim()) { await setToken(token.trim()); setTokenInput(''); }
    setNotice('Backend connected. Your access token is stored separately from download history.');
  }
  async function destination(id: SourceId) {
    if (!settings) return;
    const uri = await pickFolder(); if (!uri) return;
    await probeDestination(uri);
    const source = sources.find(s => s.id === id)!;
    await updateSettings({ ...settings, destinations: { ...settings.destinations, [id]: { kind: 'tree', uri, label: `Selected folder / ${source.folder}` } } });
    setNotice(`${source.name} will save into its own ${source.folder} subfolder. Existing jobs keep their destination until explicitly retried.`);
  }
  return <SafeAreaView style={ui.screen} edges={['top']}><ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
    <Text style={ui.eyebrow}>MAKE IT YOURS</Text><Text style={ui.title}>Settings</Text>
    {error && <Notice error title="Needs attention">{error}</Notice>}{notice && <Notice title="All set">{notice}</Notice>}
    <View style={ui.card}><Text style={ui.heading}>Your private backend</Text><Text style={ui.body}>Connect the service to save public videos from X, Threads, TikTok, and YouTube, or to try sample downloads.</Text>
      <Text style={ui.label}>Server address</Text><TextInput accessibilityLabel="Backend server address" style={ui.input} placeholder="http://10.0.2.2:8000" placeholderTextColor={colors.muted} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      <Text style={ui.label}>Access token</Text><TextInput accessibilityLabel="Private backend access token" style={ui.input} placeholder="Paste token to add or replace" placeholderTextColor={colors.muted} value={token} onChangeText={setTokenInput} autoCapitalize="none" autoCorrect={false} secureTextEntry />
      <Button title="Save and test connection" busy={busy} disabled={!settings} onPress={() => void action(connect)} />
      <Text style={ui.small}>Android emulator: 10.0.2.2 reaches your computer. Physical phone: use a reachable LAN address or HTTPS host. Tokens never appear in download history.</Text>
    </View>
    <Text style={ui.heading}>One source, one folder</Text><Text style={ui.body}>Choose a parent folder. UltraSave creates a separate source subfolder inside it.</Text>
    {sources.map(source => <View key={source.id} style={ui.card}><View style={ui.row}><Ionicons name={source.icon} color={source.color} size={24} /><View style={{ flex: 1 }}><Text style={ui.label}>{source.name}</Text><Text style={ui.small}>{settings?.destinations[source.id].label ?? 'Loading…'}</Text></View></View>
      <Button secondary title="Choose parent folder" disabled={busy || !settings || Platform.OS !== 'android'} onPress={() => void action(() => destination(source.id))} />
      {settings?.destinations[source.id].kind === 'tree' && <Button secondary title="Use Downloads default" disabled={busy} onPress={() => void action(async () => {
        await updateSettings({ ...settings, destinations: { ...settings.destinations, [source.id]: { kind: 'default', label: `Downloads/UltraSave/${source.folder}` } } });
      })} />}
    </View>)}
    <Text style={ui.small}>WhatsApp source access is connected on its own screen. Changing a save destination does not grant WhatsApp access or move existing files. Custom folder access must be granted again if Android revokes it.</Text>
    <Text style={ui.small}>This build targets Android. iOS Files/Photos saving and production background recovery remain a later adaptation.</Text>
  </ScrollView></SafeAreaView>;
}
