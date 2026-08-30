import { colors, spacing } from '@clapback/ui';
import { StyleSheet, View } from 'react-native';
import { AppText } from './app-text';

export function MetricBlock({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.block}>
      <AppText variant="heading" style={[styles.value, accent && styles.accent]}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted" style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { flex: 1, gap: 2, alignItems: 'center' },
  value: { color: colors.white, fontSize: 20, lineHeight: 24, fontWeight: '700' },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.2 },
  accent: { color: '#FCD34D' },
});
