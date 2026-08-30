import {
  creatorSubmissionLabels,
  SubmissionStatus,
  type ReviewRoundResult,
  type SubmissionStatusValue,
} from '@clapback/contracts';
import { colors, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { StatusPill } from '@/components/status-pill';
import { TopBar } from '@/components/top-bar';
import { closeReviewRound, getReviewRound, startReviewRound } from '@/lib/api';
import { useMockApp } from '@/state/mock-app-provider';

const progressSteps: { status: SubmissionStatusValue; title: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: SubmissionStatus.QUEUED, title: 'Upload received', description: 'Your real video reached Clapback.', icon: 'cloud-done-outline' },
  { status: SubmissionStatus.TRANSCRIBING, title: 'Transcribed', description: 'ElevenLabs is turning the video into text.', icon: 'mic-outline' },
  { status: SubmissionStatus.EVALUATING, title: 'AI tested', description: 'The transcript is checked against the brand ask.', icon: 'sparkles-outline' },
  { status: SubmissionStatus.AI_PASSED, title: 'Human review ready', description: 'The QR can now open the reviewer page.', icon: 'people-outline' },
];

function getStepIndex(status: SubmissionStatusValue) {
  const direct = progressSteps.findIndex(step => step.status === status);
  if (direct >= 0) return direct;
  if (status === SubmissionStatus.CREATED || status === SubmissionStatus.UPLOADING || status === SubmissionStatus.UPLOADED) return 0;
  if (status === SubmissionStatus.IN_REVIEW || status === SubmissionStatus.SCORED) return 3;
  return 2;
}

const processingStatuses: SubmissionStatusValue[] = [SubmissionStatus.QUEUED, SubmissionStatus.TRANSCRIBING, SubmissionStatus.EVALUATING];

