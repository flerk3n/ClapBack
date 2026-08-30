import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
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
  return `You are a strict compliance reviewer for brand video deliverables.

Bounty Brief:
"${brief}"

Deliverables to check:
${deliverables.map((deliverable, index) => `${index + 1}. [ID: ${deliverable.id}] ${deliverable.label} (Required: ${deliverable.required}) - Keywords/Theme: ${deliverable.keywords.join(', ')}`).join('\n')}

Video Transcript:
"""${transcript}"""

Instructions:
1. Evaluate if the transcript is genuinely relevant to the brand brief and product.
2. For each deliverable, indicate if it passed based on the transcript, cite the exact evidence quote from the transcript, and provide confidence (0.0 to 1.0).
3. Return ONLY valid JSON with this exact schema (no markdown, no backticks, just raw json):
{
  "relevant": boolean,
  "relevanceEvidence": "string quote or explanation",
  "checks": [
    {
      "deliverableId": "string matching deliverable id",
      "passed": boolean,
      "evidence": "string quote from transcript",
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

  if (transcriptDeliverables.length > 0 && (!rawTranscript || rawTranscript.split(/\s+/).length < 3)) {
    const transcriptIssue = rawTranscript
      ? 'Transcript is too short to verify this deliverable'
      : 'No speech or audio detected in video';
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
      aiSummary: rawTranscript
        ? 'Audio verification failed: The transcript is too short to establish the required content.'
        : 'Audio verification failed: No audible speech detected in the submitted video.',
      aiConfidence: 1,
      failureMessage: failedRequired
        ? rawTranscript
          ? 'The spoken description is too short to verify the required content.'
          : 'No audible speech was detected in your video. Please ensure clear microphone audio.'
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

  let llmResponse: any = null;
  if (pendingRelevanceDeliverables.length > 0) {
    const prompt = buildStructuredPrompt(brief, pendingRelevanceDeliverables, rawTranscript);

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const cleaned = result.response.text().replace(/```json|```/g, '').trim();
        llmResponse = JSON.parse(cleaned);
      } catch {
        console.warn('[llm] Gemini structured call failed; trying OpenAI');
      }
    }

    if (!llmResponse && process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const chat = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });
        const content = chat.choices[0]?.message?.content ?? '{}';
        llmResponse = JSON.parse(content);
      } catch {
        console.warn('[llm] OpenAI structured call failed');
      }
    }
  }

  if (!llmResponse) {
    if (pendingRelevanceDeliverables.length > 0) {
      console.log('[llm] Using heuristic evaluation fallback for deliverables');
    }
    for (const deliverable of pendingRelevanceDeliverables) {
      const foundKeyword = deliverable.keywords.some(keyword =>
        normalizedTranscript.includes(keyword.toLowerCase()));
      checks.push({
        deliverableId: deliverable.id,
        label: deliverable.label,
        passed: foundKeyword,
        evidence: foundKeyword
          ? 'Relevant theme words found in transcript'
          : `Keywords not detected: ${deliverable.keywords.join(', ')}`,
        confidence: 0.85,
      });
    }

    const orderedChecks = orderChecks(deliverables, checks);
    const failedRequired = requiredFailure(deliverables, orderedChecks);
    return {
      passed: !failedRequired,
      checks: orderedChecks,
      aiSummary: failedRequired
        ? `Missing deliverable: ${failedRequired.label}`
        : 'All required deliverable and relevance checks passed.',
      aiConfidence: 0.88,
      failureMessage: failedRequired
        ? `Verification failed: "${failedRequired.label}" was not met.`
        : null,
    };
  }

  for (const deliverable of pendingRelevanceDeliverables) {
    const checkFromLLM = llmResponse.checks?.find(
      (check: any) => check.deliverableId === deliverable.id,
    );
    if (checkFromLLM) {
      checks.push({
        deliverableId: deliverable.id,
        label: deliverable.label,
        passed: Boolean(checkFromLLM.passed),
        evidence: checkFromLLM.evidence
          || (checkFromLLM.passed ? 'Verified by LLM' : 'Missing required theme'),
        confidence: Number(checkFromLLM.confidence) || 0.9,
      });
    } else {
      const passed = deliverable.keywords.some(keyword =>
        normalizedTranscript.includes(keyword.toLowerCase()));
      checks.push({
        deliverableId: deliverable.id,
        label: deliverable.label,
        passed,
        evidence: passed ? 'Keyword match' : 'Missing',
        confidence: 0.8,
      });
    }
  }

  const orderedChecks = orderChecks(deliverables, checks);
  const isRelevant = llmResponse.relevant !== false;
  const failedRequired = requiredFailure(deliverables, orderedChecks);
  const passed = isRelevant && !failedRequired;

  let failureMessage: string | null = null;
  if (!isRelevant) {
    failureMessage = 'Video content does not appear relevant to the brand brief or product.';
  } else if (failedRequired) {
    failureMessage = `Missing required deliverable: "${failedRequired.label}".`;
  }

  return {
    passed,
    checks: orderedChecks,
    aiSummary: llmResponse.summary
      || (passed ? 'All required deliverables detected.' : failureMessage || 'Failed deliverables check.'),
    aiConfidence: Number(llmResponse.overallConfidence) || 0.95,
    failureMessage,
  };
}
