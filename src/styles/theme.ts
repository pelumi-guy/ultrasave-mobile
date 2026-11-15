import { StyleSheet } from 'react-native';
export const colors = {
  bg: '#0B1019', panel: '#151E2B', panel2: '#1B2737', border: '#2A384B', text: '#F4F6FA',
  muted: '#A4B2C6', accent: '#9AF3CD', dark: '#0A3023', error: '#FFACA9',
};
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 20, paddingBottom: 40 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 34, fontWeight: '700', letterSpacing: -1.1 },
  heading: { color: colors.text, fontSize: 20, fontWeight: '600' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 18, gap: 12 },
  input: { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 15, minHeight: 52 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  error: { color: colors.error, fontSize: 14, lineHeight: 21 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 19 },
});
