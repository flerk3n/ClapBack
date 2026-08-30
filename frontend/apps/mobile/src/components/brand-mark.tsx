import { colors, spacing } from '@clapback/ui';
import { StyleSheet, View } from 'react-native';
import { AppText } from './app-text';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <View style={styles.cardBack} />
        <View style={styles.cardFront} />
      </View>
      {!compact ? <AppText variant="subheading">Clapback</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCompact: { width: 38, height: 38, borderRadius: 13 },
  cardBack: {
    position: 'absolute',
    width: 15,
    height: 20,
    borderRadius: 5,
    backgroundColor: colors.coral,
    transform: [{ translateX: -4 }, { rotate: '-12deg' }],
  },
  cardFront: {
    width: 15,
    height: 20,
    borderRadius: 5,
    backgroundColor: colors.surface,
    transform: [{ translateX: 4 }, { rotate: '10deg' }],
  },
});
