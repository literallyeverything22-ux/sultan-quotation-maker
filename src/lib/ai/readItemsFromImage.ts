// Server-side Google Gemini reader for handwritten/printed list photos and messy text.
// Follows https://aistudio.google.com/docs/get-started REST format with x-goog-api-key.

import type { QuotationItem } from "@/types/quotation";
import {
  aiItemsReplySchema,
  mapAiItemsToQuotationItems,
} from "@/lib/ai/itemSchema";
import { READ_ITEMS_SYSTEM_PROMPT } from "@/lib/ai/prompt";

export type AiReadErrorCode =
  | "MISSING_API_KEY"
  | "DAILY_LIMIT"
  | "UNCLEAR_PHOTO"
  | "BROKEN_REPLY";

export class AiReadError extends Error {
  readonly code: AiReadErrorCode;

  constructor(code: AiReadErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

interface GeminiCandidatePart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponsePayload {
  candidates?: Array<{
    content?: {
      parts?: GeminiCandidatePart[];
    };
  }>;
  error?: {
    code?: number;
    status?: string;
    message?: string;
  };
}

interface GeminiModelListPayload {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
}

const DEFAULT_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash",
] as const;

function getGeminiSettings(): { apiKey: string; candidateModels: string[] } {
  const apiKey = (process.env.GEMINI_API_KEY ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const configuredModel = (process.env.GEMINI_MODEL ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^models\//, "");

  if (!apiKey) {
    throw new AiReadError(
      "MISSING_API_KEY",
      "GEMINI_API_KEY is not set on the server yet. Add GEMINI_API_KEY in Vercel -> Settings -> Environment Variables and redeploy."
    );
  }

  const models = new Set<string>();
  if (configuredModel) models.add(configuredModel);
  for (const m of DEFAULT_FALLBACK_MODELS) models.add(m);

  return { apiKey, candidateModels: Array.from(models) };
}

function parseImageDataUrl(dataUrl: string): {
  mimeType: string;
  base64Data: string;
} {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(
    dataUrl.trim()
  );
  if (!match || !match[1] || !match[2]) {
    throw new AiReadError(
      "UNCLEAR_PHOTO",
      "Could not read this photo clearly. Try a brighter, closer photo, or type the items instead."
    );
  }
  return {
    mimeType: match[1],
    base64Data: match[2].replace(/\s+/g, ""),
  };
}

export function extractJsonFromAiText(rawText: string): unknown {
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(stripped) as unknown;
  } catch {
    const firstBrace = stripped.indexOf("{");
    const lastBrace = stripped.lastIndexOf("}");
    const firstBracket = stripped.indexOf("[");
    const lastBracket = stripped.lastIndexOf("]");

    // If an array '[' starts before '{', slice the outer array first
    if (
      firstBracket !== -1 &&
      lastBracket > firstBracket &&
      (firstBrace === -1 || firstBracket < firstBrace)
    ) {
      return JSON.parse(
        stripped.slice(firstBracket, lastBracket + 1)
      ) as unknown;
    }

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(stripped.slice(firstBrace, lastBrace + 1)) as unknown;
    }

    if (firstBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(
        stripped.slice(firstBracket, lastBracket + 1)
      ) as unknown;
    }

    throw new Error("No valid JSON found in AI reply.");
  }
}

async function discoverAvailableFlashModel(
  apiKey: string
): Promise<string | null> {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        headers: { "x-goog-api-key": apiKey },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GeminiModelListPayload;
    const found = data.models?.find(
      (m) =>
        m.name &&
        m.name.includes("flash") &&
        !m.name.includes("tts") &&
        !m.name.includes("image") &&
        m.supportedGenerationMethods?.includes("generateContent")
    );
    return found?.name ? found.name.replace(/^models\//, "") : null;
  } catch {
    return null;
  }
}

async function callGeminiModel(
  apiKey: string,
  modelName: string,
  parts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  >
): Promise<{ status: number; payload: GeminiResponsePayload | null }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: "application/json",
      },
    }),
  });

  const payload = (await res
    .json()
    .catch(() => null)) as GeminiResponsePayload | null;
  return { status: res.status, payload };
}

