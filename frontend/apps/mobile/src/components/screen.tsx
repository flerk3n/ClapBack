import { colors, layout } from '@clapback/ui';
import type { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, View, type ViewStyle } from 'react-native';

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  style?: ViewStyle;
}>;

export function Screen({ children, padded = true, style }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  padded: { paddingHorizontal: layout.screenGutter },
});
