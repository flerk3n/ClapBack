import {
  creatorSubmissionLabels,
  SubmissionStatus,
  type SubmissionStatusValue,
} from '@clapback/contracts';
import { colors, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { StatusPill } from '@/components/status-pill';
import { TopBar } from '@/components/top-bar';
import { useMockApp } from '@/state/mock-app-provider';

const progressSteps: {
  status: SubmissionStatusValue;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    status: SubmissionStatus.QUEUED,
    title: 'Upload received',
    description: 'Your video is stored and queued.',
    icon: 'cloud-done-outline',
  },
  {
    status: SubmissionStatus.TRANSCRIBING,
    title: 'Checking audio',
    description: 'Listening for spoken Deliverables.',
    icon: 'mic-outline',
  },
  {
    status: SubmissionStatus.EVALUATING,
    title: 'Checking Deliverables',
    description: 'Matching the brief and required phrases.',
    icon: 'sparkles-outline',
  },
  {
    status: SubmissionStatus.AI_PASSED,
    title: 'Ready for reviewers',
    description: 'Your Submission passed the AI gate.',
    icon: 'people-outline',
  },
];

function getStepIndex(status: SubmissionStatusValue) {
  const direct = progressSteps.findIndex((step) => step.status === status);
  if (direct >= 0) return direct;
  if (
    status === SubmissionStatus.CREATED ||
    status === SubmissionStatus.UPLOADING ||
    status === SubmissionStatus.UPLOADED
  )
    return 0;
  if (status === SubmissionStatus.IN_REVIEW || status === SubmissionStatus.SCORED) return 3;
  return 2;
}

