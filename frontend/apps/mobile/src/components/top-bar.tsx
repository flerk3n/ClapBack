import { colors } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './app-text';
import { BrandMark } from './brand-mark';

export function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
        ) : (
          <BrandMark compact />
        )}
      </View>
      {title ? <AppText variant="bodyStrong">{title}</AppText> : null}
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { minWidth: 44, alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
});
