import { colors, formatCurrency, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { useMockApp } from '@/state/mock-app-provider';

export default function AcceptanceScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAcceptance, getBounty } = useMockApp();
  const acceptance = getAcceptance(id);
  const bounty = acceptance ? getBounty(acceptance.bountyId) : undefined;

  if (!acceptance || !bounty) {
    return <Screen><TopBar onBack={() => router.back()} /><View style={styles.missing}><AppText variant="heading">Acceptance not found.</AppText><AppButton label="Back to Discover" onPress={() => router.replace('/(tabs)/discover')} /></View></Screen>;
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}><TopBar title="Bounty accepted" onBack={() => router.back()} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successIcon}><Ionicons name="heart" size={31} color={colors.white} /></View>
        <View style={styles.titleBlock}>
          <AppText variant="eyebrow" tone="coral">{bounty.brandName} · {bounty.type}</AppText>
          <AppText variant="hero">Now make it yours.</AppText>
          <AppText variant="bodyLarge" tone="soft">You’ve accepted the {bounty.productName} Bounty. Hit every Deliverable, but keep the voice unmistakably yours.</AppText>
        </View>

        <View style={styles.payoutCard}>
          <View><AppText variant="caption" tone="muted">YOUR PAYOUT</AppText><AppText variant="numberHero">{formatCurrency(bounty.creatorPayoutCents)}</AppText></View>
          {bounty.type === 'INFLUENCER' ? <View style={styles.multiplier}><AppText variant="caption" tone="positive">{bounty.creatorClapScore.toFixed(1)}x CLAPSCORE</AppText></View> : <View style={styles.multiplier}><AppText variant="caption" tone="coral">FLAT UGC BUYOUT</AppText></View>}
        </View>

        <View style={styles.deliverablesCard}>
          <AppText variant="subheading">Deliverables</AppText>
          <AppText variant="body" tone="muted">The Backend AI gate checks these before your Submission reaches reviewers.</AppText>
          <View style={styles.deliverableList}>
            {bounty.deliverables.map((deliverable, index) => (
              <View key={deliverable.id} style={styles.deliverableRow}>
                <View style={styles.number}><AppText variant="caption">{index + 1}</AppText></View>
                <AppText variant="bodyStrong" style={styles.deliverableText}>{deliverable.label}</AppText>
                <Ionicons name="checkmark" size={18} color={colors.eucalyptus} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tip}><Ionicons name="bulb-outline" size={21} color={colors.amber} /><AppText variant="body" tone="soft" style={styles.tipCopy}>Record vertically, keep the audio clear, and leave a clean beat at the beginning and end.</AppText></View>
      </ScrollView>
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
        <AppButton label="Upload now" icon="cloud-upload-outline" onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.push({ pathname: '/upload/[acceptanceId]', params: { acceptanceId: acceptance.id } }); }} />
        <AppButton label="View active task" variant="ghost" onPress={() => router.replace('/(tabs)/active')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingTop: spacing[6], paddingBottom: 180, gap: spacing[5] },
  successIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { gap: spacing[2] },
  payoutCard: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[5], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  multiplier: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], backgroundColor: colors.eucalyptusWash, borderRadius: radii.pill },
  deliverablesCard: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[2] },
  deliverableList: { gap: spacing[3], marginTop: spacing[2] },
  deliverableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  number: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  deliverableText: { flex: 1 },
  tip: { flexDirection: 'row', gap: spacing[3], paddingHorizontal: spacing[1] },
  tipCopy: { flex: 1 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: spacing[3], paddingBottom: spacing[3], gap: spacing[1] },
  missing: { flex: 1, justifyContent: 'center', gap: spacing[4] },
});
