import { type SubmissionStatusValue, creatorSubmissionLabels } from '@clapback/contracts';
import { colors, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from './app-text';

const statusAppearance: Record<SubmissionStatusValue, { background: string; foreground: string; icon: keyof typeof Ionicons.glyphMap }> = {
  CREATED: { background: colors.slateWash, foreground: colors.slate, icon: 'document-outline' },
  UPLOADING: { background: colors.amberWash, foreground: colors.amber, icon: 'cloud-upload-outline' },
  UPLOADED: { background: colors.slateWash, foreground: colors.slate, icon: 'cloud-done-outline' },
  QUEUED: { background: colors.amberWash, foreground: colors.amber, icon: 'time-outline' },
  TRANSCRIBING: { background: colors.amberWash, foreground: colors.amber, icon: 'mic-outline' },
  EVALUATING: { background: colors.amberWash, foreground: colors.amber, icon: 'sparkles-outline' },
  AI_PASSED: { background: colors.eucalyptusWash, foreground: colors.eucalyptus, icon: 'checkmark-circle-outline' },
  AI_FAILED: { background: colors.crimsonWash, foreground: colors.crimson, icon: 'refresh-outline' },
  PROCESSING_ERROR: { background: colors.crimsonWash, foreground: colors.crimson, icon: 'alert-circle-outline' },
  IN_REVIEW: { background: colors.slateWash, foreground: colors.slate, icon: 'people-outline' },
  SCORED: { background: colors.eucalyptusWash, foreground: colors.eucalyptus, icon: 'trophy-outline' },
};

export function StatusPill({ status }: { status: SubmissionStatusValue }) {
  const appearance = statusAppearance[status];
  return (
    <View style={[styles.pill, { backgroundColor: appearance.background }]}>
      <Ionicons name={appearance.icon} size={15} color={appearance.foreground} />
      <AppText variant="caption" style={{ color: appearance.foreground }}>
        {creatorSubmissionLabels[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    minHeight: 30,
    paddingHorizontal: spacing[3],
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});
