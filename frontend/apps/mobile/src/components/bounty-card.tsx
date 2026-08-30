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
  cardHeight?: number;
  onAccept: () => void;
  onSkip: () => void;
  onOpenDetails: () => void;
};

function ProductSculpture({ visual }: { visual: BountyVisual }) {
  return (
    <View style={styles.sculptureArea} pointerEvents="none">
      {/* Dynamic ambient backdrop aura */}
      <View style={[styles.sculptureHalo, { backgroundColor: visual.accent }]} />
      <View style={[styles.sculptureHaloInner, { backgroundColor: visual.accent }]} />

      {/* Motif-specific visual architecture */}
      {visual.motif === 'orb' ? (
        <View style={styles.orbContainer}>
          <View style={styles.orbBody}>
            <LinearGradient
              colors={['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.64)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.dropletShine} />
            <View style={styles.orbCap} />
            <AppText variant="eyebrow" style={styles.productLabel}>
              {visual.productLabel}
            </AppText>
          </View>
          <View style={styles.orbAuraRing} />
        </View>
      ) : visual.motif === 'shoe' ? (
        <View style={styles.shoeContainer}>
          <View style={styles.shoeSole}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(240,245,242,0.72)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.shoeAirPocket} />
            <View style={styles.shoeStripe} />
            <AppText variant="eyebrow" style={styles.productLabel}>
              {visual.productLabel}
            </AppText>
          </View>
        </View>
      ) : visual.motif === 'bowl' ? (
        <View style={styles.bowlContainer}>
          <View style={styles.bowlBody}>
            <LinearGradient
              colors={['rgba(255,255,255,0.94)', 'rgba(255,248,235,0.75)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.bowlRim} />
            <View style={styles.bowlShine} />
            <AppText variant="eyebrow" style={styles.productLabel}>
              {visual.productLabel}
            </AppText>
          </View>
        </View>
      ) : visual.motif === 'mic' ? (
        <View style={styles.micContainer}>
          <View style={styles.micGrille}>
            <View style={styles.micGrilleLines} />
          </View>
          <View style={styles.micHandle}>
            <View style={styles.micShine} />
            <AppText variant="eyebrow" style={styles.productLabel}>
              {visual.productLabel}
            </AppText>
          </View>
        </View>
      ) : (
        <View style={styles.toteContainer}>
          <View style={styles.toteStraps} />
          <View style={styles.toteBody}>
            <LinearGradient
              colors={['rgba(255,255,255,0.92)', 'rgba(245,238,228,0.78)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.totePocket} />
            <AppText variant="eyebrow" style={styles.productLabel}>
              {visual.productLabel}
            </AppText>
          </View>
        </View>
      )}

      {/* Ground soft shadow */}
      <View style={styles.sculptureShadow} />
    </View>
  );
}

export function BountyCard({
  bounty,
  visual,
  active = true,
  cardHeight: customCardHeight,
  onAccept,
  onSkip,
  onOpenDetails,
}: BountyCardProps) {
  const [position] = useState(() => new Animated.ValueXY());
  const { height } = useWindowDimensions();
  const cardHeight = customCardHeight ?? Math.max(420, Math.min(560, height - 315));

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

  const isInfluencer = bounty.type === 'INFLUENCER';

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

        {/* Top Badges Row */}
        <View style={styles.topRow}>
          <View style={[styles.badge, styles.typeBadge, isInfluencer && styles.influencerBadge]}>
            <Ionicons
              name={isInfluencer ? 'sparkles' : 'videocam-outline'}
              size={13}
              color={colors.white}
              style={{ marginRight: 4 }}
            />
            <AppText variant="eyebrow" tone="inverse">
              {bounty.type}
            </AppText>
          </View>

          <View style={styles.badge}>
            <AppText variant="caption" tone="inverse" style={styles.nicheLabel}>
              {bounty.niches[0]?.label}
            </AppText>
          </View>

          {isInfluencer && bounty.creatorClapScore ? (
            <View style={[styles.badge, styles.multiplierBadge]}>
              <Ionicons name="flash" size={10} color="#FFD166" style={{ marginRight: 2 }} />
              <AppText variant="eyebrow" style={{ color: '#FFD166', fontSize: 9.5 }}>
                {bounty.creatorClapScore}x Boost
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Swipe Decision Stamps */}
        <Animated.View style={[styles.decisionBadge, styles.acceptDecision, { opacity: acceptOpacity }]}>
          <Ionicons name="heart" size={18} color={colors.eucalyptus} />
          <AppText variant="eyebrow" style={{ color: colors.eucalyptus }}>ACCEPT</AppText>
        </Animated.View>
        <Animated.View style={[styles.decisionBadge, styles.skipDecision, { opacity: skipOpacity }]}>
          <Ionicons name="close" size={19} color={colors.crimson} />
          <AppText variant="eyebrow" style={{ color: colors.crimson }}>SKIP</AppText>
        </Animated.View>

        {/* 3D Product Sculpture */}
        <ProductSculpture visual={visual} />

        {/* Glassmorphic Bottom Scrim */}
        <LinearGradient
          colors={['rgba(15,14,12,0)', 'rgba(15,14,12,0.7)', colors.mediaScrimBottom]}
          locations={[0, 0.45, 1]}
          style={styles.bottomScrim}>
          <View style={styles.brandRow}>
            <View style={styles.brandPill}>
              <AppText variant="eyebrow" tone="inverse" style={styles.brandName}>
                {bounty.brandName}
              </AppText>
              <Ionicons name="checkmark-circle" size={14} color="#6EE7B7" />
            </View>
            <View style={styles.infoPill}>
              <AppText variant="caption" tone="inverse" style={{ fontSize: 11, opacity: 0.85 }}>Tap for brief</AppText>
              <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.7)" />
            </View>
          </View>

          <AppText variant="title" tone="inverse" numberOfLines={1} style={styles.productTitle}>
            {bounty.productName}
          </AppText>
          <AppText variant="body" tone="inverse" numberOfLines={2} style={styles.brief}>
            {bounty.brief}
          </AppText>

          <View style={styles.payoutRow}>
            <View>
              <AppText variant="eyebrow" tone="inverse" style={styles.payoutCaption}>
                YOUR PAYOUT
              </AppText>
              <AppText variant="numberHero" tone="inverse" style={styles.payoutAmount}>
                {formatCurrency(bounty.creatorPayoutCents)}
              </AppText>
            </View>
            <View style={styles.deadlineContainer}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.9)" />
              <AppText variant="caption" tone="inverse" style={styles.deadlineText}>
                {bounty.displayDeadline}
              </AppText>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    ...shadows.card,
  },
  cardPressable: { flex: 1 },
  topRow: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    right: spacing[3],
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    minHeight: 26,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,16,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  typeBadge: { backgroundColor: 'rgba(20,18,16,0.68)' },
  influencerBadge: {
    backgroundColor: 'rgba(107,33,168,0.72)',
    borderColor: 'rgba(216,180,254,0.55)',
  },
  multiplierBadge: {
    backgroundColor: 'rgba(30,24,18,0.82)',
    borderColor: 'rgba(255,209,102,0.5)',
    marginLeft: 'auto',
    paddingHorizontal: 7,
  },
  nicheLabel: { fontSize: 11, letterSpacing: 0.3 },
  decisionBadge: {
    position: 'absolute',
    top: 75,
    zIndex: 5,
    paddingHorizontal: spacing[4],
    height: 42,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 1.5,
    ...shadows.floating,
  },
  acceptDecision: {
    left: spacing[4],
    borderColor: colors.eucalyptus,
    transform: [{ rotate: '-7deg' }],
  },
  skipDecision: {
    right: spacing[4],
    borderColor: colors.crimson,
    transform: [{ rotate: '7deg' }],
  },

  // Sculpture Architecture
  sculptureArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 65 },
  sculptureHalo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.22,
  },
  sculptureHaloInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.28,
  },
  sculptureShadow: {
    position: 'absolute',
    bottom: 85,
    width: 150,
    height: 22,
    borderRadius: 75,
    backgroundColor: 'rgba(15,12,10,0.25)',
    transform: [{ rotate: '4deg' }],
  },
  productLabel: {
    color: colors.ink,
    letterSpacing: 2,
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },

  // Orb (Hydra Droplet)
  orbContainer: { alignItems: 'center', justifyContent: 'center' },
  orbBody: {
    width: 124,
    height: 176,
    borderRadius: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[5],
    transform: [{ rotate: '6deg' }],
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...shadows.floating,
  },
  dropletShine: {
    position: 'absolute',
    top: 14,
    left: 16,
    width: 16,
    height: 98,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  orbCap: {
    position: 'absolute',
    top: 10,
    right: 18,
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  orbAuraRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },

  // Shoe (Athletic Runner)
  shoeContainer: { alignItems: 'center', justifyContent: 'center' },
  shoeSole: {
    width: 154,
    height: 150,
    borderRadius: 44,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[4],
    transform: [{ rotate: '-4deg' }],
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    ...shadows.floating,
  },
  shoeAirPocket: {
    position: 'absolute',
    bottom: 26,
    left: 18,
    width: 44,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(83,107,93,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  shoeStripe: {
    position: 'absolute',
    top: 20,
    right: 22,
    width: 65,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.65)',
    transform: [{ rotate: '-25deg' }],
  },

  // Bowl (Crunch / Culinary)
  bowlContainer: { alignItems: 'center', justifyContent: 'center' },
  bowlBody: {
    width: 148,
    height: 140,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[4],
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    ...shadows.floating,
  },
  bowlRim: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    height: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  bowlShine: {
    position: 'absolute',
    left: 20,
    bottom: 26,
    width: 28,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },

  // Mic (Studio Mini)
  micContainer: { alignItems: 'center', justifyContent: 'center' },
  micGrille: {
    width: 68,
    height: 70,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micGrilleLines: {
    width: 44,
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(92,115,122,0.4)',
    borderRadius: 8,
  },
  micHandle: {
    width: 82,
    height: 98,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.84)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[4],
    marginTop: -8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    ...shadows.floating,
  },
  micShine: {
    position: 'absolute',
    top: 14,
    left: 12,
    width: 10,
    height: 52,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  // Tote (Carry Bag)
  toteContainer: { alignItems: 'center', justifyContent: 'center' },
  toteStraps: {
    width: 60,
    height: 38,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.7)',
    marginBottom: -6,
  },
  toteBody: {
    width: 140,
    height: 140,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[4],
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...shadows.floating,
  },
  totePocket: {
    position: 'absolute',
    top: 18,
    width: 80,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,112,85,0.25)',
  },

  // Bottom Scrim & Typography
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing[4],
    paddingTop: 85,
    paddingBottom: spacing[4],
    gap: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,18,16,0.4)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  brandName: { opacity: 0.95, fontSize: 11 },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  productTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.4,
  },
  brief: {
    opacity: 0.9,
    maxWidth: '96%',
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.92)',
  },
  payoutRow: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  payoutCaption: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 1,
  },
  payoutAmount: {
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
    color: colors.white,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginBottom: 3,
  },
  deadlineText: {
    fontSize: 11,
    letterSpacing: 0.2,
    fontWeight: '600',
  },
});
