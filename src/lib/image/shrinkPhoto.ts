// Browser canvas helpers for preparing images:
// 1. Removing the paper background from the owner's signature & stamp photo (Phase 2).
// 2. Shrinking handwritten list photos before sending to AI (Phase 9).

/**
 * Pure pixel processor that removes white/grey paper background while keeping ink and stamp colors.
 * Exported as a pure function so it can be unit-tested in Node with Vitest.
 *
 * @param data RGBA pixel buffer (modified in place)
 * @param sensitivity Brightness cutoff (140 to 245, default 205). Higher removes darker paper shadows.
 */
export function cleanSignaturePixels(
  data: Uint8ClampedArray,
  sensitivity: number = 205
): void {
  const featherRange = 28;
  const hardCutoff = Math.min(250, Math.max(120, sensitivity));
  const softStart = hardCutoff - featherRange;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 255;
    const g = data[i + 1] ?? 255;
    const b = data[i + 2] ?? 255;
    const a = data[i + 3] ?? 255;

    if (a === 0) continue;

    // Perceived brightness (0 = black, 255 = white)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    // Color richness helps preserve blue/violet/red rubber stamp ink even when light
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const colorSpread = maxChannel - minChannel;

    // Effective darkness boosts colored stamp ink so it is not erased as paper
    const effectiveBrightness = brightness - colorSpread * 0.55;

    if (effectiveBrightness >= hardCutoff) {
      // Paper background -> completely transparent
      data[i + 3] = 0;
    } else if (effectiveBrightness > softStart) {
      // Smooth edge transition so the stamp does not look jagged
      const ratio = (hardCutoff - effectiveBrightness) / featherRange;
      data[i + 3] = Math.round(a * Math.max(0, Math.min(1, ratio)));
    } else {
      // Ink or stamp pixel -> slightly deepen contrast so it prints crisply on the PDF
      data[i] = Math.max(0, Math.round(r * 0.9));
      data[i + 1] = Math.max(0, Math.round(g * 0.9));
      data[i + 2] = Math.max(0, Math.round(b * 0.9));
      data[i + 3] = 255;
    }
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image file."));
    };
    img.src = objectUrl;
  });
}

/**
 * Loads a signature/stamp image in the browser, removes its paper background,
 * crops extra empty margins, and returns a transparent PNG data URL.
 */
export async function prepareSignatureImage(
  file: File,
  sensitivity: number = 205
): Promise<string> {
  const img = await loadImageFromFile(file);
  const maxLongSide = 900;

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > maxLongSide || targetHeight > maxLongSide) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxLongSide) / targetWidth);
      targetWidth = maxLongSide;
    } else {
      targetWidth = Math.round((targetWidth * maxLongSide) / targetHeight);
      targetHeight = maxLongSide;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, targetWidth);
  canvas.height = Math.max(1, targetHeight);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser canvas is not available.");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  cleanSignaturePixels(imageData.data, sensitivity);
  ctx.putImageData(imageData, 0, 0);

  // Find bounding box of non-transparent ink pixels so the stamp sits neatly in the PDF box
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  let foundInk = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = imageData.data[(y * canvas.width + x) * 4 + 3] ?? 0;
      if (alpha > 25) {
        foundInk = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!foundInk) {
    return canvas.toDataURL("image/png");
  }

  const pad = 12;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(canvas.width - cropX, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(canvas.height - cropY, maxY - minY + 1 + pad * 2);

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = Math.max(1, cropW);
  croppedCanvas.height = Math.max(1, cropH);

  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) {
    return canvas.toDataURL("image/png");
  }

  croppedCtx.drawImage(
    canvas,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );

  return croppedCanvas.toDataURL("image/png");
}

/**
 * Shrinks a photo on the phone (long side around 2000 pixels) before sending to AI.
 */
export async function shrinkPhoto(
  file: File,
  maxLongSide: number = 2000
): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  const img = await loadImageFromFile(file);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxLongSide || height > maxLongSide) {
    if (width >= height) {
      height = Math.round((height * maxLongSide) / width);
      width = maxLongSide;
    } else {
      width = Math.round((width * maxLongSide) / height);
      height = maxLongSide;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser canvas is not available.");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const prefix = "data:image/jpeg;base64,";
  const base64 = dataUrl.startsWith(prefix)
    ? dataUrl.slice(prefix.length)
    : dataUrl;

  return { base64, mimeType: "image/jpeg" };
}
