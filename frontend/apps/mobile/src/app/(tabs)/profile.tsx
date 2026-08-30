import { colors, formatClapScore, formatFollowers, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { MetricBlock } from '@/components/metric-block';
import { Screen } from '@/components/screen';
import { useMockApp } from '@/state/mock-app-provider';

export default function CreatorProfileScreen() {
  const { creator, logout } = useMockApp();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <Screen edges={['top']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <AppText variant="hero">Profile</AppText>
          <View style={styles.demoBadge}><AppText variant="eyebrow" tone="coral">DEMO</AppText></View>
        </View>
        <View style={styles.identityCard}>
          <Avatar name={creator.displayName} size={78} />
          <View style={styles.identityCopy}>
            <AppText variant="heading">{creator.displayName}</AppText>
            <View style={styles.handleRow}>
              <Ionicons name="logo-instagram" size={15} color={colors.inkMuted} />
              <AppText variant="body" tone="muted">@{creator.instagramUsername}</AppText>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={22} color={colors.eucalyptus} />
        </View>
        <View style={styles.metricsCard}>
          <MetricBlock value={formatFollowers(creator.followersCount)} label="Followers" />
          <View style={styles.divider} />
          <MetricBlock value={formatClapScore(creator.clapScore)} label="ClapScore" accent />
          <View style={styles.divider} />
          <MetricBlock value={String(creator.trustScore)} label="Trust Score" />
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}><AppText variant="subheading">Your niches</AppText><AppText variant="caption" tone="coral">Edit</AppText></View>
          <View style={styles.niches}>
            {creator.allNiches ? (
              <View style={styles.niche}><AppText variant="label">All niches</AppText></View>
            ) : creator.niches.map((niche) => (
              <View key={niche.id} style={styles.niche}><AppText variant="label">{niche.label}</AppText></View>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <AppText variant="subheading">Account</AppText>
          <View style={styles.settingRow}><Ionicons name="shield-checkmark-outline" size={21} color={colors.ink} /><AppText variant="bodyStrong" style={styles.settingLabel}>Creator verification</AppText><AppText variant="caption" tone="positive">Eligible</AppText></View>
          <View style={styles.settingRow}><Ionicons name="notifications-outline" size={21} color={colors.ink} /><AppText variant="bodyStrong" style={styles.settingLabel}>Notifications</AppText><Ionicons name="chevron-forward" size={18} color={colors.inkMuted} /></View>
        </View>
        <AppButton label="Sign out" variant="secondary" onPress={handleLogout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing[2] },
  content: { gap: spacing[4], paddingBottom: spacing[10] },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  demoBadge: { backgroundColor: colors.coralWash, borderRadius: radii.pill, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  identityCard: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  identityCopy: { flex: 1 },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: 2 },
  metricsCard: { borderRadius: radii.lg, backgroundColor: colors.ink, padding: spacing[5], flexDirection: 'row' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginHorizontal: spacing[3] },
  section: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[3] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  niches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  niche: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], backgroundColor: colors.canvas, borderRadius: radii.pill },
  settingRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing[3] },
  settingLabel: { flex: 1 },
});
