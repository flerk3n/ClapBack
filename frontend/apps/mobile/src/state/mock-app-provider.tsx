import type { Acceptance, Bounty, CreatorProfile, SubmissionSummary } from '@clapback/contracts';
import { AcceptanceStatus, SubmissionStatus } from '@clapback/contracts';
import { demoBounties, demoCreator, niches } from '@clapback/demo-data';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const DEMO_TOKEN_KEY = 'clapback.demo.access-token';

export type SelectedVideo = {
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
};

type MockAppContextValue = {
  isHydrated: boolean;
  isAuthenticated: boolean;
  creator: CreatorProfile;
  bounties: Bounty[];
  acceptances: Acceptance[];
  submissions: SubmissionSummary[];
  allNiches: boolean;
  selectedNicheIds: number[];
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  setCreatorNiches: (allNiches: boolean, nicheIds: number[]) => void;
  acceptBounty: (bountyId: string) => Acceptance;
  createSubmission: (acceptanceId: string, video: SelectedVideo) => SubmissionSummary;
  getBounty: (bountyId: string) => Bounty | undefined;
  getAcceptance: (acceptanceId: string) => Acceptance | undefined;
  getSubmission: (submissionId: string) => SubmissionSummary | undefined;
};

const MockAppContext = createContext<MockAppContextValue | null>(null);

function makeUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function withSubmissionStatus(
  submission: SubmissionSummary,
  status: SubmissionSummary['status'],
): SubmissionSummary {
  const passed = status === SubmissionStatus.AI_PASSED;

  return {
    ...submission,
    status,
    aiSummary: passed
      ? 'All required spoken Deliverables were detected.'
      : submission.aiSummary,
    aiConfidence: passed ? 0.96 : submission.aiConfidence,
    deliverableChecks: passed
      ? submission.deliverableChecks.map((check, index) => ({
          ...check,
          passed: true,
          evidence: 'Matched in the transcript and content review.',
          confidence: Math.max(0.9, 0.97 - index * 0.02),
        }))
      : submission.deliverableChecks,
  };
}

