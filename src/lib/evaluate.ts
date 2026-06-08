import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import { CATEGORY_LABELS, SECTIONS, STAGE_LABELS, type ProjectContext, type Question, type SectionId } from "./questions";
import { tierForScore, type QuestionEvaluation, type SectionEvaluations } from "./scoring";

type OpenAiEvaluationResponse = {
  evaluations: SectionEvaluations;
};

type EvaluationProvider = "openai" | "nvidia";

type PublicEvaluationProviderConfig = {
  provider: EvaluationProvider;
  model: string;
  baseURL?: string;
};

type EvaluationProviderConfig = PublicEvaluationProviderConfig & {
  apiKey: string;
  models?: string[];
  timeoutMs?: number;
  maxTokens?: number;
};

const DEFAULT_OPENAI_EVALUATION_MODEL = "gpt-5-mini";
const DEFAULT_OPENAI_TIMEOUT_MS = 10_000;
const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_NVIDIA_EVALUATION_MODEL = "nvidia/llama-3.3-nemotron-super-49b-v1.5";
const DEFAULT_NVIDIA_TIMEOUT_MS = 10_000;
const DEFAULT_NVIDIA_MAX_TOKENS = 2500;
const DEFAULT_NVIDIA_REQUESTS_PER_MINUTE = 40;
const NVIDIA_DEFAULT_FALLBACK_MODELS = [
  "nvidia/llama-3.3-nemotron-super-49b-v1.5",
];
const NVIDIA_LEGACY_SLOW_MODELS = new Set(["nvidia/nvidia-nemotron-nano-9b-v2"]);
const MAX_MODEL_OUTPUT_TOKENS = 2500;
const SECTION_MAX_TOKENS = 360;
const INSIGHT_MAX_TOKENS = 220;
const MAX_PROVIDER_TIMEOUT_MS = 5_000;
const PROVIDER_RETRY_ATTEMPTS = 1;
const PROVIDER_RETRY_BASE_MS = 800;
const PROVIDER_RETRY_MAX_MS = 5_000;

function configuredProvider(env: NodeJS.ProcessEnv): EvaluationProvider | "auto" | undefined {
  const provider = (env.SHIPCHECK_AI_PROVIDER || env.AI_PROVIDER)?.trim().toLowerCase();

  if (!provider) return undefined;
  if (provider === "openai" || provider === "nvidia" || provider === "auto") return provider;

  throw new Error(`Unsupported SHIPCHECK_AI_PROVIDER "${provider}". Use openai, nvidia, or auto.`);
}

function positiveIntegerFromEnv(env: NodeJS.ProcessEnv, key: string, defaultValue: number): number {
  const configured = env[key];
  if (configured === undefined || configured.trim() === "") return defaultValue;

  const parsed = Number(configured);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const globalForRateState = globalThis as typeof globalThis & {
  __shipcheckProviderCalls?: Map<string, { nextAvailableAtMs: number }>;
};

function providerCallState() {
  if (!globalForRateState.__shipcheckProviderCalls) {
    globalForRateState.__shipcheckProviderCalls = new Map();
  }

  return globalForRateState.__shipcheckProviderCalls;
}

function providerCooldownMs(config: EvaluationProviderConfig): number {
  if (config.provider !== "nvidia") return 0;
  const requestsPerMinute = positiveIntegerFromEnv(process.env, "NVIDIA_MAX_REQUESTS_PER_MINUTE", DEFAULT_NVIDIA_REQUESTS_PER_MINUTE);
  return Math.max(1, Math.ceil(60_000 / requestsPerMinute));
}

async function applyProviderCooldown(config: EvaluationProviderConfig) {
  const cooldownMs = providerCooldownMs(config);
  if (cooldownMs <= 0) return;

  const state = providerCallState();
  const key = `${config.provider}:${config.model}`;
  const now = Date.now();
  const bucket = state.get(key) ?? { nextAvailableAtMs: now };
  const waitMs = Math.max(0, bucket.nextAvailableAtMs - now);

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  bucket.nextAvailableAtMs = Date.now() + cooldownMs;
  state.set(key, bucket);
}

function parseErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const maybeStatus = (error as { status?: number; statusCode?: number }).status ?? (error as { statusCode?: number }).statusCode;
  if (typeof maybeStatus === "number") return maybeStatus;
  return undefined;
}

