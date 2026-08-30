export const colors = {
  canvas: '#F5F2EC',
  surface: '#FFFCF8',
  surfaceRaised: '#FFFFFF',
  ink: '#181816',
  inkSoft: '#494742',
  inkMuted: '#77736C',
  border: '#E5E0D7',
  borderStrong: '#CBC4B8',
  coral: '#D9634C',
  coralPressed: '#BC4F3B',
  coralWash: '#F5DDD7',
  eucalyptus: '#356B60',
  eucalyptusWash: '#DCEBE6',
  amber: '#A96F2B',
  amberWash: '#F4E7D2',
  crimson: '#A4423B',
  crimsonWash: '#F2DCDA',
  slate: '#52616B',
  slateWash: '#E1E7EA',
  white: '#FFFFFF',
  transparent: 'transparent',
  scrim: 'rgba(20, 19, 17, 0.46)',
  mediaScrimTop: 'rgba(16, 16, 14, 0.05)',
  mediaScrimBottom: 'rgba(16, 16, 14, 0.82)',
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 44, lineHeight: 48, fontFamily: 'DMSans_700Bold', letterSpacing: -1.4 },
  hero: { fontSize: 34, lineHeight: 39, fontFamily: 'DMSans_700Bold', letterSpacing: -0.9 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'DMSans_700Bold', letterSpacing: -0.6 },
  heading: { fontSize: 22, lineHeight: 28, fontFamily: 'DMSans_700Bold', letterSpacing: -0.35 },
  subheading: { fontSize: 18, lineHeight: 24, fontFamily: 'DMSans_600SemiBold', letterSpacing: -0.15 },
  bodyLarge: { fontSize: 17, lineHeight: 25, fontFamily: 'DMSans_400Regular' },
  body: { fontSize: 15, lineHeight: 22, fontFamily: 'DMSans_400Regular' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontFamily: 'DMSans_600SemiBold' },
  label: { fontSize: 13, lineHeight: 17, fontFamily: 'DMSans_600SemiBold', letterSpacing: 0.15 },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: 'DMSans_500Medium', letterSpacing: 0.2 },
  eyebrow: { fontSize: 11, lineHeight: 14, fontFamily: 'DMSans_700Bold', letterSpacing: 1.1 },
  numberHero: { fontSize: 38, lineHeight: 42, fontFamily: 'DMSans_700Bold', letterSpacing: -1 },
} as const;

export const layout = {
  screenGutter: 20,
  compactGutter: 16,
  maxContentWidth: 520,
  buttonHeight: 56,
  touchTarget: 44,
} as const;

export const shadows = {
  card: {
    shadowColor: '#241F18',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  floating: {
    shadowColor: '#241F18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const theme = { colors, spacing, radii, typography, layout, shadows } as const;

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatFollowers(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`;
  return value.toLocaleString('en-US');
}

export function formatClapScore(value: number): string {
  return `${value.toFixed(1)}x`;
}