export function MockAppProvider({ children }: PropsWithChildren) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [creator, setCreator] = useState<CreatorProfile>(demoCreator);
  const [allNiches, setAllNiches] = useState(false);
  const [selectedNicheIds, setSelectedNicheIds] = useState<number[]>([]);
  const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const scheduledTimers = timers.current;

    SecureStore.getItemAsync(DEMO_TOKEN_KEY)
      .then((token) => setIsAuthenticated(Boolean(token)))
      .finally(() => setIsHydrated(true));

    return () => scheduledTimers.forEach(clearTimeout);
  }, []);

  const loginDemo = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 520));
    await SecureStore.setItemAsync(DEMO_TOKEN_KEY, 'demo-creator-access-token');
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(DEMO_TOKEN_KEY);
    setIsAuthenticated(false);
    setAcceptances([]);
    setSubmissions([]);
  }, []);

  const setCreatorNiches = useCallback((useAllNiches: boolean, nicheIds: number[]) => {
    const selected = useAllNiches ? [] : niches.filter((niche) => nicheIds.includes(niche.id));
    setAllNiches(useAllNiches);
    setSelectedNicheIds(useAllNiches ? [] : nicheIds);
    setCreator((current) => ({ ...current, allNiches: useAllNiches, niches: selected }));
  }, []);

  const acceptBounty = useCallback(
    (bountyId: string) => {
      const existing = acceptances.find((item) => item.bountyId === bountyId);
      if (existing) return existing;

      const acceptance: Acceptance = {
        id: makeUuid(),
        bountyId,
        creatorId: creator.userId,
        status: AcceptanceStatus.ACTIVE,
        acceptedAt: new Date().toISOString(),
        latestSubmission: null,
      };
      setAcceptances((current) => [acceptance, ...current]);
      return acceptance;
    },
    [acceptances, creator.userId],
  );

  const updateSubmissionStatus = useCallback(
    (submissionId: string, status: SubmissionSummary['status']) => {
      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === submissionId ? withSubmissionStatus(submission, status) : submission,
        ),
      );
      setAcceptances((current) =>
        current.map((acceptance) =>
          acceptance.latestSubmission?.id === submissionId
            ? {
                ...acceptance,
                status: AcceptanceStatus.SUBMITTED,
                latestSubmission: withSubmissionStatus(acceptance.latestSubmission, status),
              }
            : acceptance,
        ),
      );
    },
    [],
  );

  const createSubmission = useCallback(
    (acceptanceId: string, video: SelectedVideo) => {
      const acceptance = acceptances.find((item) => item.id === acceptanceId);
      if (!acceptance) throw new Error('Acceptance not found');

      const bounty = demoBounties.find((item) => item.id === acceptance.bountyId);
      const now = new Date().toISOString();
      const submission: SubmissionSummary = {
        id: makeUuid(),
        bountyId: acceptance.bountyId,
        creatorId: creator.userId,
        acceptanceId,
        originalFilename: video.fileName,
        mimeType: video.mimeType,
        sizeBytes: video.sizeBytes,
        durationSeconds: video.durationSeconds,
        status: SubmissionStatus.QUEUED,
        failureCode: null,
        failureMessage: null,
        aiSummary: null,
        aiConfidence: null,
        deliverableChecks:
          bounty?.deliverables.map((deliverable) => ({
            deliverableId: deliverable.id,
            label: deliverable.label,
            passed: false,
            evidence: 'Waiting for analysis',
            confidence: 0,
          })) ?? [],
        createdAt: now,
        submittedAt: now,
      };

      setSubmissions((current) => [submission, ...current]);
      setAcceptances((current) =>
        current.map((item) =>
          item.id === acceptanceId
            ? { ...item, status: AcceptanceStatus.SUBMITTED, latestSubmission: submission }
            : item,
        ),
      );

      const schedule = (delay: number, status: SubmissionSummary['status']) => {
        const timer = setTimeout(() => {
          updateSubmissionStatus(submission.id, status);
          const timerIndex = timers.current.indexOf(timer);
          if (timerIndex >= 0) timers.current.splice(timerIndex, 1);
        }, delay);
        timers.current.push(timer);
      };
      schedule(900, SubmissionStatus.TRANSCRIBING);
      schedule(2500, SubmissionStatus.EVALUATING);
      schedule(5000, SubmissionStatus.AI_PASSED);

      return submission;
    },
    [acceptances, creator.userId, updateSubmissionStatus],
  );

  const visibleBounties = useMemo(() => {
    if (allNiches || selectedNicheIds.length === 0) return demoBounties;
    return demoBounties.filter((bounty) =>
      bounty.niches.some((niche) => selectedNicheIds.includes(niche.id)),
    );
  }, [allNiches, selectedNicheIds]);

  const value = useMemo<MockAppContextValue>(
    () => ({
      isHydrated,
      isAuthenticated,
      creator,
      bounties: visibleBounties,
      acceptances,
      submissions,
      allNiches,
      selectedNicheIds,
      loginDemo,
      logout,
      setCreatorNiches,
      acceptBounty,
      createSubmission,
      getBounty: (bountyId) => demoBounties.find((bounty) => bounty.id === bountyId),
      getAcceptance: (acceptanceId) => acceptances.find((item) => item.id === acceptanceId),
      getSubmission: (submissionId) => submissions.find((item) => item.id === submissionId),
    }),
    [
      isHydrated,
      isAuthenticated,
      creator,
      visibleBounties,
      acceptances,
      submissions,
      allNiches,
      selectedNicheIds,
      loginDemo,
      logout,
      setCreatorNiches,
      acceptBounty,
      createSubmission,
    ],
  );

  return <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>;
}

export function useMockApp() {
  const value = useContext(MockAppContext);
  if (!value) throw new Error('useMockApp must be used inside MockAppProvider');
  return value;
}
