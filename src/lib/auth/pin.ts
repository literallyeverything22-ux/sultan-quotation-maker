import bcrypt from "bcryptjs";

export type SessionRole = "staff" | "owner";

export const MAX_WRONG_PIN_TRIES = 5;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes temporary lock

export interface PinAttemptState {
  failedCount: number;
  lockedUntilMs: number | null;
}

const attemptsByClient = new Map<string, PinAttemptState>();

/**
 * Checks whether a client is currently locked out after 5 wrong tries.
 */
export function getLockoutStatus(
  clientKey: string,
  cookieState?: PinAttemptState | null,
  nowMs: number = Date.now()
): { locked: boolean; remainingSeconds: number; state: PinAttemptState } {
  const memoryState = attemptsByClient.get(clientKey) ?? {
    failedCount: 0,
    lockedUntilMs: null,
  };

  // Merge memory state and signed cookie state so serverless restarts cannot bypass the lock
  const mergedFailedCount = Math.max(
    memoryState.failedCount,
    cookieState?.failedCount ?? 0
  );
  const mergedLockedUntil = Math.max(
    memoryState.lockedUntilMs ?? 0,
    cookieState?.lockedUntilMs ?? 0
  );

  if (mergedLockedUntil > nowMs) {
    const remainingSeconds = Math.ceil((mergedLockedUntil - nowMs) / 1000);
    const activeState: PinAttemptState = {
      failedCount: mergedFailedCount,
      lockedUntilMs: mergedLockedUntil,
    };
    attemptsByClient.set(clientKey, activeState);
    return { locked: true, remainingSeconds, state: activeState };
  }

  // If a previous lock has expired, reset the counter cleanly
  if (mergedLockedUntil > 0 && mergedLockedUntil <= nowMs) {
    const resetState: PinAttemptState = { failedCount: 0, lockedUntilMs: null };
    attemptsByClient.set(clientKey, resetState);
    return { locked: false, remainingSeconds: 0, state: resetState };
  }

  const currentState: PinAttemptState = {
    failedCount: mergedFailedCount,
    lockedUntilMs: null,
  };
  return { locked: false, remainingSeconds: 0, state: currentState };
}

/**
 * Records a wrong PIN try and triggers a temporary lock on the 5th wrong try.
 */
export function recordFailedPinAttempt(
  clientKey: string,
  previousState: PinAttemptState,
  nowMs: number = Date.now()
): { locked: boolean; attemptsLeft: number; state: PinAttemptState } {
  const nextCount = previousState.failedCount + 1;
  if (nextCount >= MAX_WRONG_PIN_TRIES) {
    const lockedState: PinAttemptState = {
      failedCount: nextCount,
      lockedUntilMs: nowMs + LOCKOUT_DURATION_MS,
    };
    attemptsByClient.set(clientKey, lockedState);
    return { locked: true, attemptsLeft: 0, state: lockedState };
  }

  const nextState: PinAttemptState = {
    failedCount: nextCount,
    lockedUntilMs: null,
  };
  attemptsByClient.set(clientKey, nextState);
  return {
    locked: false,
    attemptsLeft: MAX_WRONG_PIN_TRIES - nextCount,
    state: nextState,
  };
}

/**
 * Clears failed PIN attempts after a valid PIN is entered.
 */
export function clearPinAttempts(clientKey: string): void {
  attemptsByClient.delete(clientKey);
}

/**
 * Compares the entered PIN against hashed PINs stored in server settings.
 * Never logs or prints the PIN or hashes.
 */
export async function verifyPinAgainstHashes(
  pin: string,
  mode: "staff" | "owner",
  hashes?: { staffPinHash?: string; ownerPinHash?: string }
): Promise<
  | { valid: true; role: SessionRole }
  | { valid: false; reason: "not_configured" | "wrong_pin" }
> {
  // Normalize hashes in case environment variable escaping modified '$' characters
  const rawStaffHash = (
    hashes?.staffPinHash ??
    process.env.STAFF_PIN_HASH ??
    ""
  )
    .trim()
    .replace(/\\\$/g, "$");
  const rawOwnerHash = (
    hashes?.ownerPinHash ??
    process.env.OWNER_PIN_HASH ??
    ""
  )
    .trim()
    .replace(/\\\$/g, "$");

  if (mode === "owner") {
    if (!rawOwnerHash) {
      return { valid: false, reason: "not_configured" };
    }
    const isOwner = await bcrypt.compare(pin, rawOwnerHash);
    return isOwner
      ? { valid: true, role: "owner" }
      : { valid: false, reason: "wrong_pin" };
  }

  // Staff mode: accept either the staff PIN (grants "staff") or the owner PIN (grants "owner")
  if (!rawStaffHash && !rawOwnerHash) {
    return { valid: false, reason: "not_configured" };
  }

  if (rawOwnerHash) {
    const isOwner = await bcrypt.compare(pin, rawOwnerHash);
    if (isOwner) {
      return { valid: true, role: "owner" };
    }
  }

  if (rawStaffHash) {
    const isStaff = await bcrypt.compare(pin, rawStaffHash);
    if (isStaff) {
      return { valid: true, role: "staff" };
    }
  }

  return { valid: false, reason: "wrong_pin" };
}
