import { colors, formatClapScore, formatFollowers, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { MetricBlock } from '@/components/metric-block';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { useMockApp } from '@/state/mock-app-provider';

export default function ProfileConfirmationScreen() {
  const { creator } = useMockApp();

  return (
    <Screen style={styles.screen}>
      <TopBar title="Creator profile" />
      <View style={styles.intro}>
        <View style={styles.avatarWrap}>
          <Avatar name={creator.displayName} size={92} />
          <View style={styles.instagramBadge}>
            <Ionicons name="logo-instagram" size={16} color={colors.white} />
          </View>
        </View>
        <AppText variant="title">You’re in, {creator.displayName.split(' ')[0]}.</AppText>
        <AppText variant="bodyLarge" tone="soft" style={styles.center}>
          This is how brands will see your creator profile.
        </AppText>
        <View style={styles.handleRow}>
          <AppText variant="bodyStrong">@{creator.instagramUsername}</AppText>
          <Ionicons name="checkmark-circle" size={17} color={colors.eucalyptus} />
          <AppText variant="caption" tone="muted">Creator account</AppText>
        </View>
      </View>

      <View style={styles.metricsCard}>
        <MetricBlock value={formatFollowers(creator.followersCount)} label="Followers" />
        <View style={styles.divider} />
        <MetricBlock value={formatClapScore(creator.clapScore)} label="ClapScore" accent />
        <View style={styles.divider} />
        <MetricBlock value={String(creator.trustScore)} label="Trust Score" />
      </View>

      <View style={styles.eligibleCard}>
        <View style={styles.eligibleIcon}><Ionicons name="sparkles" size={20} color={colors.eucalyptus} /></View>
        <View style={styles.eligibleCopy}>
          <AppText variant="bodyStrong">Influencer Bounties unlocked</AppText>
          <AppText variant="body" tone="soft">
            Your profile is eligible for UGC and Influencer opportunities.
          </AppText>
        </View>
      </View>

      <View style={styles.spacer} />
      <AppButton label="Choose your niches" icon="arrow-forward" onPress={() => router.push('/onboarding/niches')} />
      <AppText variant="caption" tone="muted" style={styles.footerNote}>
        Followers determine eligibility. The Backend remains the source of truth for ClapScore and payout.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: spacing[4] },
  intro: { alignItems: 'center', gap: spacing[2], paddingTop: spacing[6] },
  avatarWrap: { marginBottom: spacing[2] },
  instagramBadge: { position: 'absolute', right: 0, bottom: 3, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.ink, borderWidth: 3, borderColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center', maxWidth: 310 },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[1] },
  metricsCard: { marginTop: spacing[8], backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing[5], flexDirection: 'row' },
  divider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing[3] },
  eligibleCard: { marginTop: spacing[4], borderRadius: radii.lg, backgroundColor: colors.eucalyptusWash, padding: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  eligibleIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(53,107,96,0.10)', alignItems: 'center', justifyContent: 'center' },
  eligibleCopy: { flex: 1, gap: 2 },
  spacer: { flex: 1, minHeight: spacing[6] },
  footerNote: { textAlign: 'center', marginTop: spacing[3], paddingHorizontal: spacing[3] },
});
