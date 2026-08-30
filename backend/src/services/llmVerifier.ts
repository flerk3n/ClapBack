import { GoogleGenerativeAI } from '@google/generative-ai';
import { Deliverable, DeliverableCheck } from '../db/memoryDb';

type SpokenDeliverable = Extract<Deliverable, { kind: 'SPOKEN_PHRASE' }>;
type RelevanceDeliverable = Extract<Deliverable, { kind: 'RELEVANCE' }>;
type DurationDeliverable = Extract<Deliverable, { kind: 'MAX_DURATION' }>;

export interface VerificationMetadata {
  durationSeconds: number | null;
}

export interface VerificationResult {
  passed: boolean;
  checks: DeliverableCheck[];
  aiSummary: string;
  aiConfidence: number;
  failureMessage: string | null;
}

interface LlmDeliverableCheck {
  deliverableId: string;
  passed: boolean;
  evidence: string;
  confidence: number;
}

interface LlmVerificationResponse {
  checks: LlmDeliverableCheck[];
  overallConfidence: number;
  summary: string;
}

function checkSpokenDeliverable(deliverable: SpokenDeliverable, normalizedTranscript: string): DeliverableCheck {
  const words = normalizedTranscript.toLowerCase();

  if (deliverable.matchMode === 'ALL_KEYWORDS') {
    const allFound = deliverable.keywords.every(keyword => words.includes(keyword.toLowerCase()));
    return {
      deliverableId: deliverable.id,
      label: deliverable.label,
      passed: allFound,
      evidence: allFound
        ? `Detected all required keywords: ${deliverable.keywords.join(', ')}`
        : `Missing keywords from: ${deliverable.keywords.join(', ')}`,
      confidence: allFound ? 0.99 : 0.95,
    };
  }

  const foundKeyword = deliverable.keywords.find(keyword => words.includes(keyword.toLowerCase()));
  const passed = Boolean(foundKeyword);
  return {
    deliverableId: deliverable.id,
    label: deliverable.label,
    passed,
    evidence: passed
      ? `Detected keyword: "${foundKeyword}"`
      : `None of the required keywords detected: ${deliverable.keywords.join(', ')}`,
    confidence: passed ? 0.98 : 0.95,
  };
}

function checkDurationDeliverable(
  deliverable: DurationDeliverable,
  durationSeconds: number | null,
): DeliverableCheck {
  if (durationSeconds === null) {
    return {
      deliverableId: deliverable.id,
      label: deliverable.label,
      passed: false,
      evidence: `Video duration is unavailable; it must be under ${deliverable.maxDurationSeconds} seconds`,
      confidence: 1,
    };
  }

  const passed = durationSeconds < deliverable.maxDurationSeconds;
  return {
    deliverableId: deliverable.id,
    label: deliverable.label,
    passed,
    evidence: passed
      ? `Video duration is ${durationSeconds.toFixed(2)} seconds, under the ${deliverable.maxDurationSeconds}-second limit`
      : `Video duration is ${durationSeconds.toFixed(2)} seconds, not under the ${deliverable.maxDurationSeconds}-second limit`,
    confidence: 1,
  };
}

function buildStructuredPrompt(
  brief: string,
  deliverables: RelevanceDeliverable[],
  transcript: string,
): string {
  return `You are a practical evaluator for explicit brand video deliverables.

Bounty Brief (context only; do not infer extra pass requirements from it):
"${brief}"

Deliverables to check:
${deliverables.map((deliverable, index) => `${index + 1}. [ID: ${deliverable.id}] ${deliverable.label} (Required: ${deliverable.required}) - Keywords/Theme: ${deliverable.keywords.join(', ')}`).join('\n')}

Video Transcript:
"""${transcript}"""

Instructions:
1. Judge each deliverable independently using only its explicit label and Keywords/Theme. The Bounty Brief provides context but does not add pass requirements.
2. Pass a deliverable when the transcript clearly mentions or describes its listed theme or an obvious equivalent. Accept natural wording, minor transcription errors, singular/plural differences, casing, and hyphenation differences.
3. Do not require a brand name, gender, fit, size, color, styling, scene, or other detail unless that exact requirement appears in the deliverable itself.
4. For a T-shirt/Tshirt/tee deliverable, any clear T-shirt or tee reference passes. For example, "XYZ oversized T-shirt" passes without also saying "Uniqlo", "men's", or describing a complete outfit.
5. Confidence expresses certainty in the cited evidence only. It is not a separate pass threshold.
6. For each deliverable, cite the exact supporting transcript quote or give a concise explanation when it fails.
7. Return ONLY valid JSON with this exact schema (no markdown, no backticks, just raw json):
{
  "checks": [
    {
      "deliverableId": "string matching deliverable id",
      "passed": boolean,
      "evidence": "string quote or concise explanation",
      "confidence": number
    }
  ],
  "overallConfidence": number,
  "summary": "Brief 1-2 sentence evaluation summary"
}`;
}

function orderChecks(deliverables: Deliverable[], checks: DeliverableCheck[]): DeliverableCheck[] {
  const position = new Map(deliverables.map((deliverable, index) => [deliverable.id, index]));
  return [...checks].sort((left, right) =>
    (position.get(left.deliverableId) ?? Number.MAX_SAFE_INTEGER)
    - (position.get(right.deliverableId) ?? Number.MAX_SAFE_INTEGER));
}

