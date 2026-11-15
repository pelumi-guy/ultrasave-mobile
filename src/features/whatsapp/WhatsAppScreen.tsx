import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, View, Text, Pressable, Image, FlatList, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../providers/AppProvider';
import { whatsappReady, pickFolder, statuses, checkStorageAccess, requestMediaAccess, openAllFilesAccess, openAppSettings,
  storageAccessComplete, type StorageAccess } from '../../services/storage';
import { type LocalMedia, type StatusScan } from '../../../modules/ultrasave-storage';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { ui, colors } from '../../styles/theme';
import { bytesLabel, message } from '../../utils/media';
import { VideoThumbnail } from './VideoThumbnail';

export function WhatsAppScreen() {
  const { settings, updateSettings, saveLocal } = useApp();
  const [scan, setScan] = useState<StatusScan>();
  const [tab, setTab] = useState<'image' | 'video'>('image');
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [access, setAccess] = useState<StorageAccess>();
  const [requesting, setRequesting] = useState(false);
  const prompted = useRef(false);
  const [saving, setSaving] = useState<string>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refreshId = useRef(0);
  const settingsReady = !!settings;
  const tree = settings?.whatsappTree;

  const refresh = useCallback(async (folder = tree) => {
    if (!settingsReady || !whatsappReady) return;
    const requestId = ++refreshId.current;
    setBusy(true);
    setError('');
    try {
      const [result, permissions] = await Promise.all([statuses(folder), checkStorageAccess()]);
      if (refreshId.current === requestId) { setScan(result); setAccess(permissions); }
    } catch (e) {
      if (refreshId.current === requestId) {
        setScan(undefined);
        setError(message(e));
      }
    } finally {
      if (refreshId.current === requestId) setBusy(false);
    }
  }, [settingsReady, tree]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => {
      refreshId.current++;
      subscription.remove();
    };
  }, [refresh]);

  // Ask for storage access the first time the screen finds statuses unreadable.
  useEffect(() => {
    if (prompted.current || !access || !scan || storageAccessComplete(access)) return;
    if (scan.state === 'ready' && scan.items.length > 0) return;
    prompted.current = true;
    if (access.allFiles === 'denied') {
      Alert.alert('Allow access to WhatsApp statuses',
        'Android hides WhatsApp’s status folder from apps. Turn on “Allow access to manage all files” for UltraSave on the next screen, then come back.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Open settings', onPress: () => void allowAccess() }]);
    } else void allowAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, scan]);

  async function allowAccess() {
    setRequesting(true);
    setError('');
    setNotice('');
    try {
      if (access?.allFiles === 'denied') {
        // Android 11+: settings toggle. Returning to the app triggers a refresh.
        await openAllFilesAccess();
        return;
      }
      if (access?.media === 'blocked') {
        await openAppSettings();
        return;
      }
      const media = await requestMediaAccess();
      if (media === 'blocked') setError('Storage permission was denied permanently. Open Settings → Permissions and allow Files and media.');
      else if (media === 'denied') setError('UltraSave cannot read WhatsApp statuses without storage permission.');
      setAccess(current => current && { ...current, media });
      await refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setRequesting(false);
    }
  }

  async function connect() {
    if (!settings) return;
    setConnecting(true);
    setError('');
    setNotice('');
    try {
      const selected = await pickFolder(scan?.initialUri);
      if (selected) {
        await updateSettings({ ...settings, whatsappTree: selected });
        // Regranting the same URI does not change the saved preference.
        await refresh(selected);
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setConnecting(false);
    }
  }

  async function save(item: LocalMedia) {
    setSaving(item.id);
    setError('');
    setNotice('');
    try {
      await saveLocal(item);
      setNotice(`Saved ${item.name} to your WhatsApp destination.`);
    } catch (e) {
      setError(message(e));
    } finally {
      setSaving(undefined);
    }
  }

  const items = scan?.items ?? [];
  const visible = items.filter(item => item.kind === tab);
  const accessMissing = whatsappReady && !!access && !storageAccessComplete(access) && !(scan?.state === 'ready' && items.length > 0);
  const needsConnection = whatsappReady && (scan?.state === 'missing' || scan?.state === 'needs_access' || !!error && !scan);

  return <FlatList style={ui.screen} contentContainerStyle={ui.content} data={visible} numColumns={2} keyExtractor={item => item.id}
    columnWrapperStyle={{ gap: 12 }} refreshControl={<RefreshControl refreshing={busy} onRefresh={() => void refresh()} tintColor={colors.accent} />}
    ListHeaderComponent={<View style={{ gap: 18, marginBottom: 18 }}>
      <Text style={ui.eyebrow}>WHATSAPP · ON YOUR DEVICE</Text><Text style={ui.title}>Keep the moment.</Text>
      <Text style={ui.body}>Your viewed WhatsApp statuses appear here. Preview an image or video, then save it to your WhatsApp download folder.</Text>
      {!whatsappReady && <Notice title={Platform.OS === 'android' ? 'Update the installed app' : 'Android required'}>
        {Platform.OS === 'android'
          ? 'This installation is missing WhatsApp folder support. Install the rebuilt UltraSave APK and reopen this screen.'
          : 'Browsing WhatsApp status folders is available on Android.'}
      </Notice>}
      {accessMissing && <Notice title="Storage permission needed">
        {access?.allFiles === 'denied'
          ? 'Android keeps WhatsApp’s status folder hidden. Tap below, turn on “Allow access to manage all files” for UltraSave, then return here.'
          : access?.media === 'blocked'
            ? 'Storage permission was turned off. Open UltraSave’s app settings and allow Files and media (or Photos and videos).'
            : 'UltraSave needs permission to read photos and videos on this phone to show your WhatsApp statuses.'}
      </Notice>}
      {accessMissing && <Button title={access?.allFiles === 'denied' ? 'Allow all files access' : access?.media === 'blocked' ? 'Open app settings' : 'Allow storage access'}
        busy={requesting} disabled={busy} onPress={() => void allowAccess()} />}
      {scan?.state === 'needs_access' && !accessMissing && <Notice title="Allow access to WhatsApp statuses">
        Android needs a folder grant to read your statuses. Choose WhatsApp’s Media folder in the system picker. You can select Media even when .Statuses is hidden.
      </Notice>}
      {scan?.state === 'missing' && <Notice title="No readable status folder found">
        View a recent image or video status in WhatsApp, then pull down to refresh. If statuses are stored elsewhere, connect WhatsApp’s Media folder.
      </Notice>}
      {needsConnection && <Button secondary={accessMissing} title={accessMissing ? 'Or choose the WhatsApp Media folder' : 'Connect WhatsApp Media folder'}
        busy={connecting} disabled={!settings || busy}
        onPress={() => void connect()} />}
      {scan?.state === 'ready' && <Text style={ui.small}>
        WhatsApp status folder connected · Pull down to refresh.
      </Text>}
      {scan?.state === 'ready' && items.length === 0 && <Notice title="No cached statuses yet">
        View a recent image or video status in WhatsApp, then return here or pull down to refresh.
      </Notice>}
      {error && <Notice error title="Needs attention">{error}</Notice>}
      {notice && <Text accessibilityLiveRegion="polite" style={[ui.body, { color: colors.accent }]}>{notice}</Text>}
      <View style={ui.row}>{(['image', 'video'] as const).map(kind => <Pressable key={kind} accessibilityRole="tab" accessibilityState={{ selected: tab === kind }}
        onPress={() => setTab(kind)} style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: tab === kind ? colors.accent : colors.panel }}>
        <Text style={{ color: tab === kind ? colors.dark : colors.text, fontWeight: '700' }}>{kind === 'image' ? 'Images' : 'Videos'} · {items.filter(i => i.kind === kind).length}</Text>
      </Pressable>)}</View>
    </View>}
    ListEmptyComponent={<Text style={ui.body}>{busy ? 'Looking for WhatsApp statuses…' : `No ${tab === 'image' ? 'images' : 'videos'} to show yet.`}</Text>}
    renderItem={({ item }) => <View style={[ui.card, { flex: 1, maxWidth: '49%', padding: 10, marginBottom: 12 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.name}`} onPress={() => router.push({ pathname: '/preview', params: { uri: item.uri, kind: item.kind, name: item.name } })}>
        {item.kind === 'image' ? <Image source={{ uri: item.uri }} style={{ height: 150, borderRadius: 12, backgroundColor: colors.panel2 }} resizeMode="cover" /> :
          <VideoThumbnail uri={item.uri} modified={item.modified} />}
      </Pressable><Text numberOfLines={1} style={ui.small}>{item.name}</Text><Text style={ui.small}>{bytesLabel(item.bytes)}</Text>
      <Button title="Save" busy={saving === item.id} disabled={!!saving || !whatsappReady || !settings} onPress={() => void save(item)} />
    </View>} />;
}
