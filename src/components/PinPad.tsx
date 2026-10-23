"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse } from "@/types/quotation";

const PIN_LENGTH = 4;

interface PinPadProps {
  mode?: "staff" | "owner";
  redirectTo?: string;
}

interface AuthResult {
  role: "staff" | "owner";
}

export function PinPad({ mode = "staff", redirectTo = "/" }: PinPadProps) {
  const router = useRouter();
  const [digits, setDigits] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);

  const triggerError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setShakeKey((prev) => prev + 1);
    setDigits("");
  }, []);

  const submitPin = useCallback(
    async (pinValue: string) => {
      setIsChecking(true);
      setErrorMessage(null);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: pinValue, mode }),
        });
        const payload = (await res.json()) as ApiResponse<AuthResult>;

        if (!payload.ok) {
          triggerError(payload.message);
          setIsChecking(false);
          return;
        }

        router.replace(redirectTo);
        router.refresh();
      } catch {
        triggerError("Something went wrong. Try again.");
        setIsChecking(false);
      }
    },
    [mode, redirectTo, router, triggerError]
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (isChecking) return;
      setErrorMessage(null);
      setDigits((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + digit;
        if (next.length === PIN_LENGTH) {
          void submitPin(next);
        }
        return next;
      });
    },
    [isChecking, submitPin]
  );

  const handleBackspace = useCallback(() => {
    if (isChecking) return;
    setErrorMessage(null);
    setDigits((prev) => prev.slice(0, -1));
  }, [isChecking]);

  const handleClear = useCallback(() => {
    if (isChecking) return;
    setErrorMessage(null);
    setDigits("");
  }, [isChecking]);

  // Allow typing digits on a physical keyboard when opened on a computer
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key >= "0" && event.key <= "9") {
        handleDigitPress(event.key);
      } else if (event.key === "Backspace") {
        handleBackspace();
      } else if (event.key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleBackspace, handleClear, handleDigitPress]);

  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ] as const;

  return (
    <div className="flex flex-1 flex-col items-center justify-between rounded-2xl bg-sultan-black px-4 py-6 text-sultan-white">
      <div className="flex w-full flex-col items-center space-y-2 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
          {mode === "owner" ? "OWNER SETTINGS ACCESS" : "STAFF & OWNER ACCESS"}
        </span>
        <h1 className="text-2xl font-bold italic text-sultan-white">
          {mode === "owner" ? "Enter Owner PIN" : "Enter 4-Digit PIN"}
        </h1>
        <p className="text-sm text-sultan-headerGrey">
          {mode === "owner"
            ? "Owner PIN is required to open Business Settings."
            : "Enter the 4-digit PIN to open the quotation maker."}
        </p>

        {/* Orange PIN indicator dots */}
        <div
          key={shakeKey}
          aria-label={`${digits.length} of ${PIN_LENGTH} digits entered`}
          className={`flex items-center justify-center gap-4 pt-4 ${
            shakeKey > 0 ? "animate-pin-shake" : ""
          }`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const filled = index < digits.length;
            return (
              <span
                key={index}
                className={`h-4 w-4 rounded-full border-2 transition-colors ${
                  filled
                    ? "border-sultan-orange bg-sultan-orange"
                    : "border-sultan-cardDivider bg-transparent"
                }`}
              />
            );
          })}
        </div>

        {/* Fixed height area for error or checking status so keypad does not jump */}
        <div className="flex min-h-[36px] items-center justify-center pt-1">
          {errorMessage ? (
            <p
              role="alert"
              className="text-sm font-bold text-sultan-errorRed"
            >
              {errorMessage}
            </p>
          ) : isChecking ? (
            <p className="text-sm font-bold text-sultan-orange">
              Checking PIN...
            </p>
          ) : null}
        </div>
      </div>

      {/* Large round number pad keys (72px x 72px, well above 44px minimum) */}
      <div className="grid w-full max-w-[280px] grid-cols-3 place-items-center gap-4 py-2">
        {keypadRows.flat().map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={isChecking}
            onClick={() => handleDigitPress(digit)}
            className="flex h-[72px] w-[72px] select-none items-center justify-center rounded-full border border-sultan-cardDivider bg-sultan-headerRing text-2xl font-bold text-sultan-white active:border-sultan-orange active:bg-sultan-orange active:text-sultan-black disabled:opacity-50"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          disabled={isChecking || digits.length === 0}
          onClick={handleClear}
          className="flex h-[72px] w-[72px] select-none items-center justify-center rounded-full border border-sultan-cardDivider bg-transparent text-xs font-bold uppercase tracking-wider text-sultan-headerGrey active:border-sultan-orange active:text-sultan-white disabled:opacity-40"
        >
          Clear
        </button>

        <button
          type="button"
          disabled={isChecking}
          onClick={() => handleDigitPress("0")}
          className="flex h-[72px] w-[72px] select-none items-center justify-center rounded-full border border-sultan-cardDivider bg-sultan-headerRing text-2xl font-bold text-sultan-white active:border-sultan-orange active:bg-sultan-orange active:text-sultan-black disabled:opacity-50"
        >
          0
        </button>

        <button
          type="button"
          aria-label="Delete last digit"
          disabled={isChecking || digits.length === 0}
          onClick={handleBackspace}
          className="flex h-[72px] w-[72px] select-none items-center justify-center rounded-full border border-sultan-cardDivider bg-transparent text-lg font-bold text-sultan-headerGrey active:border-sultan-orange active:text-sultan-white disabled:opacity-40"
        >
          Del
        </button>
      </div>

      <div className="w-full pt-2 text-center">
        {mode === "owner" ? (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="min-h-[44px] px-4 text-sm font-bold text-sultan-headerGrey underline active:text-sultan-white"
          >
            Back to Saved Quotations
          </button>
        ) : (
          <span className="text-xs font-bold uppercase tracking-widest text-sultan-cardLabelGrey">
            PROTECTED ACCESS
          </span>
        )}
      </div>
    </div>
  );
}
