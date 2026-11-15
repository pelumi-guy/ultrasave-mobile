import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ScrollView, View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { sourceById, hasRemoteExtraction } from '../../constants/sources';
import { colors, ui } from '../../styles/theme';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { useApp } from '../../providers/AppProvider';
import { WhatsAppScreen } from '../../features/whatsapp/WhatsAppScreen';
import { validateLink } from '../../utils/links';
import { message } from '../../utils/media';
import type { RemoteSource } from '../../types';
export default function SourceScreen() {
  const { source: id } = useLocalSearchParams<{ source: string }>();
  const source = sourceById(id ?? '');
  const app = useApp();
  const [url, setUrl] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (!source) return <Notice title="Unknown source">Choose one of the six sources from Home.</Notice>;
  if (source.id === 'whatsapp') return <><Stack.Screen options={{ title: 'WhatsApp statuses' }} /><WhatsAppScreen /></>;
  const remote = source.id as RemoteSource;
  async function resolve(demo = false) {
    const result = validateLink(url, remote);
    if (!demo && result.error) { setError(result.error); return; }
    setBusy(true); setError('');
    try { await app.resolve(remote, url, demo); router.push('/downloads'); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ title: source.name }} />
    <Ionicons name={source.icon} size={43} color={source.color} /><Text style={ui.title}>{source.caption}</Text><Text style={ui.body}>Paste a link. Choose your media. Keep it in your own folder.</Text>
    <View style={ui.card}><Text style={ui.label}>{source.name} link</Text>
      <TextInput accessibilityLabel={`${source.name} post link`} style={ui.input} value={url} onChangeText={text => { setUrl(text); setError(''); }}
        placeholder={'example' in source ? source.example : 'https://…'} placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      {error && <Text accessibilityLiveRegion="polite" style={ui.error}>{error}</Text>}
      <Button secondary title="Paste link" onPress={() => void Clipboard.getStringAsync().then(setUrl).catch(e => setError(message(e)))} />
      <Button title="Find media" busy={busy} disabled={!app.settings || !hasRemoteExtraction(remote)} onPress={() => void resolve()} />
      <Text style={ui.small}>Save to {app.settings?.destinations[remote].label ?? 'your source folder'}</Text>
    </View>
    {hasRemoteExtraction(remote)
      ? <Notice title="Public video links">Connect your private backend in Settings, then find the videos in this post. Preparation may take a few minutes. Private, login-only, live, or unavailable posts cannot be saved. YouTube supports individual videos and Shorts.</Notice>
      : <Notice title="Instagram extraction is planned">Instagram posts, reels, and stories are not connected yet. You can still test this source’s save folder with the sample collection.</Notice>}
    <View style={ui.card}><Text style={ui.heading}>Take the pipeline for a spin</Text><Text style={ui.body}>Use our own sample image and short video to test selection, progress and your {source.name} save folder.</Text>
      <Button secondary title="Try sample collection" busy={busy} disabled={!app.settings} onPress={() => void resolve(true)} />
      <Text style={ui.small}>Requires your local backend and the Android development build. These samples do not come from {source.name}.</Text>
    </View>
  </ScrollView>;
}
