import { colors, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './app-text';

type ChipProps = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: ChipProps) {
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={handlePress}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && styles.pressed]}>
      {selected ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
      <AppText variant="bodyStrong" tone={selected ? 'inverse' : 'default'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  pressed: { transform: [{ scale: 0.97 }] },
});