function parseRetryAfterMs(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const raw = (error as { headers?: unknown }).headers ?? (error as { response?: { headers?: unknown } }).response?.headers;
  if (!raw) return undefined;

  let retryAfter: string | undefined;
  const headers = raw as { get?: (key: string) => string | null; [key: string]: unknown };
  const directRetryAfter = (headers as { retryAfter?: string | string[] }).retryAfter;
  if (typeof headers.get === "function") {
    retryAfter = headers.get("retry-after") ?? headers.get("Retry-After") ?? (typeof directRetryAfter === "string" ? directRetryAfter : undefined);
    if (Array.isArray(directRetryAfter)) {
      retryAfter = directRetryAfter[0];
    }
  } else {
    if (typeof raw === "string") {
      retryAfter = raw;
    } else if (Array.isArray(raw)) {
      retryAfter = raw[0];
    }
  }

  if (!retryAfter) return undefined;

  const seconds = Number.parseInt(Array.isArray(retryAfter) ? retryAfter[0] : retryAfter, 10);
  if (Number.isNaN(seconds) || seconds < 1) return undefined;
  return seconds * 1000;
}

function isRetriableProviderError(error: unknown): boolean {
  const status = parseErrorStatus(error);
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  const message = typeof error === "object" && error !== null ? String((error as { message?: string }).message ?? "").toLowerCase() : "";
  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("rate limit") ||
    message.includes("rate-limit") ||
    message.includes("too many requests") ||
    message.includes("empty evaluation response") ||
    message.includes("json")
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`provider request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function runModelWithRetry(config: EvaluationProviderConfig, instructions: string, input: string, maxTokens: number): Promise<string> {
  let attempt = 0;
  let delayMs = PROVIDER_RETRY_BASE_MS;
  const maxAttempts = Math.max(1, PROVIDER_RETRY_ATTEMPTS);

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      await applyProviderCooldown(config);
      const effectiveTimeoutMs = Math.max(config.timeoutMs ?? MAX_PROVIDER_TIMEOUT_MS, 5_000);
      return await withTimeout(runModel(config, instructions, input, maxTokens), effectiveTimeoutMs);
    } catch (error) {
      if (attempt >= maxAttempts || !isRetriableProviderError(error)) {
        throw error;
      }

      const retryAfterMs = parseRetryAfterMs(error);
      await sleep(retryAfterMs ? Math.min(retryAfterMs, PROVIDER_RETRY_MAX_MS) : delayMs);
      delayMs = Math.min(delayMs * 2, PROVIDER_RETRY_MAX_MS);
    }
  }

  throw new Error(`${config.provider} (${config.model}) request failed after ${maxAttempts} attempts`);
}

function modelTokenLimitFromEnv(env: NodeJS.ProcessEnv, key: string, defaultValue: number): number {
  return Math.min(positiveIntegerFromEnv(env, key, defaultValue), MAX_MODEL_OUTPUT_TOKENS);
}

function providerTimeoutFromEnv(env: NodeJS.ProcessEnv, key: string, defaultValue: number): number {
  return Math.min(positiveIntegerFromEnv(env, key, defaultValue), MAX_PROVIDER_TIMEOUT_MS);
}

function nvidiaModelCandidates(env: NodeJS.ProcessEnv): string[] {
  const configured = env.NVIDIA_EVALUATION_MODEL || env.NVIDIA_MODEL;
  const configuredModels = configured ? configured.split(",").map((value) => value.trim()).filter(Boolean) : [];
  const fallbackModels = (env.NVIDIA_MODEL_FALLBACKS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configuredModels.length === 0) {
    return [...NVIDIA_DEFAULT_FALLBACK_MODELS];
  }

  const configuredLegacyModels = configuredModels.filter((model) => NVIDIA_LEGACY_SLOW_MODELS.has(model));
  const configuredPreferredModels = configuredModels.filter((model) => !NVIDIA_LEGACY_SLOW_MODELS.has(model));

  if (configuredPreferredModels.length > 0) {
    return [...new Set([...configuredPreferredModels, ...fallbackModels, ...configuredLegacyModels])];
  }

  if (fallbackModels.length > 0) {
    return fallbackModels;
  }

  return [DEFAULT_NVIDIA_EVALUATION_MODEL];
}

function openAiConfig(env: NodeJS.ProcessEnv): EvaluationProviderConfig | null {
  if (!env.OPENAI_API_KEY) return null;

  return {
    provider: "openai",
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_EVALUATION_MODEL || DEFAULT_OPENAI_EVALUATION_MODEL,
    models: [env.OPENAI_EVALUATION_MODEL || DEFAULT_OPENAI_EVALUATION_MODEL],
    timeoutMs: providerTimeoutFromEnv(env, "OPENAI_TIMEOUT_MS", DEFAULT_OPENAI_TIMEOUT_MS),
  };
}

function nvidiaConfig(env: NodeJS.ProcessEnv): EvaluationProviderConfig | null {
  const nvidiaApiKey = env.NVIDIA_API_KEY || env.NVCF_RUN_KEY;
  if (!nvidiaApiKey) return null;
  const models = nvidiaModelCandidates(env);
  if (models.length === 0) return null;

  return {
    provider: "nvidia",
    apiKey: nvidiaApiKey,
    baseURL: (env.NVIDIA_BASE_URL || DEFAULT_NVIDIA_BASE_URL).replace(/\/+$/, ""),
    models,
    model: models[0],
    timeoutMs: providerTimeoutFromEnv(env, "NVIDIA_TIMEOUT_MS", DEFAULT_NVIDIA_TIMEOUT_MS),
    maxTokens: modelTokenLimitFromEnv(env, "NVIDIA_MAX_TOKENS", DEFAULT_NVIDIA_MAX_TOKENS),
  };
}

function resolveEvaluationProviderConfigs(env: NodeJS.ProcessEnv): EvaluationProviderConfig[] {
  const provider = configuredProvider(env);
  const openai = openAiConfig(env);
  const nvidia = nvidiaConfig(env);

  if (provider === "openai") {
    return openai ? [openai] : [];
  }

  if (provider === "nvidia") {
    if (!nvidia) return [];
    return [nvidia];
  }

  if (provider === "auto") {
    return [nvidia, openai].filter(Boolean) as EvaluationProviderConfig[];
  }

  const providers: EvaluationProviderConfig[] = [];
  if (nvidia) providers.push(nvidia);
  if (openai) providers.push(openai);
  return providers;
}

function resolveEvaluationProviderConfig(env: NodeJS.ProcessEnv): EvaluationProviderConfig | null {
  return resolveEvaluationProviderConfigs(env)[0] ?? null;
}

export function evaluationProviderForEnv(env: NodeJS.ProcessEnv = process.env): PublicEvaluationProviderConfig | null {
  const config = resolveEvaluationProviderConfig(env);
  if (!config) return null;
  return {
    provider: config.provider,
    model: config.model,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  };
}

function evaluationInstructions(sectionId: SectionId, context: ProjectContext): string {
  const section = SECTIONS[sectionId];
  return `You are a brutally honest product advisor evaluating ONE SECTION of a builder's pre-launch readiness check.
Your job is not to be encouraging. Your job is to find the real weaknesses in their thinking so they can fix them before shipping.

Product being evaluated:
- Name: ${context.productName}
- Category: ${CATEGORY_LABELS[context.category]}
- Stage: ${STAGE_LABELS[context.stage]}
- What it does: ${context.oneLiner}

Use this product context to make your feedback specific to this product type. Generic PM advice is a failure mode.

You will receive questions and answers from the "${section.label}" section.
For each answer, evaluate specificity, evidence, clarity, and honesty.

Score 0-10:
8-10 -> GREEN: specific, evidenced, clear, honest
5-7 -> AMBER: directionally right but needs sharper thinking
0-4 -> RED: vague, assumption-based, or evasive

For each answer, provide score, tier, and 1-2 short sentences of specific feedback. RED items must include action: one concrete next step, maximum 15 words, starting with a verb.

Rules:
- Never use "great", "awesome", "excellent", or "good job".
- Never say "I can see you've put thought into this".
- Be direct. Assume the builder can handle honest feedback.
- If an answer is empty or under 10 characters, score it 0, tier RED, feedback "No substantive answer provided.", action "Answer this question fully before shipping."
- Escape quotation marks, newlines, and control characters inside JSON string values.
- Do not include markdown fences, comments, trailing commas, or text outside the JSON object.
- Output only valid JSON shaped as {"evaluations":{"questionId":{"score":0,"tier":"RED","feedback":"...","action":"..."}}}.`;
}

function sectionPayload(questions: Question[], answers: Record<string, string>): string {
  return JSON.stringify(
    questions.map((question) => ({
      id: question.id,
      question: question.question,
      answer: answers[question.id] ?? "",
      weight: question.weight,
    })),
    null,
    2,
  );
}

function normalizeEvaluation(question: Question, evaluation: Partial<QuestionEvaluation> | undefined): QuestionEvaluation {
  const score = Math.max(0, Math.min(10, Math.round(Number(evaluation?.score ?? 0))));
  const tier = evaluation?.tier && ["RED", "AMBER", "GREEN"].includes(evaluation.tier) ? evaluation.tier : tierForScore(score);
  const feedback = typeof evaluation?.feedback === "string" && evaluation.feedback.trim()
    ? evaluation.feedback.trim()
    : "No substantive answer provided.";
  const normalized: QuestionEvaluation = { score, tier, feedback };

  if (tier === "RED") {
    normalized.action =
      typeof evaluation?.action === "string" && evaluation.action.trim()
        ? evaluation.action.trim()
        : "Answer this question fully before shipping.";
  }

  if ((question.id && question) && tier !== "RED") {
    delete normalized.action;
  }

  return normalized;
}

function isMockAiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "test";
}

async function withProviderAbort<T>(timeoutMs: number | undefined, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  if (!timeoutMs) return run(new AbortController().signal);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`provider request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function runNvidiaCompletion(config: EvaluationProviderConfig, instructions: string, input: string, maxTokens: number): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: config.timeoutMs,
  });

  const request = {
    model: config.model,
    messages: [
      { role: "system" as const, content: instructions },
      { role: "user" as const, content: input },
    ],
    temperature: 0,
  };

  const response = await withProviderAbort(config.timeoutMs, (signal) =>
    client.chat.completions.create(
      {
        ...request,
        ...(providerSupportsMaxCompletionTokens(config.model) ? { max_completion_tokens: Math.min(config.maxTokens ?? maxTokens, maxTokens, MAX_MODEL_OUTPUT_TOKENS) } : { max_tokens: Math.min(config.maxTokens ?? maxTokens, maxTokens, MAX_MODEL_OUTPUT_TOKENS) }),
      } as OpenAI.ChatCompletionCreateParamsNonStreaming,
      { signal, timeout: config.timeoutMs },
    ),
  );

  const firstChoice = response.choices[0] as
    | {
        message?: { content?: string | null };
        text?: string | null;
      }
    | undefined;
  const chatOutput = (firstChoice?.message?.content ?? firstChoice?.text ?? "").trim();
  if (chatOutput) return chatOutput;

  try {
    const responseOutput = await withProviderAbort(config.timeoutMs, (signal) =>
      client.responses.create(
        {
          model: config.model,
          input,
          instructions,
          max_output_tokens: Math.min(config.maxTokens ?? maxTokens, maxTokens, MAX_MODEL_OUTPUT_TOKENS),
        } as never,
        { signal, timeout: config.timeoutMs },
      ),
    );
    const rawOutput = responseOutput.output_text?.trim();
    if (rawOutput) return rawOutput;
  } catch {
    // Fall through to legacy empty response path.
  }

  return "";
}