function requiredFailure(
  deliverables: Deliverable[],
  checks: DeliverableCheck[],
): DeliverableCheck | undefined {
  return checks.find(check => {
    const deliverable = deliverables.find(item => item.id === check.deliverableId);
    return deliverable?.required && !check.passed;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isConfidence(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1;
}

function parseStructuredResponse(
  rawResponse: string,
  deliverables: RelevanceDeliverable[],
): LlmVerificationResponse {
  const parsed: unknown = JSON.parse(rawResponse);
  if (!isRecord(parsed)
    || !Array.isArray(parsed.checks)
    || !isConfidence(parsed.overallConfidence)
    || typeof parsed.summary !== 'string'
    || !parsed.summary.trim()
    || parsed.checks.length !== deliverables.length) {
    throw new Error('Gemini returned an invalid structured response');
  }

  const expectedIds = new Set(deliverables.map(deliverable => deliverable.id));
  const seenIds = new Set<string>();
  const checks: LlmDeliverableCheck[] = parsed.checks.map(rawCheck => {
    if (!isRecord(rawCheck)
      || typeof rawCheck.deliverableId !== 'string'
      || !expectedIds.has(rawCheck.deliverableId)
      || seenIds.has(rawCheck.deliverableId)
      || typeof rawCheck.passed !== 'boolean'
      || typeof rawCheck.evidence !== 'string'
      || !rawCheck.evidence.trim()
      || !isConfidence(rawCheck.confidence)) {
      throw new Error('Gemini returned an invalid Deliverable check');
    }

    seenIds.add(rawCheck.deliverableId);
    return {
      deliverableId: rawCheck.deliverableId,
      passed: rawCheck.passed,
      evidence: rawCheck.evidence.trim(),
      confidence: rawCheck.confidence,
    };
  });

  return {
    checks,
    overallConfidence: parsed.overallConfidence,
    summary: parsed.summary.trim(),
  };
}

export async function verifyDeliverablesStructured(
  brief: string,
  deliverables: Deliverable[],
  transcript: string | null,
  metadata: VerificationMetadata,
): Promise<VerificationResult> {
  const rawTranscript = (transcript || '').trim();
  const checks: DeliverableCheck[] = deliverables
    .filter((deliverable): deliverable is DurationDeliverable => deliverable.kind === 'MAX_DURATION')
    .map(deliverable => checkDurationDeliverable(deliverable, metadata.durationSeconds));
  const transcriptDeliverables = deliverables.filter(deliverable => deliverable.kind !== 'MAX_DURATION');

  if (transcriptDeliverables.length > 0 && !rawTranscript) {
    const transcriptIssue = 'No speech or audio detected in video';
    checks.push(...transcriptDeliverables.map(deliverable => ({
      deliverableId: deliverable.id,
      label: deliverable.label,
      passed: false,
      evidence: transcriptIssue,
      confidence: 1,
    })));
    const orderedChecks = orderChecks(deliverables, checks);
    const failedRequired = requiredFailure(deliverables, orderedChecks);
    return {
      passed: !failedRequired,
      checks: orderedChecks,
      aiSummary: 'Audio verification failed: No audible speech detected in the submitted video.',
      aiConfidence: 1,
      failureMessage: failedRequired
        ? 'No audible speech was detected in your video. Please ensure clear microphone audio.'
        : null,
    };
  }

  const normalizedTranscript = rawTranscript.toLowerCase();
  const pendingRelevanceDeliverables: RelevanceDeliverable[] = [];
  for (const deliverable of transcriptDeliverables) {
    if (deliverable.kind === 'SPOKEN_PHRASE') {
      checks.push(checkSpokenDeliverable(deliverable, normalizedTranscript));
    } else {
      pendingRelevanceDeliverables.push(deliverable);
    }
  }

  let llmResponse: LlmVerificationResponse | null = null;
  if (pendingRelevanceDeliverables.length > 0) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.startsWith('replace_with_')) {
      throw new Error('GEMINI_API_KEY must be configured for Gemini 2.5 Flash relevance verification');
    }

    const prompt = buildStructuredPrompt(brief, pendingRelevanceDeliverables, rawTranscript);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const cleaned = result.response.text().replace(/```json|```/g, '').trim();
      llmResponse = parseStructuredResponse(cleaned, pendingRelevanceDeliverables);
    } catch {
      throw new Error('Gemini 2.5 Flash relevance verification failed');
    }
  }

  if (!llmResponse) {
    const orderedChecks = orderChecks(deliverables, checks);
    const failedRequired = requiredFailure(deliverables, orderedChecks);
    return {
      passed: !failedRequired,
      checks: orderedChecks,
      aiSummary: failedRequired
        ? `Missing deliverable: ${failedRequired.label}`
        : 'All required deterministic deliverable checks passed.',
      aiConfidence: 0.99,
      failureMessage: failedRequired
        ? `Verification failed: "${failedRequired.label}" was not met.`
        : null,
    };
  }

  for (const deliverable of pendingRelevanceDeliverables) {
    const checkFromLLM = llmResponse.checks.find(
      check => check.deliverableId === deliverable.id,
    );
    if (checkFromLLM) {
      checks.push({
        deliverableId: deliverable.id,
        label: deliverable.label,
        passed: checkFromLLM.passed,
        evidence: checkFromLLM.evidence,
        confidence: checkFromLLM.confidence,
      });
    } else {
      throw new Error(`Gemini 2.5 Flash response omitted deliverable "${deliverable.id}"`);
    }
  }

  const orderedChecks = orderChecks(deliverables, checks);
  const failedRequired = requiredFailure(deliverables, orderedChecks);
  const passed = !failedRequired;
  const failureMessage = failedRequired
    ? `Missing required deliverable: "${failedRequired.label}".`
    : null;

  return {
    passed,
    checks: orderedChecks,
    aiSummary: llmResponse.summary,
    aiConfidence: llmResponse.overallConfidence,
    failureMessage,
  };
}
