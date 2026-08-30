import type {
  Acceptance,
  Bounty,
  CreatorProfile,
  DemoCreatorLoginResult,
  ReviewRoundResult,
  SubmissionSummary,
  TokenRefreshResult,
} from '@clapback/contracts';
import * as SecureStore from 'expo-secure-store';
import type { SelectedVideo } from '@/state/mock-app-provider';

const ACCESS_TOKEN_KEY = 'clapback.access-token';
const REFRESH_TOKEN_KEY = 'clapback.refresh-token';
const DEMO_CREATOR_ID = 'ebf4b0b2-d96f-47d2-8f27-60139947f6b8';
export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001').replace(/\/$/, '');
const demoCreatorPin = process.env.EXPO_PUBLIC_DEMO_CREATOR_PIN || '1234';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function unwrap<T>(payload: unknown, status: number): T {
  const value = payload as { data?: T; error?: { code?: string; message?: string } };
  if (value?.data !== undefined) return value.data;
  throw new ApiError(value?.error?.message || 'Clapback request failed', value?.error?.code || 'REQUEST_FAILED', status);
}

async function saveTokens(tokens: TokenRefreshResult) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

async function loadTokens() {
  if (accessToken && refreshToken) return;
  [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

async function refreshAccessToken() {
  if (!refreshToken) throw new ApiError('Your demo session expired', 'AUTH_REQUIRED', 401);
  const response = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const payload = await response.json();
  if (!response.ok) unwrap(payload, response.status);
  await saveTokens(unwrap<TokenRefreshResult>(payload, response.status));
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  await loadTokens();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && retry && refreshToken) {
    refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
    await refreshPromise;
    return request<T>(path, init, false);
  }
  if (!response.ok) unwrap(payload, response.status);
  return unwrap<T>(payload, response.status);
}

export async function loginDemo(): Promise<DemoCreatorLoginResult> {
  const response = await fetch(`${apiBaseUrl}/v1/demo/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: demoCreatorPin, creatorFixtureId: DEMO_CREATOR_ID }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) unwrap(payload, response.status);
  const result = unwrap<DemoCreatorLoginResult>(payload, response.status);
  await saveTokens(result);
  return result;
}

export async function restoreCreator(): Promise<CreatorProfile | null> {
  await loadTokens();
  if (!accessToken && !refreshToken) return null;
  try {
    return await request<CreatorProfile>('/v1/me');
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export const listBounties = () => request<Bounty[]>('/v1/bounties');
export const listAcceptances = () => request<Acceptance[]>('/v1/acceptances');
export const acceptBounty = (bountyId: string) => request<Acceptance>(`/v1/bounties/${bountyId}/accept`, { method: 'POST' });
export const updateNiches = (allNiches: boolean, nicheIds: number[]) => request<CreatorProfile>('/v1/me/niches', {
  method: 'PUT',
  body: JSON.stringify({ allNiches, nicheIds }),
});
export const getSubmission = (submissionId: string) => request<SubmissionSummary>(`/v1/submissions/${submissionId}`);

export function uploadSubmission(
  acceptanceId: string,
  video: SelectedVideo,
  onProgress: (percentage: number) => void,
): Promise<SubmissionSummary> {
  return new Promise(async (resolve, reject) => {
    await loadTokens();
    const form = new FormData();
    form.append('acceptanceId', acceptanceId);
    form.append('video', { uri: video.uri, name: video.fileName, type: video.mimeType } as unknown as Blob);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${apiBaseUrl}/v1/submissions`);
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Idempotency-Key', `${acceptanceId}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    xhr.timeout = 120_000;
    xhr.upload.onprogress = event => {
      if (event.lengthComputable && event.total > 0) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError('Could not reach the Clapback Backend', 'NETWORK_ERROR', 0));
    xhr.ontimeout = () => reject(new ApiError('Video upload timed out', 'UPLOAD_TIMEOUT', 0));
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || '{}');
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new ApiError(payload.error?.message || 'Video upload failed', payload.error?.code || 'UPLOAD_FAILED', xhr.status));
          return;
        }
        resolve(unwrap<{ submission: SubmissionSummary }>(payload, xhr.status).submission);
      } catch (error) {
        reject(error);
      }
    };
    xhr.send(form);
  });
}

export const startReviewRound = (submissionId: string) => request<ReviewRoundResult>(`/v1/submissions/${submissionId}/review-round`, { method: 'POST' });
export const getReviewRound = async (submissionId: string): Promise<ReviewRoundResult | null> => {
  try {
    return await request<ReviewRoundResult>(`/v1/submissions/${submissionId}/review-round`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};
export const closeReviewRound = (submissionId: string) => request<ReviewRoundResult>(`/v1/submissions/${submissionId}/review-round/close`, { method: 'POST' });
