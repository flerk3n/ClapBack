import { colors, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { StatusPill } from '@/components/status-pill';
import { useMockApp } from '@/state/mock-app-provider';

export default function ActiveScreen() {
  const { acceptances, getBounty } = useMockApp();

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="hero">Active</AppText>
        <AppText variant="bodyLarge" tone="soft">Your accepted Bounties and Submissions, in one place.</AppText>
      </View>

      {acceptances.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="albums-outline" size={30} color={colors.inkSoft} /></View>
          <AppText variant="heading">Nothing active yet.</AppText>
          <AppText variant="body" tone="soft" style={styles.center}>Accept a Bounty in Discover and it will wait for you here.</AppText>
          <AppButton label="Browse Bounties" onPress={() => router.push('/(tabs)/discover')} style={styles.emptyAction} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {acceptances.map((acceptance) => {
            const bounty = getBounty(acceptance.bountyId);
            if (!bounty) return null;
            const submission = acceptance.latestSubmission;
            return (
              <Pressable
                key={acceptance.id}
                onPress={() => submission
                  ? router.push({ pathname: '/submission/[id]', params: { id: submission.id } })
                  : router.push({ pathname: '/acceptance/[id]', params: { id: acceptance.id } })}
                style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}>
                <View style={styles.productThumb}>
                  <AppText variant="eyebrow" tone="inverse">{bounty.brandName.slice(0, 2).toUpperCase()}</AppText>
                </View>
                <View style={styles.taskCopy}>
                  <AppText variant="caption" tone="muted">{bounty.brandName} · {bounty.type}</AppText>
                  <AppText variant="subheading" numberOfLines={1}>{bounty.productName}</AppText>
                  {submission ? <StatusPill status={submission.status} /> : (
                    <View style={styles.readyPill}><Ionicons name="videocam-outline" size={15} color={colors.coral} /><AppText variant="caption" tone="coral">Ready to upload</AppText></View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing[6] },
  header: { gap: spacing[2], paddingBottom: spacing[6] },
  list: { gap: spacing[3], paddingBottom: spacing[8] },
  taskCard: { minHeight: 112, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  productThumb: { width: 70, height: 84, borderRadius: radii.md, backgroundColor: colors.inkSoft, alignItems: 'center', justifyContent: 'center' },
  taskCopy: { flex: 1, gap: spacing[1] },
  readyPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingTop: spacing[1] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], paddingBottom: 80 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center', maxWidth: 290 },
  emptyAction: { alignSelf: 'stretch', marginTop: spacing[3] },
});
