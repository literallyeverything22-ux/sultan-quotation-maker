"use client";

import { useRef, useState } from "react";
import type { ApiResponse, QuotationItem } from "@/types/quotation";
import { shrinkPhoto } from "@/lib/image/shrinkPhoto";

interface PhotoPickerProps {
  hasExistingItems: boolean;
  onItemsRead: (items: QuotationItem[], mode: "replace" | "append") => void;
}

export function PhotoPicker({
  hasExistingItems,
  onItemsRead,
}: PhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [isReading, setIsReading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setIsReading(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    setProgressPercent(10);

    const collectedItems: QuotationItem[] = [];
    const failedMessages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const stepLabel =
        files.length === 1
          ? "Reading photo..."
          : `Reading photo ${i + 1} of ${files.length}...`;
      setProgressText(stepLabel);
      setProgressPercent(Math.round(((i + 0.3) / files.length) * 100));

      try {
        // 1. Shrink photo on the phone so uploads are fast and light
        const shrunk = await shrinkPhoto(file, 2000);
        const shrunkDataUrl = `data:${shrunk.mimeType};base64,${shrunk.base64}`;

        // 2. Send only the shrunk photo to /api/read-items
        const res = await fetch("/api/read-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: shrunkDataUrl }),
        });

        const payload = (await res.json()) as ApiResponse<{
          items: QuotationItem[];
        }>;

        if (payload.ok && payload.data.items.length > 0) {
          collectedItems.push(...payload.data.items);
        } else if (!payload.ok) {
          failedMessages.push(payload.message);
        } else {
          failedMessages.push(
            "Could not read this photo clearly. Try a brighter, closer photo, or type the items instead."
          );
        }
      } catch {
        failedMessages.push(
          "Something went wrong reading the photo. Please try again."
        );
      }

      setProgressPercent(Math.round(((i + 1) / files.length) * 100));
    }

    // Reset file inputs so picking the same photo again triggers onChange
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";

    setIsReading(false);
    setProgressText("");

    if (collectedItems.length > 0) {
      onItemsRead(collectedItems, hasExistingItems ? "append" : "replace");
      const unsureCount = collectedItems.filter((it) => it.needsReview).length;
      setSuccessNotice(
        unsureCount > 0
          ? `Added ${collectedItems.length} items from photo (${unsureCount} highlighted to check).`
          : `Added ${collectedItems.length} items from photo.`
      );
    }

    if (failedMessages.length > 0) {
      setErrorMessage(failedMessages[0] ?? null);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-sultan-lineGrey bg-sultan-lightGrey p-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
          HANDWRITTEN OR PRINTED LIST
        </span>
        <h2 className="text-base font-bold italic text-sultan-ink">
          1B. Take or Pick Photo of List
        </h2>
        <p className="mt-0.5 text-xs text-sultan-grey">
          Snap a photo of a rough handwritten list or pick one or more photos
          from your phone gallery.
        </p>
      </div>

      {/* Hidden file inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => void handleFilesSelected(e.target.files)}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => void handleFilesSelected(e.target.files)}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isReading}
          onClick={() => cameraInputRef.current?.click()}
          className="flex min-h-[48px] items-center justify-center rounded-xl bg-sultan-orange px-3 py-2.5 text-sm font-bold text-sultan-black active:opacity-90 disabled:opacity-50"
        >
          Take Photo
        </button>

        <button
          type="button"
          disabled={isReading}
          onClick={() => galleryInputRef.current?.click()}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-3 py-2.5 text-sm font-bold text-sultan-black active:bg-sultan-lightGrey disabled:opacity-50"
        >
          Pick Photo(s)
        </button>
      </div>

      {isReading ? (
        <div className="space-y-2 rounded-xl bg-sultan-white p-3">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-sultan-lightGrey">
            <div
              className="h-full rounded-full bg-sultan-orange transition-all"
              style={{ width: `${Math.max(15, progressPercent)}%` }}
            />
          </div>
          <p className="text-xs font-bold text-sultan-ink">{progressText}</p>
        </div>
      ) : null}

      {successNotice ? (
        <div
          role="status"
          className="rounded-xl border-l-4 border-sultan-orange bg-sultan-white p-3 text-xs font-bold text-sultan-ink"
        >
          {successNotice}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border-l-4 border-sultan-errorRed bg-sultan-white p-3 text-xs font-bold text-sultan-errorRed"
        >
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
