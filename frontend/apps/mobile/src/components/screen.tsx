import { colors, layout } from '@clapback/ui';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const safeInsetsStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.container, safeInsetsStyle]}>
      <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  padded: { paddingHorizontal: layout.screenGutter },
});
