import { colors, layout, radii, spacing } from '@clapback/ui';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from './app-text';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'dark' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const inverse = variant === 'primary' || variant === 'dark';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={inverse ? colors.white : colors.ink} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={20} color={inverse ? colors.white : colors.ink} /> : null}
          <AppText variant="bodyStrong" tone={inverse ? 'inverse' : 'default'}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  primary: { backgroundColor: colors.coral },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  dark: { backgroundColor: colors.ink },
  ghost: { backgroundColor: colors.transparent },
  disabled: { backgroundColor: colors.border, borderColor: colors.border },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
});