function providerSupportsMaxCompletionTokens(model: string) {
  return model.includes("nemotron");
}

async function runOpenAiResponse(config: EvaluationProviderConfig, instructions: string, input: string, maxTokens: number): Promise<string> {
  const client = new OpenAI({ apiKey: config.apiKey, timeout: config.timeoutMs });

  const response = await withProviderAbort(config.timeoutMs, (signal) =>
    client.responses.create(
      {
        model: config.model,
        instructions,
        input,
        max_output_tokens: maxTokens,
      },
      { signal, timeout: config.timeoutMs },
    ),
  );

  return response.output_text?.trim() ?? "";
}

async function runModel(config: EvaluationProviderConfig, instructions: string, input: string, maxTokens: number): Promise<string> {
  if (config.provider === "nvidia") {
    return runNvidiaCompletion(config, instructions, input, maxTokens);
  }

  return runOpenAiResponse(config, instructions, input, maxTokens);
}

function cleanJsonResponse(text: string): string {
  const stripped = text.replace(/```json|```/g, "").trim();
  const start = stripped.indexOf("{");
  if (start === -1) return stripped;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < stripped.length; index += 1) {
    const character = stripped[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return stripped.slice(start, index + 1);
    }
  }

  return stripped;
}

function repairCommonJsonSyntax(text: string): string {
  return text
    .replace(/"\s+(?="(?:evaluations|[upsdm]\d+|score|tier|feedback|action)"\s*:)/g, '", ')
    .replace(/(\d)\s+(?="(?:tier|feedback|action)"\s*:)/g, "$1, ")
    .replace(/([}\]])\s+(?="(?:[upsdm]\d+|score|tier|feedback|action)"\s*:)/g, "$1, ");
}

