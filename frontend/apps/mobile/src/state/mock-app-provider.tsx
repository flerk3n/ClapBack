import type { Acceptance, Bounty, CreatorProfile, SubmissionSummary } from '@clapback/contracts';
import { AcceptanceStatus, SubmissionStatus } from '@clapback/contracts';
import { demoBounties, demoCreator } from '@clapback/demo-data';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as api from '@/lib/api';

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
  setCreatorNiches: (allNiches: boolean, nicheIds: number[]) => Promise<void>;
  acceptBounty: (bountyId: string) => Promise<Acceptance>;
  createSubmission: (acceptanceId: string, video: SelectedVideo, onProgress: (percentage: number) => void) => Promise<SubmissionSummary>;
  refreshSubmission: (submissionId: string) => Promise<SubmissionSummary>;
  getBounty: (bountyId: string) => Bounty | undefined;
  getAcceptance: (acceptanceId: string) => Acceptance | undefined;
  getSubmission: (submissionId: string) => SubmissionSummary | undefined;
};

const MockAppContext = createContext<MockAppContextValue | null>(null);

export function MockAppProvider({ children }: PropsWithChildren) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [creator, setCreator] = useState<CreatorProfile>(demoCreator);
  const [bounties, setBounties] = useState<Bounty[]>(demoBounties);
  const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);

  const loadWorkspace = useCallback(async () => {
    const [nextBounties, nextAcceptances] = await Promise.all([api.listBounties(), api.listAcceptances()]);
    setBounties(nextBounties);
    setAcceptances(nextAcceptances);
    setSubmissions(nextAcceptances.flatMap(item => item.latestSubmission ? [item.latestSubmission] : []));
  }, []);

  useEffect(() => {
    api.restoreCreator()
      .then(async restoredCreator => {
        if (!restoredCreator) return;
        setCreator(restoredCreator);
        setIsAuthenticated(true);
        await loadWorkspace();
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsHydrated(true));
  }, [loadWorkspace]);

  const loginDemo = useCallback(async () => {
    const result = await api.loginDemo();
    setCreator(result.creator);
    setIsAuthenticated(true);
    await loadWorkspace();
  }, [loadWorkspace]);

  const logout = useCallback(async () => {
    await api.clearSession();
    setIsAuthenticated(false);
    setCreator(demoCreator);
    setBounties(demoBounties);
    setAcceptances([]);
    setSubmissions([]);
  }, []);

  const setCreatorNiches = useCallback(async (useAllNiches: boolean, nicheIds: number[]) => {
    const updatedCreator = await api.updateNiches(useAllNiches, nicheIds);
    setCreator(updatedCreator);
    setBounties(await api.listBounties());
  }, []);

  const acceptBounty = useCallback(async (bountyId: string) => {
    const acceptance = await api.acceptBounty(bountyId);
    setAcceptances(current => [acceptance, ...current.filter(item => item.id !== acceptance.id)]);
    return acceptance;
  }, []);

  const upsertSubmission = useCallback((submission: SubmissionSummary) => {
    setSubmissions(current => [submission, ...current.filter(item => item.id !== submission.id)]);
    setAcceptances(current => current.map(acceptance => acceptance.id === submission.acceptanceId
      ? {
          ...acceptance,
          status: submission.status === SubmissionStatus.AI_PASSED
            || submission.status === SubmissionStatus.IN_REVIEW
            || submission.status === SubmissionStatus.SCORED
            ? AcceptanceStatus.SUBMITTED
            : acceptance.status,
          latestSubmission: submission,
        }
      : acceptance));
  }, []);

  const createSubmission = useCallback(async (
    acceptanceId: string,
    video: SelectedVideo,
    onProgress: (percentage: number) => void,
  ) => {
    const submission = await api.uploadSubmission(acceptanceId, video, onProgress);
    upsertSubmission(submission);
    return submission;
  }, [upsertSubmission]);

  const refreshSubmission = useCallback(async (submissionId: string) => {
    const submission = await api.getSubmission(submissionId);
    upsertSubmission(submission);
    return submission;
  }, [upsertSubmission]);

  const allNiches = creator.allNiches;
  const selectedNicheIds = creator.niches.map(niche => niche.id);
  const value = useMemo<MockAppContextValue>(() => ({
    isHydrated,
    isAuthenticated,
    creator,
    bounties,
    acceptances,
    submissions,
    allNiches,
    selectedNicheIds,
    loginDemo,
    logout,
    setCreatorNiches,
    acceptBounty,
    createSubmission,
    refreshSubmission,
    getBounty: bountyId => bounties.find(bounty => bounty.id === bountyId),
    getAcceptance: acceptanceId => acceptances.find(acceptance => acceptance.id === acceptanceId),
    getSubmission: submissionId => submissions.find(submission => submission.id === submissionId),
  }), [
    acceptBounty,
    acceptances,
    allNiches,
    bounties,
    createSubmission,
    creator,
    isAuthenticated,
    isHydrated,
    loginDemo,
    logout,
    refreshSubmission,
    selectedNicheIds,
    setCreatorNiches,
    submissions,
  ]);

  return <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>;
}

export function useMockApp() {
  const value = useContext(MockAppContext);
  if (!value) throw new Error('useMockApp must be used inside MockAppProvider');
  return value;
}
