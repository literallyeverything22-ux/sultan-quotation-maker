// Server-side Google Gemini reader for handwritten/printed list photos and messy text.
// Only sends the list image or item lines — never buyer, bank, or signature details.

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

function getGeminiSettings(): { apiKey: string; modelName: string } {
  const apiKey = (process.env.GEMINI_API_KEY ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const modelName =
    (process.env.GEMINI_MODEL ?? "")
      .trim()
      .replace(/^['"]|['"]$/g, "") || "gemini-2.5-flash";

  if (!apiKey) {
    throw new AiReadError(
      "MISSING_API_KEY",
      "Photo reading needs a Gemini API key in server settings. Please use Paste or Type for now."
    );
  }

  return { apiKey, modelName };
}

function parseImageDataUrl(dataUrl: string): {
  mimeType: string;
  base64Data: string;
} {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(
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
    base64Data: match[2].trim(),
  };
}

function extractJsonText(rawText: string): unknown {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as unknown;
}

export async function readItemsFromImageOrText(input: {
  imageDataUrl?: string;
  messyText?: string;
}): Promise<QuotationItem[]> {
  const { apiKey, modelName } = getGeminiSettings();

  const userParts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [];

  if (input.imageDataUrl) {
    const { mimeType, base64Data } = parseImageDataUrl(input.imageDataUrl);
    userParts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64Data,
      },
    });
    userParts.push({
      text: "Read every sports item, quantity, and unit price from this list image and return the JSON object.",
    });
  } else if (input.messyText?.trim()) {
    userParts.push({
      text: `Read every sports item, quantity, and unit price from this text list and return the JSON object:\n\n${input.messyText.trim()}`,
    });
  } else {
    throw new AiReadError(
      "UNCLEAR_PHOTO",
      "Could not read this photo clearly. Try a brighter, closer photo, or type the items instead."
    );
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: READ_ITEMS_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: userParts,
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch {
    throw new AiReadError(
      "BROKEN_REPLY",
      "Something went wrong reading the photo. Please try again."
    );
  }

  if (res.status === 429) {
    throw new AiReadError(
      "DAILY_LIMIT",
      "Photo reading is used up for today. Please type or paste the items."
    );
  }

  const payload = (await res
    .json()
    .catch(() => null)) as GeminiResponsePayload | null;

  if (!res.ok || !payload) {
    const statusText = payload?.error?.status ?? "";
    if (statusText === "RESOURCE_EXHAUSTED") {
      throw new AiReadError(
        "DAILY_LIMIT",
        "Photo reading is used up for today. Please type or paste the items."
      );
    }
    throw new AiReadError(
      "BROKEN_REPLY",
      "Something went wrong reading the photo. Please try again."
    );
  }

  const rawText =
    payload.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";

  if (!rawText) {
    throw new AiReadError(
      "UNCLEAR_PHOTO",
      "Could not read this photo clearly. Try a brighter, closer photo, or type the items instead."
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = extractJsonText(rawText);
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
