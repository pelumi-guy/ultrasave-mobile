import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nativeStorage } from '../../../modules/ultrasave-storage';
import { colors } from '../../styles/theme';
export function VideoThumbnail({ uri, modified }: { uri: string; modified: number }) {
  const [thumbnail, setThumbnail] = useState<string>();
  useEffect(() => {
    let alive = true;
    void nativeStorage?.thumbnail(uri, modified).then(value => { if (alive && value) setThumbnail(value); }).catch(() => {});
    return () => { alive = false; };
  }, [uri, modified]);
  return <View style={{ height: 150, borderRadius: 12, backgroundColor: colors.panel2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    {thumbnail && <Image source={{ uri: thumbnail }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />}
    <Ionicons name="play-circle" size={44} color={colors.text} style={{ backgroundColor: '#0B101970', borderRadius: 30 }} />
  </View>;
}