export async function parseEvaluationJsonResponse(text: string): Promise<OpenAiEvaluationResponse> {
  const cleaned = cleanJsonResponse(text);

  try {
    return JSON.parse(cleaned) as OpenAiEvaluationResponse;
  } catch (error) {
    const repairedSyntax = repairCommonJsonSyntax(cleaned);
    if (repairedSyntax !== cleaned) {
      try {
        return JSON.parse(repairedSyntax) as OpenAiEvaluationResponse;
      } catch {
        // Fall through to the model repair pass with the original parse error.
      }
    }

    try {
      return JSON.parse(jsonrepair(cleaned)) as OpenAiEvaluationResponse;
    } catch (repairError) {
      throw new Error(`${(error as Error).message}; local repair failed: ${(repairError as Error).message}`);
    }
  }
}

function mockEvaluateSection(questions: Question[], answers: Record<string, string>): SectionEvaluations {
  return Object.fromEntries(
    questions.map((question) => {
      const answer = answers[question.id] ?? "";
      const score = answer.trim().length < 20 ? 3 : answer.length > 120 ? 8 : 6;
      const tier = tierForScore(score);
      return [
        question.id,
        {
          score,
          tier,
          feedback:
            tier === "GREEN"
              ? "This answer is specific enough to evaluate and gives a concrete signal about the product."
              : "This answer needs sharper evidence and a more concrete product-specific detail before shipping.",
          ...(tier === "RED" ? { action: "Rewrite this with one specific user fact." } : {}),
        },
      ];
    }),
  );
}

