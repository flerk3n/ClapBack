import { colors, spacing } from '@clapback/ui';
import { StyleSheet, View } from 'react-native';
import { AppText } from './app-text';

export function MetricBlock({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.block}>
      <AppText variant="heading" style={accent && styles.accent}>{value}</AppText>
      <AppText variant="caption" tone="muted">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { flex: 1, gap: spacing[1] },
  accent: { color: colors.eucalyptus },
});