export default function SubmissionStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSubmission, getBounty, getAcceptance } = useMockApp();
  const submission = getSubmission(id);
  const bounty = submission ? getBounty(submission.bountyId) : undefined;
  const currentStep = submission ? getStepIndex(submission.status) : 0;
  const isPassed =
    submission?.status === SubmissionStatus.AI_PASSED ||
    submission?.status === SubmissionStatus.IN_REVIEW ||
    submission?.status === SubmissionStatus.SCORED;
  const isFailed = submission?.status === SubmissionStatus.AI_FAILED;

  if (!submission || !bounty) {
    return (
      <Screen>
        <TopBar onBack={() => router.back()} />
        <View style={styles.missing}>
          <AppText variant="heading">Submission not found.</AppText>
          <AppButton label="Go to Active" onPress={() => router.replace('/(tabs)/active')} />
        </View>
      </Screen>
    );
  }

  const acceptance = getAcceptance(submission.acceptanceId);
  const showChecks = isPassed || isFailed;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <TopBar title="Submission status" onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroIcon, isPassed && styles.heroPassed, isFailed && styles.heroFailed]}>
          <Ionicons
            name={isPassed ? 'checkmark' : isFailed ? 'refresh' : 'sparkles'}
            size={34}
            color={isPassed ? colors.eucalyptus : isFailed ? colors.crimson : colors.amber}
          />
        </View>
        <View style={styles.titleBlock}>
          <StatusPill status={submission.status} />
          <AppText variant="hero">
            {isPassed ? 'You made the cut.' : isFailed ? 'One more pass.' : 'Your video is in motion.'}
          </AppText>
          <AppText variant="bodyLarge" tone="soft">
            {isPassed
              ? `${bounty.brandName} is ready for your Submission to enter the Review Round.`
              : isFailed
                ? submission.failureMessage ?? 'A required Deliverable was not detected.'
                : 'You can leave this screen. Active will keep the latest Backend status for you.'}
          </AppText>
        </View>

        <View style={styles.stepsCard}>
          {progressSteps.map((step, index) => {
            const complete = index < currentStep || isPassed;
            const active = index === currentStep && !isPassed;
            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepIcon, complete && styles.stepComplete, active && styles.stepActive]}>
                    <Ionicons
                      name={complete ? 'checkmark' : step.icon}
                      size={18}
                      color={complete ? colors.white : active ? colors.amber : colors.inkMuted}
                    />
                  </View>
                  {index < progressSteps.length - 1 ? (
                    <View style={[styles.line, index < currentStep && styles.lineComplete]} />
                  ) : null}
                </View>
                <View style={styles.stepCopy}>
                  <AppText variant="bodyStrong" tone={complete || active ? 'default' : 'muted'}>
                    {step.title}
                  </AppText>
                  <AppText variant="body" tone="muted">
                    {step.description}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.fileCard}>
          <View style={styles.fileIcon}>
            <Ionicons name="videocam-outline" size={21} color={colors.ink} />
          </View>
          <View style={styles.fileCopy}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {submission.originalFilename}
            </AppText>
            <AppText variant="caption" tone="muted">
              {(submission.sizeBytes / 1024 / 1024).toFixed(1)} MB ·{' '}
              {creatorSubmissionLabels[submission.status]}
            </AppText>
          </View>
        </View>

        {isPassed ? (
          <View style={styles.passedCard}>
            <Ionicons name="shield-checkmark" size={22} color={colors.eucalyptus} />
            <View style={styles.passedCopy}>
              <AppText variant="bodyStrong">AI gate passed</AppText>
              <AppText variant="body" tone="soft">
                {submission.aiSummary}
              </AppText>
              {submission.aiConfidence !== null ? (
                <AppText variant="caption" tone="muted">
                  {Math.round(submission.aiConfidence * 100)}% overall confidence
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}

        {showChecks ? (
          <View style={styles.checksCard}>
            <View style={styles.checksHeader}>
              <AppText variant="subheading">Deliverable Check</AppText>
              <AppText variant="caption" tone="muted">
                {submission.deliverableChecks.filter((check) => check.passed).length}/
                {submission.deliverableChecks.length} matched
              </AppText>
            </View>
            {submission.deliverableChecks.map((check) => (
              <View key={check.deliverableId} style={styles.checkRow}>
                <View style={[styles.checkIcon, !check.passed && styles.checkIconFailed]}>
                  <Ionicons
                    name={check.passed ? 'checkmark' : 'close'}
                    size={16}
                    color={check.passed ? colors.eucalyptus : colors.crimson}
                  />
                </View>
                <View style={styles.checkCopy}>
                  <View style={styles.checkTitleRow}>
                    <AppText variant="bodyStrong" style={styles.checkLabel}>
                      {check.label}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {Math.round(check.confidence * 100)}%
                    </AppText>
                  </View>
                  <AppText variant="body" tone="soft">
                    {check.evidence}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        {isFailed && acceptance ? (
          <AppButton
            label="Try another video"
            icon="refresh"
            onPress={() =>
              router.replace({
                pathname: '/upload/[acceptanceId]',
                params: { acceptanceId: acceptance.id },
              })
            }
          />
        ) : (
          <AppButton
            label="View Active"
            variant={isPassed ? 'primary' : 'secondary'}
            onPress={() => router.replace('/(tabs)/active')}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingTop: spacing[6], paddingBottom: 130, gap: spacing[5] },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.amberWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPassed: { backgroundColor: colors.eucalyptusWash },
  heroFailed: { backgroundColor: colors.crimsonWash },
  titleBlock: { gap: spacing[3] },
  stepsCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
  },
  stepRow: { minHeight: 76, flexDirection: 'row', gap: spacing[3] },
  stepRail: { width: 36, alignItems: 'center' },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepComplete: { backgroundColor: colors.eucalyptus, borderColor: colors.eucalyptus },
  stepActive: { backgroundColor: colors.amberWash, borderColor: colors.amber },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 3 },
  lineComplete: { backgroundColor: colors.eucalyptus },
  stepCopy: { flex: 1, gap: 1, paddingTop: 5 },
  fileCard: {
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCopy: { flex: 1 },
  passedCard: {
    borderRadius: radii.md,
    backgroundColor: colors.eucalyptusWash,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  passedCopy: { flex: 1, gap: 2 },
  checksCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[4],
  },
  checksHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  checkIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.eucalyptusWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconFailed: { backgroundColor: colors.crimsonWash },
  checkCopy: { flex: 1, gap: 2 },
  checkTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  checkLabel: { flex: 1 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  missing: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: spacing[4] },
});
