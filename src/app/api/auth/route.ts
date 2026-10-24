import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiResponse } from "@/types/quotation";
import {
  clearPinAttempts,
  getLockoutStatus,
  recordFailedPinAttempt,
  verifyPinAgainstHashes,
  type SessionRole,
} from "@/lib/auth/pin";
import {
  createAttemptToken,
  createSessionToken,
  getAttemptCookieOptions,
  getSessionCookieOptions,
  getSessionFromCookies,
  PIN_ATTEMPTS_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyAttemptToken,
} from "@/lib/auth/session";

export async function GET(): Promise<
  NextResponse<ApiResponse<{ role: SessionRole }>>
> {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNAUTHORIZED",
        message: "Please enter the PIN first.",
      },
      { status: 401 }
    );
  }
  return NextResponse.json({
    ok: true,
    data: { role: session.role },
  });
}

const authRequestSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "Please enter a 4-digit PIN."),
  mode: z.enum(["staff", "owner"]).default("staff"),
});

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get("x-real-ip") ?? "default-client";
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ role: SessionRole }>>> {
  try {
    const rawBody: unknown = await request.json().catch(() => null);
    const parsed = authRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_INPUT",
          message: "Please enter a 4-digit PIN.",
        },
        { status: 400 }
      );
    }

    const { pin, mode } = parsed.data;
    const clientKey = getClientKey(request);

    const cookieStore = await cookies();
    const existingAttemptToken = cookieStore.get(
      PIN_ATTEMPTS_COOKIE_NAME
    )?.value;
    const cookieAttemptState = existingAttemptToken
      ? await verifyAttemptToken(existingAttemptToken)
      : null;

    // 1. Check if temporarily locked after 5 wrong tries
    const lockStatus = getLockoutStatus(clientKey, cookieAttemptState);
    if (lockStatus.locked) {
      const minutesLeft = Math.max(
        1,
        Math.ceil(lockStatus.remainingSeconds / 60)
      );
      return NextResponse.json(
        {
          ok: false,
          code: "LOCKED",
          message: `Too many wrong tries. Temporary lock for ${minutesLeft} ${
            minutesLeft === 1 ? "minute" : "minutes"
          }.`,
        },
        { status: 429 }
      );
    }

    // 2. Check PIN against server hashes
    const check = await verifyPinAgainstHashes(pin, mode);

    if (!check.valid) {
      if (check.reason === "not_configured") {
        return NextResponse.json(
          {
            ok: false,
            code: "PIN_NOT_CONFIGURED",
            message:
              "PIN is not set up on the server yet. Please add STAFF_PIN_HASH and OWNER_PIN_HASH.",
          },
          { status: 500 }
        );
      }

      const failed = recordFailedPinAttempt(clientKey, lockStatus.state);
      const response = NextResponse.json<ApiResponse<{ role: SessionRole }>>(
        {
          ok: false,
          code: failed.locked ? "LOCKED" : "WRONG_PIN",
          message: failed.locked
            ? "Too many wrong tries. Temporary lock for 5 minutes."
            : mode === "owner"
              ? "Wrong Owner PIN. Please try again."
              : "Wrong PIN. Please try again.",
        },
        { status: failed.locked ? 429 : 401 }
      );

      try {
        const attemptToken = await createAttemptToken(failed.state);
        response.cookies.set(
          PIN_ATTEMPTS_COOKIE_NAME,
          attemptToken,
          getAttemptCookieOptions()
        );
      } catch {
        // Ignore cookie signing error if SESSION_SECRET is missing; memory lock still applies
      }

      return response;
    }

    // 3. Valid PIN: start session and clear failed attempt counter
    clearPinAttempts(clientKey);
    const sessionToken = await createSessionToken(check.role);

    const response = NextResponse.json<ApiResponse<{ role: SessionRole }>>({
      ok: true,
      data: { role: check.role },
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions()
    );
    response.cookies.delete(PIN_ATTEMPTS_COOKIE_NAME);

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        message: "Something went wrong. Try again.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponse<null>>> {
  const response = NextResponse.json<ApiResponse<null>>({
    ok: true,
    data: null,
  });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
