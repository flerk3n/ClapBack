import { niches } from '@clapback/demo-data';
import { colors, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { useMockApp } from '@/state/mock-app-provider';

export default function NicheSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { allNiches: initialAll, selectedNicheIds: initialIds, setCreatorNiches } = useMockApp();
  const [allNiches, setAllNiches] = useState(initialAll);
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const toggleNiche = (id: number) => {
    setError(null);
    setAllNiches(false);
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const chooseAll = () => {
    setError(null);
    setAllNiches(true);
    setSelectedIds([]);
  };

  const continueToBounties = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await setCreatorNiches(allNiches, selectedIds);
      router.replace('/(tabs)/discover');
    } catch (submissionError) {
      setError(submissionError instanceof Error
        ? submissionError.message
        : 'Could not save your niches. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const canContinue = allNiches || selectedIds.length > 0;

  return (
    <Screen padded={false}>
      <View style={styles.header}><TopBar title="Your niches" onBack={() => router.back()} /></View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <AppText variant="hero">What do you make best?</AppText>
          <AppText variant="bodyLarge" tone="soft">
            Pick the spaces you actually create for. We’ll keep Discover relevant.
          </AppText>
        </View>

        <Pressable onPress={chooseAll} style={[styles.allCard, allNiches && styles.allCardSelected]}>
          <View style={[styles.allIcon, allNiches && styles.allIconSelected]}>
            <Ionicons name="apps" size={21} color={allNiches ? colors.white : colors.ink} />
          </View>
          <View style={styles.allCopy}>
            <AppText variant="bodyStrong" tone={allNiches ? 'inverse' : 'default'}>Show me everything</AppText>
            <AppText variant="body" tone={allNiches ? 'inverse' : 'muted'}>All niches, all open Bounties.</AppText>
          </View>
          <Ionicons name={allNiches ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={allNiches ? colors.white : colors.borderStrong} />
        </Pressable>

        <AppText variant="eyebrow" tone="muted" style={styles.label}>OR PICK A FEW</AppText>
        <View style={styles.chips}>
          {niches.map((niche) => (
            <Chip key={niche.id} label={niche.label} selected={selectedIds.includes(niche.id)} onPress={() => toggleNiche(niche.id)} />
          ))}
        </View>
      </ScrollView>
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
        {error ? <AppText variant="caption" style={styles.errorText}>{error}</AppText> : null}
        <AppText variant="caption" tone="muted" style={styles.selectionCount}>
          {allNiches ? 'All niches selected' : `${selectedIds.length} selected`}
        </AppText>
        <AppButton
          label="See Bounties"
          icon="arrow-forward"
          disabled={!canContinue || submitting}
          loading={submitting}
          onPress={continueToBounties}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  copy: { gap: spacing[3], paddingTop: spacing[6], paddingBottom: spacing[8] },
  allCard: { minHeight: 88, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  allCardSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  allIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  allIconSelected: { backgroundColor: 'rgba(255,255,255,0.14)' },
  allCopy: { flex: 1, gap: 1 },
  label: { marginTop: spacing[8], marginBottom: spacing[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: spacing[3], paddingBottom: spacing[4] },
  errorText: { color: colors.crimson, textAlign: 'center', marginBottom: spacing[2] },
  selectionCount: { textAlign: 'center', marginBottom: spacing[2] },
});
