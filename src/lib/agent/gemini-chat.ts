import { AGENT_FUNCTION_DECLARATIONS } from "./definitions";
import { getGeminiConfig } from "./gemini";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
] as const;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

type GeminiContent = {
  role?: string;
  parts: GeminiPart[];
};

function formatGeminiError(status: number, message: string): string {
  if (status === 429 || message.toLowerCase().includes("quota")) {
    return `Gemini API quota exceeded. Enable billing in Google AI Studio or wait and retry.`;
  }
  if (status === 401 || status === 403 || message.toLowerCase().includes("api key")) {
    return `Gemini API key rejected. Check GEMINI_API_KEY in your environment.`;
  }
  return message || `Gemini API error (${status})`;
}

function modelCandidates(): string[] {
  const { model } = getGeminiConfig();
  return [...new Set([model, ...FALLBACK_MODELS])];
}

function toGeminiContents(history: ChatTurn[]): GeminiContent[] {
  return history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));
}

interface GenerateResult {
  text?: string;
  functionCalls: { name: string; args: Record<string, unknown> }[];
}

async function generateOnce(
  apiKey: string,
  model: string,
  systemInstruction: string,
  contents: GeminiContent[]
): Promise<GenerateResult> {
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
        contents,
        tools: [{ functionDeclarations: AGENT_FUNCTION_DECLARATIONS }],
        toolConfig: { functionCallingConfig: { mode: "AUTO" } },
        generationConfig: { temperature: 0.4 },
      }),
    }
  );

  const data = (await res.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: GeminiPart[] } }[];
  };

  if (!res.ok) {
    const err = new Error(formatGeminiError(res.status, data.error?.message ?? "")) as Error & {
      status?: number;
      model?: string;
    };
    err.status = res.status;
    err.model = model;
    throw err;
  }

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const functionCalls: GenerateResult["functionCalls"] = [];
  let text = "";

  for (const part of parts) {
    if ("text" in part && part.text) {
      text += part.text;
    }
    if ("functionCall" in part && part.functionCall) {
      functionCalls.push({
        name: part.functionCall.name,
        args: (part.functionCall.args ?? {}) as Record<string, unknown>,
      });
    }
  }

  return { text: text.trim() || undefined, functionCalls };
}

export async function runGeminiChatLoop(
  systemInstruction: string,
  history: ChatTurn[],
  contentsExtra: GeminiContent[] = []
): Promise<GenerateResult> {
  const { apiKey } = getGeminiConfig();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const contents: GeminiContent[] = [...toGeminiContents(history), ...contentsExtra];
  const failures: (Error & { status?: number; model?: string })[] = [];

  for (const model of modelCandidates()) {
    try {
      return await generateOnce(apiKey, model, systemInstruction, contents);
    } catch (error) {
      const err = error as Error & { status?: number; model?: string };
      failures.push(err);
      if (err.status === 404 || err.status === 429) continue;
      throw err;
    }
  }

  throw failures[failures.length - 1] ?? new Error("Gemini API request failed");
}

export function buildFunctionResponseContent(
  name: string,
  response: Record<string, unknown>
): GeminiContent {
  return {
    role: "user",
    parts: [{ functionResponse: { name, response } }],
  };
}

export function buildModelFunctionCallContent(
  name: string,
  args: Record<string, unknown>
): GeminiContent {
  return {
    role: "model",
    parts: [{ functionCall: { name, args } }],
  };
}
