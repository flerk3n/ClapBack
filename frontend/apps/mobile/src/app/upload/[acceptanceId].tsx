import { colors, radii, spacing } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { type SelectedVideo, useMockApp } from '@/state/mock-app-provider';

const MAX_SIZE_BYTES = 100 * 1024 * 1024;

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });
  return <VideoView player={player} style={styles.video} nativeControls contentFit="cover" />;
}

function formatMegabytes(bytes: number) {
  return `${Math.max(0.1, bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return 'Duration unavailable';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export default function UploadScreen() {
  const { acceptanceId } = useLocalSearchParams<{ acceptanceId: string }>();
  const { getAcceptance, getBounty, createSubmission } = useMockApp();
  const acceptance = getAcceptance(acceptanceId);
  const bounty = acceptance ? getBounty(acceptance.bountyId) : undefined;
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const chooseVideo = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow video library access to choose your Submission.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      allowsEditing: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;
    const sizeBytes = asset.fileSize ?? 0;
    if (sizeBytes > MAX_SIZE_BYTES) {
      setError('Choose a video smaller than 100 MB.');
      return;
    }

    setSelectedVideo({
      uri: asset.uri,
      fileName: asset.fileName ?? 'creator-submission.mp4',
      mimeType: asset.mimeType ?? 'video/mp4',
      sizeBytes,
      durationSeconds: typeof asset.duration === 'number' ? asset.duration / 1000 : null,
    });
    Haptics.selectionAsync();
  };

  const submitVideo = () => {
    if (!selectedVideo || !acceptance) return;
    setUploading(true);
    setProgress(8);
    intervalRef.current = setInterval(() => {
      setProgress((current) => Math.min(current + 13, 94));
    }, 160);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      const submission = createSubmission(acceptance.id, selectedVideo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.replace({ pathname: '/submission/[id]', params: { id: submission.id } }), 280);
    }, 1300);
  };

  if (!acceptance || !bounty) {
    return <Screen><TopBar onBack={() => router.back()} /><View style={styles.centerState}><AppText variant="heading">Active Bounty not found.</AppText></View></Screen>;
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}><TopBar title="New Submission" onBack={() => router.back()} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <AppText variant="eyebrow" tone="coral">{bounty.brandName} · {bounty.type}</AppText>
          <AppText variant="hero">Show us your cut.</AppText>
          <AppText variant="bodyLarge" tone="soft">Choose a finished vertical video. You can preview it before anything leaves your device.</AppText>
        </View>

        {selectedVideo ? (
          <View style={styles.previewCard}>
            <VideoPreview uri={selectedVideo.uri} />
            <View style={styles.previewFooter}>
              <View style={styles.fileIcon}><Ionicons name="videocam" size={20} color={colors.ink} /></View>
              <View style={styles.fileCopy}>
                <AppText variant="bodyStrong" numberOfLines={1}>{selectedVideo.fileName}</AppText>
                <AppText variant="caption" tone="muted">{formatMegabytes(selectedVideo.sizeBytes)} · {formatDuration(selectedVideo.durationSeconds)}</AppText>
              </View>
              <Pressable disabled={uploading} onPress={chooseVideo} style={styles.replaceButton}><AppText variant="caption" tone="coral">Replace</AppText></Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={chooseVideo} style={({ pressed }) => [styles.picker, pressed && styles.pickerPressed]}>
            <View style={styles.uploadIcon}><Ionicons name="cloud-upload-outline" size={30} color={colors.coral} /></View>
            <AppText variant="subheading">Choose a video</AppText>
            <AppText variant="body" tone="muted" style={styles.centerText}>MP4 or MOV · Vertical preferred · Up to 100 MB</AppText>
          </Pressable>
        )}

        {error ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={18} color={colors.crimson} /><AppText variant="body" style={styles.errorText}>{error}</AppText></View> : null}

        <View style={styles.checklist}>
          <AppText variant="eyebrow" tone="muted">BEFORE YOU SUBMIT</AppText>
          {bounty.deliverables.map((deliverable) => (
            <View key={deliverable.id} style={styles.checkRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.eucalyptus} />
              <AppText variant="body" style={styles.checkText}>{deliverable.label}</AppText>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {uploading ? (
          <View style={styles.progressArea}>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            <View style={styles.progressCopy}><AppText variant="caption" tone="muted">Uploading securely</AppText><AppText variant="caption">{progress}%</AppText></View>
          </View>
        ) : null}
        <AppButton label={uploading ? 'Uploading video' : 'Submit video'} icon="arrow-up" disabled={!selectedVideo} loading={uploading} onPress={submitVideo} />
        <AppText variant="caption" tone="muted" style={styles.demoNote}>Demo upload uses the canonical Submission states; TUS connects when Backend is ready.</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingTop: spacing[5], paddingBottom: 190, gap: spacing[5] },
  titleBlock: { gap: spacing[2] },
  picker: { minHeight: 280, borderRadius: radii.xl, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: spacing[8], gap: spacing[2] },
  pickerPressed: { transform: [{ scale: 0.99 }], borderColor: colors.coral },
  uploadIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.coralWash, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[2] },
  centerText: { textAlign: 'center' },
  previewCard: { overflow: 'hidden', borderRadius: radii.xl, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.border },
  video: { width: '100%', aspectRatio: 9 / 12, backgroundColor: colors.ink },
  previewFooter: { minHeight: 72, backgroundColor: colors.surface, padding: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  fileIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1 },
  replaceButton: { minWidth: 54, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  error: { borderRadius: radii.md, backgroundColor: colors.crimsonWash, padding: spacing[3], flexDirection: 'row', gap: spacing[2] },
  errorText: { flex: 1, color: colors.crimson },
  checklist: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[3] },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  checkText: { flex: 1 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: spacing[3], paddingBottom: spacing[3] },
  progressArea: { marginBottom: spacing[3] },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.coral },
  progressCopy: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[1] },
  demoNote: { textAlign: 'center', marginTop: spacing[2] },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