export async function readItemsFromImageOrText(input: {
  imageDataUrl?: string;
  messyText?: string;
}): Promise<QuotationItem[]> {
  const { apiKey, candidateModels } = getGeminiSettings();

  const userParts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [];

  if (input.imageDataUrl) {
    const { mimeType, base64Data } = parseImageDataUrl(input.imageDataUrl);
    userParts.push({
      text: `${READ_ITEMS_SYSTEM_PROMPT}\n\nRead every sports item, quantity, and unit price from this image and return the JSON object.`,
    });
    userParts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64Data,
      },
    });
  } else if (input.messyText?.trim()) {
    userParts.push({
      text: `${READ_ITEMS_SYSTEM_PROMPT}\n\nRead every sports item, quantity, and unit price from this text list and return the JSON object:\n\n${input.messyText.trim()}`,
    });
  } else {
    throw new AiReadError(
      "UNCLEAR_PHOTO",
      "Could not read this photo clearly. Try a brighter, closer photo, or type the items instead."
    );
  }

  let lastPayload: GeminiResponsePayload | null = null;
  let lastStatus = 500;

  const modelsToTry = [...candidateModels];
  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i]!;
    try {
      const { status, payload } = await callGeminiModel(
        apiKey,
        modelName,
        userParts
      );
      lastStatus = status;
      lastPayload = payload;

      if (status >= 200 && status < 300 && payload?.candidates?.length) {
        break;
      }

      // If API key itself is invalid, stop immediately and tell the user
      const errMessage = payload?.error?.message ?? "";
      if (
        status === 400 &&
        (errMessage.toLowerCase().includes("api key") ||
          payload?.error?.status === "INVALID_ARGUMENT")
      ) {
        if (errMessage.toLowerCase().includes("api key")) {
          throw new AiReadError(
            "MISSING_API_KEY",
            "The GEMINI_API_KEY on the server is invalid. Please check your key in Google AI Studio and Vercel."
          );
        }
      }

      // If 404 (model name retired/not found) on the last static candidate, auto-discover from /v1beta/models
      if (status === 404 && i === modelsToTry.length - 1) {
        const discovered = await discoverAvailableFlashModel(apiKey);
        if (discovered && !modelsToTry.includes(discovered)) {
          modelsToTry.push(discovered);
        }
      }
    } catch (err) {
      if (err instanceof AiReadError) throw err;
    }
  }

  if (
    lastStatus === 429 ||
    lastPayload?.error?.status === "RESOURCE_EXHAUSTED"
  ) {
    throw new AiReadError(
      "DAILY_LIMIT",
      "Photo reading is used up for today. Please type or paste the items."
    );
  }

  // Filter out thinking parts (thought: true) returned by Gemini 2.5 thinking models
  const answerParts =
    lastPayload?.candidates?.[0]?.content?.parts?.filter(
      (p) => !p.thought && typeof p.text === "string" && p.text.trim().length > 0
    ) ?? [];

  const rawText = answerParts.map((p) => p.text ?? "").join("\n").trim();
  if (!rawText) {
    throw new AiReadError(
      "UNCLEAR_PHOTO",
      "Could not read this photo clearly. Try a brighter, closer photo, or type the items instead."
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = extractJsonFromAiText(rawText);
  } catch {
    throw new AiReadError(
      "BROKEN_REPLY",
      "Something went wrong reading the photo. Please try again."
    );
  }

  const validated = aiItemsReplySchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new AiReadError(
      "UNCLEAR_PHOTO",
      "Could not read this photo clearly. Try a brighter, closer photo, or type the items instead."
    );
  }

  return mapAiItemsToQuotationItems(validated.data.items);
}
