import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { Deliverable, DeliverableCheck } from '../db/memoryDb';

export interface VerificationResult {
  passed: boolean;
  checks: DeliverableCheck[];
  aiSummary: string;
  aiConfidence: number;
  failureMessage: string | null;
}

/**
 * Pre-checks transcript deterministically for SPOKEN_PHRASE deliverables.
 */
function checkSpokenDeliverable(deliverable: Deliverable, normalizedTranscript: string): DeliverableCheck {
  const words = normalizedTranscript.toLowerCase();

  if (deliverable.matchMode === 'ALL_KEYWORDS') {
    const allFound = deliverable.keywords.every(kw => words.includes(kw.toLowerCase()));
    return {
      deliverableId: deliverable.id,
      label: deliverable.label,
      passed: allFound,
      evidence: allFound ? `Detected all required keywords: ${deliverable.keywords.join(', ')}` : `Missing keywords from: ${deliverable.keywords.join(', ')}`,
      confidence: allFound ? 0.99 : 0.95,
    };
  }

  // ANY_KEYWORD
  const foundKw = deliverable.keywords.find(kw => words.includes(kw.toLowerCase()));
  const passed = !!foundKw;
  return {
    deliverableId: deliverable.id,
    label: deliverable.label,
    passed,
    evidence: passed ? `Detected keyword: "${foundKw}"` : `None of the required keywords detected: ${deliverable.keywords.join(', ')}`,
    confidence: passed ? 0.98 : 0.95,
  };
}

/**
 * Structured LLM prompt for evaluating deliverables and relevance.
 */
function buildStructuredPrompt(brief: string, deliverables: Deliverable[], transcript: string): string {
  return `You are a strict compliance reviewer for brand video deliverables.

Bounty Brief:
"${brief}"

Deliverables to check:
${deliverables.map((d, i) => `${i + 1}. [ID: ${d.id}] ${d.label} (Required: ${d.required}) - Keywords/Theme: ${d.keywords.join(', ')}`).join('\n')}

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

export async function verifyDeliverablesStructured(
  brief: string,
  deliverables: Deliverable[],
  transcript: string | null
): Promise<VerificationResult> {
  const rawTranscript = (transcript || '').trim();

  // Guard: Empty or extremely short transcript
  if (!rawTranscript || rawTranscript.split(/\s+/).length < 3) {
    const checks: DeliverableCheck[] = deliverables.map(d => ({
      deliverableId: d.id,
      label: d.label,
      passed: false,
      evidence: 'No speech or audio detected in video',
      confidence: 1.0,
    }));
    return {
      passed: false,
      checks,
      aiSummary: 'Audio verification failed: No audible speech detected in the submitted video.',
      aiConfidence: 1.0,
      failureMessage: 'No audible speech was detected in your video. Please ensure clear microphone audio.',
    };
  }

  const normalized = rawTranscript.toLowerCase();

  // 1. Run deterministic checks on SPOKEN_PHRASE
  const checks: DeliverableCheck[] = [];
  const pendingLLMDeliverables: Deliverable[] = [];

  for (const d of deliverables) {
    if (d.kind === 'SPOKEN_PHRASE') {
      checks.push(checkSpokenDeliverable(d, normalized));
    } else {
      pendingLLMDeliverables.push(d);
    }
  }

  // 2. Call LLM for relevance and any LLM_RELEVANCE deliverables
  let llmResponse: any = null;
  const prompt = buildStructuredPrompt(brief, deliverables, rawTranscript);

  // Try Gemini Flash
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

  // Try OpenAI if Gemini didn't return
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

  // If no LLM configured or both failed, fallback to keyword heuristic for pending LLM deliverables
  if (!llmResponse) {
    console.log('[llm] Using heuristic evaluation fallback for deliverables');
    for (const d of pendingLLMDeliverables) {
      const foundKw = d.keywords.some(kw => normalized.includes(kw.toLowerCase()));
      checks.push({
        deliverableId: d.id,
        label: d.label,
        passed: foundKw,
        evidence: foundKw ? `Relevant theme words found in transcript` : `Keywords not detected: ${d.keywords.join(', ')}`,
        confidence: 0.85,
      });
    }

    const allRequiredPassed = checks.every((c) => {
      const d = deliverables.find(del => del.id === c.deliverableId);
      return !d?.required || c.passed;
    });

    const failedRequired = checks.find(c => {
      const d = deliverables.find(del => del.id === c.deliverableId);
      return d?.required && !c.passed;
    });

    return {
      passed: allRequiredPassed,
      checks,
      aiSummary: allRequiredPassed ? 'All required spoken deliverables and relevance checks passed.' : `Missing deliverable: ${failedRequired?.label}`,
      aiConfidence: 0.88,
      failureMessage: failedRequired ? `Verification failed: "${failedRequired.label}" was not detected.` : null,
    };
  }

  // Merge LLM checks
  for (const d of pendingLLMDeliverables) {
    const checkFromLLM = llmResponse.checks?.find((c: any) => c.deliverableId === d.id);
    if (checkFromLLM) {
      checks.push({
        deliverableId: d.id,
        label: d.label,
        passed: Boolean(checkFromLLM.passed),
        evidence: checkFromLLM.evidence || (checkFromLLM.passed ? 'Verified by LLM' : 'Missing required theme'),
        confidence: Number(checkFromLLM.confidence) || 0.9,
      });
    } else {
      // Fallback if LLM missed this deliverable ID
      const passed = d.keywords.some(k => normalized.includes(k.toLowerCase()));
      checks.push({
        deliverableId: d.id,
        label: d.label,
        passed,
        evidence: passed ? 'Keyword match' : 'Missing',
        confidence: 0.8,
      });
    }
  }

  // Evaluate final pass:
  // - Relevance check must pass
  // - All required deliverable checks must pass
  const isRelevant = llmResponse.relevant !== false;
  const allRequiredPassed = checks.every(c => {
    const d = deliverables.find(del => del.id === c.deliverableId);
    return !d?.required || c.passed;
  });

  const passed = isRelevant && allRequiredPassed;

  const failedCheck = checks.find(c => {
    const d = deliverables.find(del => del.id === c.deliverableId);
    return d?.required && !c.passed;
  });

  let failureMessage: string | null = null;
  if (!isRelevant) {
    failureMessage = 'Video content does not appear relevant to the brand brief or product.';
  } else if (failedCheck) {
    failureMessage = `Missing required deliverable: "${failedCheck.label}".`;
  }

  return {
    passed,
    checks,
    aiSummary: llmResponse.summary || (passed ? 'All required deliverables detected.' : failureMessage || 'Failed deliverables check.'),
    aiConfidence: Number(llmResponse.overallConfidence) || 0.95,
    failureMessage,
  };
}
