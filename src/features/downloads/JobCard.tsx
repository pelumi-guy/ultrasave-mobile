import { useEffect, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Job } from '../../types';
import { sourceById } from '../../constants/sources';
import { useApp } from '../../providers/AppProvider';
import { colors, ui } from '../../styles/theme';
import { Button } from '../../components/Button';
import { bytesLabel, message } from '../../utils/media';
import { destinationLabel } from '../../services/queue';

const labels = { resolving: 'Finding media', selecting: 'Choose what to save', downloading: 'Saving to your device', needs_action: 'Needs attention', completed: 'Saved', cancelled: 'Cancelled', failed: 'Unavailable' };
export function JobCard({ job }: { job: Job }) {
  const app = useApp();
  const [selected, setSelected] = useState(job.selected);
  useEffect(() => { if (job.state === 'selecting') setSelected(job.selected); }, [job.state, job.id]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function action(fn: () => Promise<void>) { setBusy(true); setError(''); try { await fn(); } catch (e) { setError(message(e)); } finally { setBusy(false); } }
  return <View style={ui.card}>
    <View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.label}>{sourceById(job.source)?.name}{job.demo ? ' · SAMPLE' : ''}</Text><Text style={[ui.small, { color: job.state === 'completed' ? colors.accent : colors.muted }]}>{labels[job.state]}</Text></View>
    <Text style={ui.small}>{new Date(job.createdAt).toLocaleString()} · {destinationLabel(job)}</Text>
    {job.items.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.state}${job.state === 'selecting' ? ', toggle selection' : ''}`}
      onPress={() => {
        if (job.state === 'selecting') setSelected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id]);
        else if (item.savedUri) router.push({ pathname: '/preview', params: { uri: item.savedUri, kind: item.kind, name: item.name } });
      }} style={{ paddingVertical: 9, gap: 5, borderTopWidth: 1, borderColor: colors.border }}>
      <View style={ui.row}><Ionicons name={job.state === 'selecting' ? (selected.includes(item.id) ? 'checkbox' : 'square-outline') : item.state === 'saved' ? 'checkmark-circle' : item.kind === 'video' ? 'videocam-outline' : 'image-outline'} size={22} color={colors.accent} />
        <View style={{ flex: 1 }}><Text numberOfLines={1} style={ui.label}>{item.name}</Text><Text style={ui.small}>{item.kind} · {bytesLabel(item.bytes)}{item.duration !== undefined ? ` · ${Math.round(item.duration)}s` : ''}{item.has_audio !== undefined ? item.has_audio ? ' · audio' : ' · silent' : ''} · {item.state}</Text></View></View>
      {!!item.transferred && item.state !== 'saved' && <Text style={ui.small}>{bytesLabel(item.transferred)} / {item.total && item.total > 0 ? bytesLabel(item.total) : 'size unknown'}</Text>}
      {item.error && <Text style={ui.error}>{item.error}</Text>}
    </Pressable>)}
    {(error || job.error) && <Text accessibilityLiveRegion="polite" style={ui.error}>{error || job.error}</Text>}
    {job.state === 'selecting' && <Button title={`Save ${selected.length} ${selected.length === 1 ? 'item' : 'items'}`} busy={busy} disabled={!selected.length} onPress={() => void action(() => app.select(job.id, selected))} />}
    {job.state === 'needs_action' && <Button title="Retry remaining items" busy={busy} onPress={() => void action(() => app.retry(job.id))} />}
    {!['completed', 'cancelled', 'failed'].includes(job.state) && <Button secondary title="Cancel request" busy={busy} onPress={() => void action(() => app.cancel(job.id))} />}
  </View>;
}
