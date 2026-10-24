import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/quotation";
import type { PinAttemptState, SessionRole } from "@/lib/auth/pin";

export const SESSION_COOKIE_NAME = "sultan_session";
export const PIN_ATTEMPTS_COOKIE_NAME = "sultan_pin_tries";

const SESSION_DURATION_SECONDS = 14 * 24 * 60 * 60; // 14 days
const ATTEMPT_COOKIE_SECONDS = 15 * 60; // 15 minutes

function getSecretBytes(customSecret?: string): Uint8Array {
  const secret = (customSecret ?? process.env.SESSION_SECRET ?? "").trim();
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured on the server.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Creates a signed session token for either "staff" or "owner".
 */
export async function createSessionToken(
  role: SessionRole,
  customSecret?: string
): Promise<string> {
  const secretBytes = getSecretBytes(customSecret);
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretBytes);
}

/**
 * Verifies a signed session token and returns the session role, or null if invalid/expired.
 */
export async function verifySessionToken(
  token: string,
  customSecret?: string
): Promise<{ role: SessionRole } | null> {
  try {
    const secretBytes = getSecretBytes(customSecret);
    const { payload } = await jwtVerify(token, secretBytes);
    if (payload.role === "staff" || payload.role === "owner") {
      return { role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Signs the failed PIN attempt state into a tamper-proof token so serverless instances
 * remember wrong tries and temporary locks across requests.
 */
export async function createAttemptToken(
  state: PinAttemptState,
  customSecret?: string
): Promise<string> {
  const secretBytes = getSecretBytes(customSecret);
  return new SignJWT({
    failedCount: state.failedCount,
    lockedUntilMs: state.lockedUntilMs,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ATTEMPT_COOKIE_SECONDS}s`)
    .sign(secretBytes);
}

export async function verifyAttemptToken(
  token: string,
  customSecret?: string
): Promise<PinAttemptState | null> {
  try {
    const secretBytes = getSecretBytes(customSecret);
    const { payload } = await jwtVerify(token, secretBytes);
    const failedCount =
      typeof payload.failedCount === "number" ? payload.failedCount : 0;
    const lockedUntilMs =
      typeof payload.lockedUntilMs === "number" ? payload.lockedUntilMs : null;
    return { failedCount, lockedUntilMs };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function getAttemptCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ATTEMPT_COOKIE_SECONDS,
  };
}

/**
 * Reads and verifies the current session from the incoming request cookies.
 */
export async function getSessionFromCookies(): Promise<{
  role: SessionRole;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Protects a page screen.
 * - Staff screens require either a "staff" or "owner" session.
 * - Owner screens (/settings) require an "owner" session.
 */
export async function requirePageSession(
  requiredRole: SessionRole,
  currentPath: string
): Promise<{ role: SessionRole }> {
  const session = await getSessionFromCookies();

  if (!session) {
    const modeParam = requiredRole === "owner" ? "mode=owner&" : "";
    redirect(`/pin?${modeParam}next=${encodeURIComponent(currentPath)}`);
  }

  if (requiredRole === "owner" && session.role !== "owner") {
    redirect(`/pin?mode=owner&next=${encodeURIComponent(currentPath)}`);
  }

  return session;
}

/**
 * Protects a server API route.
 * Returns { ok: true, role } when allowed, or a 401/403 NextResponse when refused.
 */
export async function requireApiSession<T = null>(
  requiredRole: SessionRole
): Promise<
  | { allowed: true; role: SessionRole }
  | { allowed: false; response: NextResponse<ApiResponse<T>> }
> {
  const session = await getSessionFromCookies();

  if (!session) {
    return {
      allowed: false,
      response: NextResponse.json<ApiResponse<T>>(
        {
          ok: false,
          code: "UNAUTHORIZED",
          message: "Please enter the PIN first.",
        },
        { status: 401 }
      ),
    };
  }

  if (requiredRole === "owner" && session.role !== "owner") {
    return {
      allowed: false,
      response: NextResponse.json<ApiResponse<T>>(
        {
          ok: false,
          code: "FORBIDDEN",
          message: "Only the owner can access business settings.",
        },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, role: session.role };
}
