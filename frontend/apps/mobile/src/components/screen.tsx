import { colors, layout } from '@clapback/ui';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  style?: ViewStyle;
  edges?: Edge[];
}>;

export function Screen({
  children,
  padded = true,
  style,
  edges = ['top', 'bottom'],
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.container}>
      <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  padded: { paddingHorizontal: layout.screenGutter },
});