function deterministicOverallInsight(input: {
  sectionScores: Record<SectionId, number>;
  evaluations: SectionEvaluations;
}): string {
  const redCount = Object.values(input.evaluations).filter((evaluation) => evaluation.tier === "RED").length;
  const weakestSection = (Object.entries(input.sectionScores) as [SectionId, number][]).sort(([, a], [, b]) => a - b)[0];

  if (redCount > 0) {
    return `The biggest launch risk is ${SECTIONS[weakestSection[0]].label.toLowerCase()}. Fix the ${redCount} RED item${
      redCount === 1 ? "" : "s"
    } before treating this as launch-ready.`;
  }

  return `The answers are coherent enough to ship, with ${SECTIONS[weakestSection[0]].label.toLowerCase()} as the weakest area to keep watching after launch.`;
}

export async function evaluateSection(
  sectionId: SectionId,
  questions: Question[],
  answers: Record<string, string>,
  context: ProjectContext,
): Promise<SectionEvaluations> {
  if (isMockAiEnabled()) {
    return mockEvaluateSection(questions, answers);
  }

  const providerConfigs = resolveEvaluationProviderConfigs(process.env);
  if (providerConfigs.length === 0) {
    throw new Error("A live evaluation provider is required. Set OPENAI_API_KEY or NVIDIA_API_KEY.");
  }

  const errors: Error[] = [];
  for (const config of providerConfigs) {
    const modelCandidates = config.models?.length ? config.models : [config.model];
    const instructions = evaluationInstructions(sectionId, context);
    const payload = sectionPayload(questions, answers);

    for (const model of modelCandidates) {
      try {
        const text = await runModelWithRetry({ ...config, model }, instructions, payload, SECTION_MAX_TOKENS);

        if (!text) {
          throw new Error(`${config.provider} (${model}) returned an empty evaluation response`);
        }

        const parsed = await parseEvaluationJsonResponse(text);
        return Object.fromEntries(
          questions.map((question) => [question.id, normalizeEvaluation(question, parsed.evaluations?.[question.id])]),
        );
      } catch (error) {
        errors.push(error as Error);
      }
    }
  }

  const lastError = errors[errors.length - 1];
  throw new Error(
    `Failed to evaluate section ${sectionId} after trying provider(s) ${providerConfigs
      .map((config) => config.provider)
      .join(", ")}: ${lastError ? lastError.message : "unknown error"}`,
  );
}

