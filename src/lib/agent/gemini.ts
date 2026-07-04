/** Current Gemini models (2.0 family shut down June 2026 — see Google release notes). */
const DEFAULT_MODEL = "gemini-2.5-flash";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
] as const;

export function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const enabled = process.env.AGENT_ENABLED !== "false";
  return { apiKey, model, enabled, configured: Boolean(apiKey) };
}

function modelCandidates(): string[] {
  const { model } = getGeminiConfig();
  return [...new Set([model, ...FALLBACK_MODELS])];
}

function formatGeminiError(status: number, message: string): string {
  if (status === 429 || message.toLowerCase().includes("quota")) {
    return `Gemini API quota exceeded. Enable billing in Google AI Studio (https://aistudio.google.com/apikey) or wait and retry. Details: ${message}`;
  }
  if (status === 401 || status === 403 || message.toLowerCase().includes("api key")) {
    return `Gemini API key rejected. Create a new key at https://aistudio.google.com/apikey and set GEMINI_API_KEY. Details: ${message}`;
  }
  if (status === 404 || message.toLowerCase().includes("not found")) {
    return `Gemini model unavailable. Set GEMINI_MODEL to a current model (e.g. gemini-2.5-flash or gemini-3.5-flash). Details: ${message}`;
  }
  return message || `Gemini API error (${status})`;
}

type GeminiCallError = Error & { status?: number; model?: string };

async function callGeminiModel(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstruction: string
) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const data = (await res.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  if (!res.ok) {
    const err = new Error(formatGeminiError(res.status, data.error?.message ?? "")) as GeminiCallError;
    err.status = res.status;
    err.model = model;
    throw err;
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

function pickBestFailure(failures: GeminiCallError[]): Error {
  const quota = failures.find((e) => e.status === 429);
  if (quota) return quota;
  const auth = failures.find((e) => e.status === 401 || e.status === 403);
  if (auth) return auth;
  const notFound = failures.find((e) => e.status === 404);
  if (notFound) {
    return new Error(
      `No supported Gemini model worked. Tried: ${failures.map((f) => f.model).filter(Boolean).join(", ")}. Set GEMINI_MODEL=gemini-2.5-flash in your environment and confirm your API key at https://aistudio.google.com/apikey`
    );
  }
  return failures[failures.length - 1] ?? new Error("Gemini API request failed");
}

export async function generateGeminiJson<T>(prompt: string, systemInstruction: string): Promise<T> {
  const { apiKey } = getGeminiConfig();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const models = modelCandidates();
  const failures: GeminiCallError[] = [];

  for (const model of models) {
    try {
      const text = await callGeminiModel(apiKey, model, prompt, systemInstruction);
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error("Gemini returned invalid JSON");
      }
    } catch (error) {
      const err = error as GeminiCallError;
      failures.push(err);
      const status = err.status;
      if (status === 404 || status === 429) {
        continue;
      }
      throw err;
    }
  }

  throw pickBestFailure(failures);
}
