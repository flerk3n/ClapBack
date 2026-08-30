import type { Bounty } from '@clapback/contracts';
import { bountyVisuals, niches } from '@clapback/demo-data';
import { colors, radii, shadows, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { BountyCard } from '@/components/bounty-card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { useMockApp } from '@/state/mock-app-provider';

export default function DiscoverScreen() {
  const { creator, bounties, acceptBounty, allNiches, selectedNicheIds, setCreatorNiches } = useMockApp();
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [details, setDetails] = useState<Bounty | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const { height } = useWindowDimensions();
  const cardHeight = Math.max(360, Math.min(500, height - 340));

  const available = useMemo(
    () => bounties.filter((bounty) => !skippedIds.includes(bounty.id)),
    [bounties, skippedIds],
  );
  const topBounty = available[0];
  const nextBounty = available[1];

  const handleAccept = (bounty: Bounty) => {
    const acceptance = acceptBounty(bounty.id);
    setDetails(null);
    router.push({ pathname: '/acceptance/[id]', params: { id: acceptance.id } });
  };

  const handleSkip = (bountyId: string) => setSkippedIds((current) => [...current, bountyId]);

  const handleToggleNiche = (nicheId: number) => {
    if (allNiches) {
      setCreatorNiches(false, [nicheId]);
    } else {
      const next = selectedNicheIds.includes(nicheId)
        ? selectedNicheIds.filter((id) => id !== nicheId)
        : [...selectedNicheIds, nicheId];
      if (next.length === 0) {
        setCreatorNiches(true, []);
      } else {
        setCreatorNiches(false, next);
      }
    }
  };

  return (
    <Screen edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTitleArea}>
          <AppText variant="caption" tone="muted">GOOD AFTERNOON</AppText>
          <AppText variant="heading">Find your next take.</AppText>
        </View>
        <Avatar name={creator.displayName} size={44} />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.liveDot} />
        <AppText variant="caption" tone="soft">
          {available.length} Bounties matched to your niches
        </AppText>
        <Pressable
          style={styles.filterButton}
          accessibilityRole="button"
          accessibilityLabel="Bounty filters"
          hitSlop={8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFilterOpen(true);
          }}>
          <Ionicons name="options-outline" size={19} color={colors.ink} />
        </Pressable>
      </View>

      <View style={[styles.stackArea, { height: cardHeight }]}>
        {nextBounty ? (
          <BountyCard
            key={nextBounty.id}
            bounty={nextBounty}
            visual={bountyVisuals[nextBounty.id]!}
            active={false}
            cardHeight={cardHeight}
            onAccept={() => undefined}
            onSkip={() => undefined}
            onOpenDetails={() => undefined}
          />
        ) : null}
        {topBounty ? (
          <BountyCard
            key={topBounty.id}
            bounty={topBounty}
            visual={bountyVisuals[topBounty.id]!}
            cardHeight={cardHeight}
            onAccept={() => handleAccept(topBounty)}
            onSkip={() => handleSkip(topBounty.id)}
            onOpenDetails={() => setDetails(topBounty)}
          />
        ) : (
          <View style={[styles.emptyCard, { minHeight: cardHeight }]}>
            <View style={styles.emptyIcon}><Ionicons name="checkmark" size={28} color={colors.eucalyptus} /></View>
            <AppText variant="heading">You’re all caught up.</AppText>
            <AppText variant="body" tone="soft" style={styles.center}>
              Reset the demo stack or adjust your niche filters to revisit Bounties.
            </AppText>
            <AppButton
              label="Reset skipped Bounties"
              variant="secondary"
              onPress={() => setSkippedIds([])}
              style={styles.resetButton}
            />
          </View>
        )}
      </View>

      {topBounty ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip Bounty"
            onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSkip(topBounty.id); }}
            style={({ pressed }) => [styles.actionButton, styles.skipButton, pressed && styles.actionPressed]}>
            <Ionicons name="close" size={28} color={colors.ink} />
          </Pressable>
          <View style={styles.swipeHint}>
            <AppText variant="caption" tone="muted">SWIPE OR TAP</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Accept Bounty"
            onPress={() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); handleAccept(topBounty); }}
            style={({ pressed }) => [styles.actionButton, styles.acceptButton, pressed && styles.actionPressed]}>
            <Ionicons name="heart" size={27} color={colors.white} />
          </Pressable>
        </View>
      ) : null}

      {/* Filter Bottom Sheet Modal */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setFilterOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            <View style={styles.sheetTitleRow}>
              <View style={styles.sheetTitleCopy}>
                <AppText variant="eyebrow" tone="coral">DISCOVER PREFERENCES</AppText>
                <AppText variant="title">Filter by Niche</AppText>
              </View>
              <Pressable onPress={() => setFilterOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={21} color={colors.ink} />
              </Pressable>
            </View>

            {/* All niches toggle card */}
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setCreatorNiches(true, []);
              }}
              style={[styles.allNichesRow, allNiches && styles.allNichesRowActive]}>
              <View style={[styles.allNichesIcon, allNiches && styles.allNichesIconActive]}>
                <Ionicons name="apps" size={19} color={allNiches ? colors.white : colors.ink} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <AppText variant="bodyStrong" tone={allNiches ? 'inverse' : 'default'}>
                  Show all niches
                </AppText>
                <AppText variant="caption" tone={allNiches ? 'inverse' : 'muted'}>
                  Discover all open brand Bounties
                </AppText>
              </View>
              <Ionicons
                name={allNiches ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={allNiches ? colors.white : colors.borderStrong}
              />
            </Pressable>

            <AppText variant="eyebrow" tone="muted" style={{ marginTop: spacing[2] }}>
              OR SELECT SPECIFIC NICHES
            </AppText>
            <View style={styles.chipsContainer}>
              {niches.map((niche) => {
                const isSelected = !allNiches && selectedNicheIds.includes(niche.id);
                return (
                  <Chip
                    key={niche.id}
                    label={niche.label}
                    selected={isSelected}
                    onPress={() => handleToggleNiche(niche.id)}
                  />
                );
              })}
            </View>

            {skippedIds.length > 0 ? (
              <AppButton
                label={`Revisit ${skippedIds.length} Skipped Bounties`}
                variant="secondary"
                icon="refresh"
                onPress={() => {
                  setSkippedIds([]);
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              />
            ) : null}

            <AppButton
              label={`Show ${available.length} Matching Bounties`}
              onPress={() => setFilterOpen(false)}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Details Bottom Sheet Modal */}
      <Modal visible={Boolean(details)} transparent animationType="slide" onRequestClose={() => setDetails(null)}>
        <Pressable style={styles.modalScrim} onPress={() => setDetails(null)} />
        {details ? (
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <View style={styles.sheetTitleRow}>
                <View style={styles.sheetTitleCopy}>
                  <AppText variant="eyebrow" tone="coral">{details.brandName} · {details.type}</AppText>
                  <AppText variant="title">{details.productName}</AppText>
                </View>
                <Pressable onPress={() => setDetails(null)} style={styles.closeButton}><Ionicons name="close" size={21} color={colors.ink} /></Pressable>
              </View>
              <AppText variant="bodyLarge" tone="soft">{details.brief}</AppText>
              <View style={styles.deliverables}>
                <AppText variant="eyebrow" tone="muted">DELIVERABLES</AppText>
                {details.deliverables.map((deliverable, index) => (
                  <View key={deliverable.id} style={styles.deliverableRow}>
                    <View style={styles.deliverableNumber}><AppText variant="caption">{index + 1}</AppText></View>
                    <AppText variant="bodyStrong" style={styles.deliverableText}>{deliverable.label}</AppText>
                  </View>
                ))}
              </View>
              <AppButton label="Accept Bounty" icon="heart" onPress={() => handleAccept(details)} />
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing[3], paddingBottom: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing[2] },
  headerTitleArea: { gap: 2 },
  filterRow: { height: 32, flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.eucalyptus },
  filterButton: { marginLeft: 'auto', width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stackArea: { width: '100%', position: 'relative' },
  actions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[5],
    paddingBottom: spacing[2],
  },
  actionButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...shadows.floating },
  skipButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  acceptButton: { backgroundColor: colors.coral },
  actionPressed: { transform: [{ scale: 0.94 }] },
  swipeHint: { width: 72, alignItems: 'center' },
  emptyCard: { borderRadius: radii.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: spacing[6], gap: spacing[2] },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.eucalyptusWash, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  resetButton: { alignSelf: 'stretch', marginTop: spacing[2] },
  modalScrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '82%', borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, backgroundColor: colors.canvas, overflow: 'hidden' },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginTop: spacing[3] },
  sheetContent: { padding: spacing[5], paddingBottom: spacing[8], gap: spacing[4] },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  sheetTitleCopy: { flex: 1, gap: spacing[1] },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  allNichesRow: { minHeight: 74, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  allNichesRowActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  allNichesIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  allNichesIconActive: { backgroundColor: 'rgba(255,255,255,0.14)' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  deliverables: { gap: spacing[3], marginVertical: spacing[2] },
  deliverableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  deliverableNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  deliverableText: { flex: 1 },
});
