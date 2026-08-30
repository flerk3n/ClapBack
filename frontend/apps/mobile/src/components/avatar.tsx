import { colors } from '@clapback/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { AppText } from './app-text';

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient colors={['#C67C68', '#6B4A43']} style={StyleSheet.absoluteFill} />
      <AppText variant={size > 60 ? 'heading' : 'bodyStrong'} tone="inverse">
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
