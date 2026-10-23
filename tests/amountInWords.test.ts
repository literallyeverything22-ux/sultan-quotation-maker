import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  clearPinAttempts,
  getLockoutStatus,
  LOCKOUT_DURATION_MS,
  recordFailedPinAttempt,
  verifyPinAgainstHashes,
} from "@/lib/auth/pin";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

describe("Phase 1 PIN & Session Security", () => {
  const staffHash = bcrypt.hashSync("1234", 4);
  const ownerHash = bcrypt.hashSync("9999", 4);
  const testSecret = "test-session-secret-for-unit-tests-only";

  it("accepts the right staff PIN and refuses a wrong PIN", async () => {
    const okResult = await verifyPinAgainstHashes("1234", "staff", {
      staffPinHash: staffHash,
      ownerPinHash: ownerHash,
    });
    expect(okResult).toEqual({ valid: true, role: "staff" });

    const badResult = await verifyPinAgainstHashes("0000", "staff", {
      staffPinHash: staffHash,
      ownerPinHash: ownerHash,
    });
    expect(badResult).toEqual({ valid: false, reason: "wrong_pin" });
  });

  it("refuses the staff PIN for owner settings, and accepts the owner PIN", async () => {
    const staffTryOnOwner = await verifyPinAgainstHashes("1234", "owner", {
      staffPinHash: staffHash,
      ownerPinHash: ownerHash,
    });
    expect(staffTryOnOwner).toEqual({ valid: false, reason: "wrong_pin" });

    const ownerTryOnOwner = await verifyPinAgainstHashes("9999", "owner", {
      staffPinHash: staffHash,
      ownerPinHash: ownerHash,
    });
    expect(ownerTryOnOwner).toEqual({ valid: true, role: "owner" });
  });

  it("locks temporarily after 5 wrong tries and unlocks after 5 minutes", () => {
    const client = "test-phone-ip";
    clearPinAttempts(client);

    const startTime = 1_000_000;
    let state = getLockoutStatus(client, null, startTime).state;

    for (let i = 1; i <= 4; i++) {
      const res = recordFailedPinAttempt(client, state, startTime);
      expect(res.locked).toBe(false);
      state = res.state;
    }

    // 5th wrong try triggers lock
    const fifth = recordFailedPinAttempt(client, state, startTime);
    expect(fifth.locked).toBe(true);

    const duringLock = getLockoutStatus(
      client,
      fifth.state,
      startTime + 60_000
    );
    expect(duringLock.locked).toBe(true);

    // After 5 minutes, lock expires
    const afterLock = getLockoutStatus(
      client,
      fifth.state,
      startTime + LOCKOUT_DURATION_MS + 1000
    );
    expect(afterLock.locked).toBe(false);
    clearPinAttempts(client);
  });

  it("creates and verifies signed session tokens", async () => {
    const staffToken = await createSessionToken("staff", testSecret);
    const verifiedStaff = await verifySessionToken(staffToken, testSecret);
    expect(verifiedStaff).toEqual({ role: "staff" });

    const tampered = await verifySessionToken(staffToken + "x", testSecret);
    expect(tampered).toBeNull();
  });
});
