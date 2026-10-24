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
import { cleanSignaturePixels } from "@/lib/image/shrinkPhoto";
import { amountInWords, rupeesInWords } from "@/lib/money/amountInWords";
import {
  calculateGrandTotalPaise,
  calculateItemAmountPaise,
  formatMoney,
  formatMoneyWithRs,
  rupeesToPaise,
} from "@/lib/money/formatMoney";

describe("Phase 1 & 2 Security and Image Helpers", () => {
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

    const fifth = recordFailedPinAttempt(client, state, startTime);
    expect(fifth.locked).toBe(true);

    const duringLock = getLockoutStatus(
      client,
      fifth.state,
      startTime + 60_000
    );
    expect(duringLock.locked).toBe(true);

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

  it("removes paper background while keeping signature and stamp ink", () => {
    const pixels = new Uint8ClampedArray([
      245, 245, 242, 255,
      20, 60, 180, 255,
    ]);

    cleanSignaturePixels(pixels, 205);

    expect(pixels[3]).toBe(0);
    expect(pixels[7]).toBe(255);
  });
});

describe("Phase 3: formatMoney and integer paise calculations", () => {
  it("formats whole paise in Indian style with two decimals", () => {
    expect(formatMoney(0)).toBe("0.00");
    expect(formatMoney(75000)).toBe("750.00");
    expect(formatMoney(170000)).toBe("1,700.00");
    expect(formatMoney(421000)).toBe("4,210.00");
    expect(formatMoney(12345678)).toBe("1,23,456.78");
    expect(formatMoney(1000000000)).toBe("1,00,00,000.00");
  });

  it("uses Rs. prefix and never the rupee symbol", () => {
    const formatted = formatMoneyWithRs(421000);
    expect(formatted).toBe("Rs. 4,210.00");
    expect(formatted.includes("₹")).toBe(false);
  });

  it("parses rupee strings to integer paise and calculates totals accurately", () => {
    expect(rupeesToPaise("750")).toBe(75000);
    expect(rupeesToPaise("1,700.50")).toBe(170050);
    expect(rupeesToPaise("Rs. 4,210")).toBe(421000);
    expect(rupeesToPaise("abc")).toBeNull();

    expect(calculateItemAmountPaise(2, 55000)).toBe(110000);
    expect(calculateItemAmountPaise(1, null)).toBe(0);

    const total = calculateGrandTotalPaise([
      { quantity: 1, unitPricePaise: 75000 },
      { quantity: 1, unitPricePaise: 26000 },
      { quantity: 2, unitPricePaise: 55000 },
    ]);
    expect(total).toBe(211000);
  });
});

describe("Phase 3: amountInWords (Indian system)", () => {
  it("converts 4210 to 'Rupees Four Thousand Two Hundred Ten Only'", () => {
    expect(amountInWords(421000)).toBe(
      "Rupees Four Thousand Two Hundred Ten Only"
    );
    expect(rupeesInWords(4210)).toBe(
      "Rupees Four Thousand Two Hundred Ten Only"
    );
  });

  it("handles zero and small numbers", () => {
    expect(amountInWords(0)).toBe("Rupees Zero Only");
    expect(amountInWords(500)).toBe("Rupees Five Only");
    expect(amountInWords(1900)).toBe("Rupees Nineteen Only");
    expect(amountInWords(8500)).toBe("Rupees Eighty Five Only");
    expect(amountInWords(30000)).toBe("Rupees Three Hundred Only");
  });

  it("handles thousands, lakhs, and crores in the Indian system", () => {
    expect(amountInWords(170000)).toBe(
      "Rupees One Thousand Seven Hundred Only"
    );
    expect(amountInWords(4567800)).toBe(
      "Rupees Forty Five Thousand Six Hundred Seventy Eight Only"
    );
    expect(amountInWords(12500000)).toBe(
      "Rupees One Lakh Twenty Five Thousand Only"
    );
    expect(amountInWords(254032000)).toBe(
      "Rupees Twenty Five Lakh Forty Thousand Three Hundred Twenty Only"
    );
    expect(amountInWords(1000000000)).toBe("Rupees One Crore Only");
    expect(amountInWords(3050240000)).toBe(
      "Rupees Three Crore Five Lakh Two Thousand Four Hundred Only"
    );
  });

  it("handles paise accurately and always ends with Only", () => {
    expect(amountInWords(421050)).toBe(
      "Rupees Four Thousand Two Hundred Ten and Fifty Paise Only"
    );
    expect(amountInWords(75)).toBe("Rupees Zero and Seventy Five Paise Only");
  });
});
