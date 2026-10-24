"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Link from "next/link";

interface ScreenErrorBoundaryProps {
  screenName: string;
  children: ReactNode;
}

interface ScreenErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches unexpected rendering errors on any screen so one broken part
 * never blanks the whole app or loses a phone draft.
 */
export class ScreenErrorBoundary extends Component<
  ScreenErrorBoundaryProps,
  ScreenErrorBoundaryState
> {
  public constructor(props: ScreenErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): ScreenErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Do not log buyer or bank details
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="my-6 space-y-4 rounded-xl border-l-4 border-sultan-errorRed bg-sultan-lightGrey p-5"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-sultan-errorRed">
            {this.props.screenName}
          </p>
          <h2 className="text-lg font-bold text-sultan-ink">
            Something went wrong on this screen.
          </h2>
          <p className="text-sm text-sultan-grey">
            Your saved quotations and phone draft are safe. Tap below to try again.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="flex min-h-[44px] items-center justify-center rounded-xl bg-sultan-orange px-4 py-2 text-sm font-bold text-sultan-black"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-4 py-2 text-sm font-bold text-sultan-black"
            >
              Go Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface BuyerFormProps {
  buyerName: string;
  buyerAddress: string;
  quotationDate: string;
  onChange: (updates: {
    buyerName?: string;
    buyerAddress?: string;
    quotationDate?: string;
  }) => void;
}

export function BuyerForm({
  buyerName,
  buyerAddress,
  quotationDate,
  onChange,
}: BuyerFormProps) {
  return (
    <section className="space-y-4 rounded-xl bg-sultan-lightGrey p-4">
      <div className="flex items-center gap-2">
        <span className="h-5 w-1.5 rounded-full bg-sultan-orange" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
          Billed To (Buyer Details)
        </h2>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">
          Buyer Name
        </span>
        <input
          type="text"
          value={buyerName}
          onChange={(e) => onChange({ buyerName: e.target.value })}
          placeholder="e.g. The Superintendent, Central Prison"
          className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base font-bold text-sultan-ink"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">
          Buyer Address
        </span>
        <textarea
          rows={2}
          value={buyerAddress}
          onChange={(e) => onChange({ buyerAddress: e.target.value })}
          placeholder="City, District, PIN"
          className="w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base text-sultan-ink"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">
          Quotation Date
        </span>
        <input
          type="date"
          value={quotationDate}
          onChange={(e) => onChange({ quotationDate: e.target.value })}
          className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base font-bold text-sultan-ink"
        />
      </label>
    </section>
  );
}
