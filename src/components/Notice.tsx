import { Text, View } from 'react-native';
import { ui, colors } from '../styles/theme';
export function Notice({ title, children, error }: { title?: string; children: string; error?: boolean }) {
  return <View accessibilityLiveRegion="polite" style={[ui.card, error && { borderColor: colors.error }]}>
    {title && <Text style={error ? ui.error : ui.label}>{title}</Text>}
    <Text style={error ? ui.error : ui.body}>{children}</Text>
  </View>;
}