export async function generateOverallInsight(input: {
  context: ProjectContext;
  sectionScores: Record<SectionId, number>;
  evaluations: SectionEvaluations;
}): Promise<string> {
  const redItems = Object.entries(input.evaluations)
    .filter(([, evaluation]) => evaluation.tier === "RED")
    .map(([questionId, evaluation]) => `${questionId}: ${evaluation.feedback}`)
    .join("\n");

  if (isMockAiEnabled()) {
    return deterministicOverallInsight(input);
  }

  const providerConfigs = resolveEvaluationProviderConfigs(process.env);
  if (providerConfigs.length === 0) {
    throw new Error("A live evaluation provider is required. Set OPENAI_API_KEY or NVIDIA_API_KEY.");
  }

  for (const config of providerConfigs) {
    const modelCandidates = config.models?.length ? config.models : [config.model];
    for (const model of modelCandidates) {
      try {
        const text = await runModel(
          { ...config, model },
          "You are a product advisor. Write 2-3 direct sentences identifying the single biggest pattern across all answers. Do not repeat scores. Output plain text only.",
          JSON.stringify({
            product: input.context,
            sectionScores: input.sectionScores,
            redItems,
          }),
          INSIGHT_MAX_TOKENS,
        );

        if (text) {
          return text;
        }
      } catch (error) {
        // Try the next model in this provider, then the next provider.
      }
    }
  }

  return "The report completed, but no overall insight was returned.";
}

export function formatSse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}
