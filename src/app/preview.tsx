import { useLocalSearchParams, Stack } from 'expo-router';
import { Image, View, Text, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, ui } from '../styles/theme';
function Video({ uri }: { uri: string }) { const player = useVideoPlayer(uri); return <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" />; }
export default function Preview() {
  const { uri, kind, name } = useLocalSearchParams<{ uri: string; kind: string; name: string }>();
  if (!uri || !/^(file|content|https?):/.test(uri)) return <Text style={ui.error}>This media cannot be previewed.</Text>;
  return <View style={{ flex: 1, backgroundColor: colors.bg }}><Stack.Screen options={{ title: name ?? 'Preview' }} />
    {kind === 'video' ? <Video uri={uri} /> : <Image source={{ uri }} style={{ flex: 1 }} resizeMode="contain" accessibilityLabel={name ?? 'Selected image'} />}
  </View>;
}
