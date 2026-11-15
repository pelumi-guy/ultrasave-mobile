import { ActivityIndicator, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/theme';
export function Button({ title, onPress, secondary, disabled, busy }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; busy?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || busy) && { opacity: .5 }, pressed && { opacity: .75 }]}>
    {busy && <ActivityIndicator color={secondary ? colors.accent : colors.dark} />}
    <Text style={[styles.text, secondary && { color: colors.text }]}>{title}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  secondary: { backgroundColor: colors.panel2, borderColor: colors.border, borderWidth: 1 },
  text: { color: colors.dark, fontSize: 14, fontWeight: '700' },
});
