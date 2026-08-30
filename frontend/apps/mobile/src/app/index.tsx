import { colors, radii, shadows, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { BrandMark } from '@/components/brand-mark';
import { Screen } from '@/components/screen';
import { useMockApp } from '@/state/mock-app-provider';

function CardArtwork() {
  return (
    <View style={styles.artwork}>
      <View style={[styles.artCard, styles.backCard]}>
        <LinearGradient colors={['#A7B3A2', '#526A5C']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.artCard, styles.middleCard]}>
        <LinearGradient colors={['#E0B56F', '#9E5E3A']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.artCard, styles.frontCard]}>
        <LinearGradient colors={['#D8B8AC', '#9B594A']} style={StyleSheet.absoluteFill} />
        <View style={styles.artBadge}><AppText variant="eyebrow" tone="inverse">UGC</AppText></View>
        <View style={styles.artProduct}>
          <View style={styles.artShine} />
          <AppText variant="eyebrow">HYDRA</AppText>
        </View>
        <View style={styles.artCaption}>
          <AppText variant="caption" tone="inverse">GlowPop</AppText>
          <AppText variant="subheading" tone="inverse">Hydra Cloud</AppText>
        </View>
      </View>
      <View style={styles.floatHeart}><Ionicons name="heart" size={24} color={colors.coral} /></View>
    </View>
  );
}

export default function WelcomeScreen() {
  const { isHydrated, isAuthenticated, loginDemo } = useMockApp();
  const [loading, setLoading] = useState<'instagram' | 'demo' | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace('/onboarding/profile');
  }, [isAuthenticated, isHydrated]);

  const continueWithDemo = async (source: 'instagram' | 'demo') => {
    setLoading(source);
    await loginDemo();
    router.replace('/onboarding/profile');
  };

  if (!isHydrated) {
    return <View style={styles.loader}><ActivityIndicator color={colors.coral} /></View>;
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}><BrandMark /></View>
      <CardArtwork />
      <View style={styles.copy}>
        <AppText variant="display">Your next paid idea starts here.</AppText>
        <AppText variant="bodyLarge" tone="soft">
          Swipe into brand Bounties, make the content your way, and let the crowd pick what lands.
        </AppText>
      </View>
      <View style={styles.actions}>
        <AppButton
          label="Continue with Instagram"
          icon="logo-instagram"
          loading={loading === 'instagram'}
          onPress={() => continueWithDemo('instagram')}
        />
        <AppButton
          label="Explore as Guest Creator"
          variant="secondary"
          loading={loading === 'demo'}
          onPress={() => continueWithDemo('demo')}
        />
        <AppText variant="caption" tone="muted" style={styles.note}>
          Preview mode · Instagram metrics are simulated until Meta OAuth is connected.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing[1], paddingBottom: spacing[2], justifyContent: 'space-between' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  header: { height: 44, justifyContent: 'center' },
  artwork: { flex: 1, minHeight: 180, maxHeight: 250, alignItems: 'center', justifyContent: 'center', marginVertical: spacing[1] },
  artCard: { position: 'absolute', width: 170, height: 220, borderRadius: 24, overflow: 'hidden', ...shadows.card },
  backCard: { transform: [{ translateX: -50 }, { rotate: '-13deg' }, { scale: 0.9 }] },
  middleCard: { transform: [{ translateX: 46 }, { rotate: '12deg' }, { scale: 0.93 }] },
  frontCard: { padding: spacing[3], alignItems: 'center', justifyContent: 'center' },
  artBadge: { position: 'absolute', top: 14, left: 14, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: 'rgba(20,18,16,0.55)' },
  artProduct: { width: 58, height: 96, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12, transform: [{ rotate: '8deg' }] },
  artShine: { position: 'absolute', left: 8, top: 8, width: 8, height: 50, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.55)' },
  artCaption: { position: 'absolute', left: 16, bottom: 16 },
  floatHeart: { position: 'absolute', right: 24, bottom: 28, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.floating },
  copy: { gap: spacing[2], marginBottom: spacing[3] },
  actions: { gap: spacing[2] },
  note: { textAlign: 'center', paddingHorizontal: spacing[4], fontSize: 11 },
});
