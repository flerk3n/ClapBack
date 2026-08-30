import { colors, typography } from '@clapback/ui';
import type { ComponentProps } from 'react';
import { Text } from 'react-native';

type TextVariant = keyof typeof typography;

type AppTextProps = ComponentProps<typeof Text> & {
  variant?: TextVariant;
  tone?: 'default' | 'soft' | 'muted' | 'inverse' | 'coral' | 'positive';
};

const toneColors = {
  default: colors.ink,
  soft: colors.inkSoft,
  muted: colors.inkMuted,
  inverse: colors.white,
  coral: colors.coral,
  positive: colors.eucalyptus,
} as const;

export function AppText({ variant = 'body', tone = 'default', style, ...props }: AppTextProps) {
  return <Text style={[typography[variant], { color: toneColors[tone] }, style]} {...props} />;
}