export default function SubmissionStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSubmission, getBounty, getAcceptance, refreshSubmission } = useMockApp();
  const submission = getSubmission(id);
  const bounty = submission ? getBounty(submission.bountyId) : undefined;
  const [review, setReview] = useState<ReviewRoundResult | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    try { await refreshSubmission(id); } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Could not refresh processing status.');
    }
  }, [id, refreshSubmission]);

  useEffect(() => {
    if (!submission || !processingStatuses.includes(submission.status)) return;
    const timer = setInterval(() => void refresh(), 1500);
    return () => clearInterval(timer);
  }, [refresh, submission]);

  useEffect(() => {
    if (!submission || (submission.status !== SubmissionStatus.IN_REVIEW && submission.status !== SubmissionStatus.SCORED)) return;
    getReviewRound(submission.id).then(setReview).catch(() => undefined);
  }, [submission]);

  if (!submission || !bounty) {
    return <Screen><TopBar onBack={() => router.back()} /><View style={styles.missing}><AppText variant="heading">Submission not found.</AppText><AppButton label="Go to Active" onPress={() => router.replace('/(tabs)/active')} /></View></Screen>;
  }

  const currentStep = getStepIndex(submission.status);
  const isPassed = submission.status === SubmissionStatus.AI_PASSED
    || submission.status === SubmissionStatus.IN_REVIEW
    || submission.status === SubmissionStatus.SCORED;
  const isFailed = submission.status === SubmissionStatus.AI_FAILED
    || submission.status === SubmissionStatus.PROCESSING_ERROR;
  const acceptance = getAcceptance(submission.acceptanceId);
  const showChecks = isPassed || submission.status === SubmissionStatus.AI_FAILED;

  const beginReview = async () => {
    setReviewBusy(true);
    setError(null);
    try {
      setReview(await startReviewRound(submission.id));
      await refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not start human review.');
    } finally { setReviewBusy(false); }
  };

  const stopReview = async () => {
    setReviewBusy(true);
    setError(null);
    try {
      setReview(await closeReviewRound(submission.id));
      await refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not stop human review.');
    } finally { setReviewBusy(false); }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}><TopBar title="Submission status" onBack={() => router.back()} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroIcon, isPassed && styles.heroPassed, isFailed && styles.heroFailed]}>
          <Ionicons name={isPassed ? 'checkmark' : isFailed ? 'refresh' : 'sparkles'} size={34} color={isPassed ? colors.eucalyptus : isFailed ? colors.crimson : colors.amber} />
        </View>
        <View style={styles.titleBlock}>
          <StatusPill status={submission.status} />
          <AppText variant="hero">{isPassed ? 'AI checks complete.' : isFailed ? 'One more pass.' : 'Your video is in motion.'}</AppText>
          <AppText variant="bodyLarge" tone="soft">{isPassed ? `${bounty.brandName} can now be reviewed through the QR page.` : isFailed ? submission.failureMessage ?? 'A required Deliverable was not detected.' : 'Keep this screen open to watch the real Backend pipeline complete.'}</AppText>
        </View>

        <View style={styles.stepsCard}>
          {progressSteps.map((step, index) => {
            const complete = index < currentStep || isPassed;
            const active = index === currentStep && !isPassed && !isFailed;
            return <View key={step.status} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={[styles.stepIcon, complete && styles.stepComplete, active && styles.stepActive]}><Ionicons name={complete ? 'checkmark' : step.icon} size={18} color={complete ? colors.white : active ? colors.amber : colors.inkMuted} /></View>
                {index < progressSteps.length - 1 ? <View style={[styles.line, index < currentStep && styles.lineComplete]} /> : null}
              </View>
              <View style={styles.stepCopy}><AppText variant="bodyStrong" tone={complete || active ? 'default' : 'muted'}>{step.title}</AppText><AppText variant="body" tone="muted">{step.description}</AppText></View>
            </View>;
          })}
        </View>

        <View style={styles.fileCard}><View style={styles.fileIcon}><Ionicons name="videocam-outline" size={21} color={colors.ink} /></View><View style={styles.fileCopy}><AppText variant="bodyStrong" numberOfLines={1}>{submission.originalFilename}</AppText><AppText variant="caption" tone="muted">{submission.sizeBytes > 0 ? `${(submission.sizeBytes / 1024 / 1024).toFixed(1)} MB · ` : ''}{creatorSubmissionLabels[submission.status]}</AppText></View></View>

        {isPassed ? <View style={styles.passedCard}><Ionicons name="shield-checkmark" size={22} color={colors.eucalyptus} /><View style={styles.passedCopy}><AppText variant="bodyStrong">AI gate passed</AppText><AppText variant="body" tone="soft">{submission.aiSummary}</AppText>{submission.aiConfidence !== null ? <AppText variant="caption" tone="muted">{Math.round(submission.aiConfidence * 100)}% overall confidence</AppText> : null}</View></View> : null}

        {showChecks ? <View style={styles.checksCard}>
          <View style={styles.checksHeader}><AppText variant="subheading">Deliverable check</AppText><AppText variant="caption" tone="muted">{submission.deliverableChecks.filter(check => check.passed).length}/{submission.deliverableChecks.length} matched</AppText></View>
          {submission.deliverableChecks.map(check => <View key={check.deliverableId} style={styles.checkRow}><View style={[styles.checkIcon, !check.passed && styles.checkIconFailed]}><Ionicons name={check.passed ? 'checkmark' : 'close'} size={16} color={check.passed ? colors.eucalyptus : colors.crimson} /></View><View style={styles.checkCopy}><View style={styles.checkTitleRow}><AppText variant="bodyStrong" style={styles.checkLabel}>{check.label}</AppText><AppText variant="caption" tone="muted">{Math.round(check.confidence * 100)}%</AppText></View><AppText variant="body" tone="soft">{check.evidence}</AppText></View></View>)}
        </View> : null}

        {submission.status === SubmissionStatus.AI_PASSED && !review ? <View style={styles.reviewCard}><AppText variant="subheading">Ready for people</AppText><AppText variant="body" tone="soft">Start human review to create the public Bounty page and QR code.</AppText><AppButton label="Start human review" icon="qr-code-outline" loading={reviewBusy} onPress={beginReview} /></View> : null}

        {review?.reviewRound.status === 'OPEN' ? <View style={styles.reviewCard}>
          <AppText variant="eyebrow" tone="coral">HUMAN REVIEW IS LIVE</AppText>
          <AppText variant="heading">Scan to rate this Bounty</AppText>
          <Image source={{ uri: review.qrCodeDataUrl }} style={styles.qr} resizeMode="contain" />
          <AppText selectable variant="caption" tone="muted" style={styles.reviewUrl}>{review.reviewUrl}</AppText>
          <AppButton label="Open reviewer page" variant="secondary" icon="open-outline" onPress={() => void Linking.openURL(review.reviewUrl)} />
          <AppButton label="Stop reviewing" icon="stop-circle-outline" loading={reviewBusy} onPress={stopReview} />
        </View> : null}

        {review?.reviewRound.status === 'CLOSED' ? <View style={styles.scoreboardCard}>
          <AppText variant="eyebrow" tone="coral">FINAL SCOREBOARD</AppText>
          <AppText variant="heading">{bounty.brandName} results</AppText>
          {review.scoreboard.map(entry => <View key={entry.submissionId} style={styles.scoreRow}><View style={styles.rank}><AppText variant="bodyStrong" tone="inverse">#{entry.rank}</AppText></View><View style={styles.scoreCopy}><AppText variant="bodyStrong">{entry.creatorDisplayName}</AppText><AppText variant="caption" tone="muted" numberOfLines={1}>{entry.originalFilename}</AppText></View><View style={styles.scoreMetric}><AppText variant="subheading">{entry.averageScore.toFixed(1)} ★</AppText><AppText variant="caption" tone="muted">{entry.ratingCount} ratings</AppText></View></View>)}
        </View> : null}

        {error ? <View style={styles.errorCard}><Ionicons name="alert-circle-outline" size={19} color={colors.crimson} /><AppText variant="body" style={styles.errorText}>{error}</AppText></View> : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        {isFailed && acceptance ? <AppButton label="Try another video" icon="refresh" onPress={() => router.replace({ pathname: '/upload/[acceptanceId]', params: { acceptanceId: acceptance.id } })} /> : <AppButton label="View Active" variant="secondary" onPress={() => router.replace('/(tabs)/active')} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingTop: spacing[6], paddingBottom: 130, gap: spacing[5] },
  heroIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.amberWash, alignItems: 'center', justifyContent: 'center' },
  heroPassed: { backgroundColor: colors.eucalyptusWash },
  heroFailed: { backgroundColor: colors.crimsonWash },
  titleBlock: { gap: spacing[3] },
  stepsCard: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4] },
  stepRow: { minHeight: 76, flexDirection: 'row', gap: spacing[3] },
  stepRail: { width: 36, alignItems: 'center' },
  stepIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepComplete: { backgroundColor: colors.eucalyptus, borderColor: colors.eucalyptus },
  stepActive: { backgroundColor: colors.amberWash, borderColor: colors.amber },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 3 },
  lineComplete: { backgroundColor: colors.eucalyptus },
  stepCopy: { flex: 1, gap: 1, paddingTop: 5 },
  fileCard: { borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  fileIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1 },
  passedCard: { borderRadius: radii.md, backgroundColor: colors.eucalyptusWash, padding: spacing[4], flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  passedCopy: { flex: 1, gap: 2 },
  checksCard: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[4] },
  checksHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  checkIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.eucalyptusWash, alignItems: 'center', justifyContent: 'center' },
  checkIconFailed: { backgroundColor: colors.crimsonWash },
  checkCopy: { flex: 1, gap: 2 },
  checkTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  checkLabel: { flex: 1 },
  reviewCard: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[3] },
  qr: { width: 250, height: 250, alignSelf: 'center', borderRadius: radii.md, backgroundColor: colors.white },
  reviewUrl: { textAlign: 'center' },
  scoreboardCard: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[3] },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rank: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  scoreCopy: { flex: 1 },
  scoreMetric: { alignItems: 'flex-end' },
  errorCard: { borderRadius: radii.md, backgroundColor: colors.crimsonWash, padding: spacing[3], flexDirection: 'row', gap: spacing[2] },
  errorText: { flex: 1, color: colors.crimson },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: spacing[3], paddingBottom: spacing[3] },
  missing: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: spacing[4] },
});
