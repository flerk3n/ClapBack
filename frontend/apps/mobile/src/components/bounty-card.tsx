import type { Bounty } from '@clapback/contracts';
import type { BountyVisual } from '@clapback/demo-data';
import { colors, formatCurrency, radii, shadows, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText } from './app-text';

const SWIPE_THRESHOLD = 105;

type BountyCardProps = {
  bounty: Bounty;
  visual: BountyVisual;
  active?: boolean;
  onAccept: () => void;
  onSkip: () => void;
  onOpenDetails: () => void;
};

function ProductSculpture({ visual }: { visual: BountyVisual }) {
  return (
    <View style={styles.sculptureArea} pointerEvents="none">
      <View style={[styles.sculptureHalo, { backgroundColor: visual.accent }]} />
      <View style={[styles.productObject, visual.motif === 'mic' && styles.productMic]}>
        <View style={styles.productShine} />
        <AppText variant="eyebrow" style={styles.productLabel}>
          {visual.productLabel}
        </AppText>
      </View>
      <View style={styles.sculptureShadow} />
    </View>
  );
}

export function BountyCard({
  bounty,
  visual,
  active = true,
  onAccept,
  onSkip,
  onOpenDetails,
}: BountyCardProps) {
  const [position] = useState(() => new Animated.ValueXY());
  const { height } = useWindowDimensions();
  const cardHeight = Math.max(430, Math.min(570, height - 285));

  const completeSwipe = useCallback(
    (direction: 'left' | 'right') => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.timing(position, {
        toValue: { x: direction === 'right' ? 520 : -520, y: 12 },
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        if (direction === 'right') {
          onAccept();
        } else {
          onSkip();
        }
        position.setValue({ x: 0, y: 0 });
      });
    },
    [onAccept, onSkip, position],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          active && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) return completeSwipe('right');
          if (gesture.dx < -SWIPE_THRESHOLD) return completeSwipe('left');
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            damping: 18,
            stiffness: 170,
            useNativeDriver: true,
          }).start();
        },
      }),
    [active, completeSwipe, position],
  );

  const rotate = position.x.interpolate({
    inputRange: [-220, 0, 220],
    outputRange: ['-7deg', '0deg', '7deg'],
    extrapolate: 'clamp',
  });
  const acceptOpacity = position.x.interpolate({ inputRange: [20, 110], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = position.x.interpolate({ inputRange: [-110, -20], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      {...(active ? panResponder.panHandlers : {})}
      style={[
        styles.card,
        { height: cardHeight },
        active
          ? { transform: [...position.getTranslateTransform(), { rotate }] }
          : { transform: [{ scale: 0.965 }, { translateY: 10 }] },
      ]}>
      <Pressable style={styles.cardPressable} onPress={onOpenDetails} disabled={!active}>
        <LinearGradient colors={visual.colors} style={StyleSheet.absoluteFill} />
        <View style={styles.topRow}>
          <View style={[styles.badge, styles.typeBadge]}>
            <AppText variant="eyebrow" tone="inverse">
              {bounty.type}
            </AppText>
          </View>
          <View style={styles.badge}>
            <AppText variant="caption" tone="inverse">
              {bounty.niches[0]?.label}
            </AppText>
          </View>
        </View>

        <Animated.View style={[styles.decisionBadge, styles.acceptDecision, { opacity: acceptOpacity }]}>
          <Ionicons name="heart" size={18} color={colors.eucalyptus} />
          <AppText variant="eyebrow" style={{ color: colors.eucalyptus }}>ACCEPT</AppText>
        </Animated.View>
        <Animated.View style={[styles.decisionBadge, styles.skipDecision, { opacity: skipOpacity }]}>
          <Ionicons name="close" size={19} color={colors.crimson} />
          <AppText variant="eyebrow" style={{ color: colors.crimson }}>SKIP</AppText>
        </Animated.View>

        <ProductSculpture visual={visual} />

        <LinearGradient
          colors={['rgba(15,14,12,0)', colors.mediaScrimBottom]}
          locations={[0, 0.63]}
          style={styles.bottomScrim}>
          <View style={styles.brandRow}>
            <AppText variant="eyebrow" tone="inverse" style={styles.brandName}>
              {bounty.brandName}
            </AppText>
            <Ionicons name="checkmark-circle" size={15} color="rgba(255,255,255,0.86)" />
          </View>
          <AppText variant="title" tone="inverse" numberOfLines={2}>
            {bounty.productName}
          </AppText>
          <AppText variant="body" tone="inverse" numberOfLines={2} style={styles.brief}>
            {bounty.brief}
          </AppText>
          <View style={styles.payoutRow}>
            <View>
              <AppText variant="caption" tone="inverse" style={styles.translucent}>YOUR PAYOUT</AppText>
              <AppText variant="heading" tone="inverse">{formatCurrency(bounty.creatorPayoutCents)}</AppText>
            </View>
            <View style={styles.deadline}>
              <Ionicons name="time-outline" size={15} color={colors.white} />
              <AppText variant="caption" tone="inverse">{bounty.displayDeadline}</AppText>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.inkSoft,
    ...shadows.card,
  },
  cardPressable: { flex: 1 },
  topRow: {
    position: 'absolute',
    top: spacing[4],
    left: spacing[4],
    right: spacing[4],
    zIndex: 3,
    flexDirection: 'row',
    gap: spacing[2],
  },
  badge: {
    minHeight: 30,
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,16,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  typeBadge: { backgroundColor: 'rgba(20,18,16,0.64)' },
  decisionBadge: {
    position: 'absolute',
    top: 70,
    zIndex: 5,
    paddingHorizontal: spacing[3],
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  acceptDecision: { left: spacing[4], transform: [{ rotate: '-5deg' }] },
  skipDecision: { right: spacing[4], transform: [{ rotate: '5deg' }] },
  sculptureArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  sculptureHalo: { position: 'absolute', width: 260, height: 260, borderRadius: 130, opacity: 0.24 },
  productObject: {
    width: 126,
    height: 190,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[6],
    transform: [{ rotate: '8deg' }],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  productMic: { width: 96, height: 210, borderRadius: 46 },
  productShine: {
    position: 'absolute',
    top: 14,
    left: 18,
    width: 16,
    height: 112,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  productLabel: { color: colors.ink, letterSpacing: 1.6 },
  sculptureShadow: {
    position: 'absolute',
    bottom: 118,
    width: 160,
    height: 26,
    borderRadius: 80,
    backgroundColor: 'rgba(20,16,12,0.22)',
    transform: [{ rotate: '4deg' }],
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing[5],
    paddingTop: 100,
    paddingBottom: spacing[5],
    gap: spacing[2],
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  brandName: { opacity: 0.9 },
  brief: { opacity: 0.88, maxWidth: '94%' },
  payoutRow: {
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.28)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  deadline: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingBottom: 3 },
  translucent: { opacity: 0.66, marginBottom: 1 },
});
