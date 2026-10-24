// Liberation Sans font loader, letter-spaced text helpers, and footer drawer for pdf-lib.
// Works both in the phone browser (fetching /fonts/*.ttf) and in Node tests.

import fontkit from "@pdf-lib/fontkit";
import { rgb, type PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import type { BusinessSettings } from "@/types/quotation";
import {
  PDF_COLORS,
  PDF_DIMENSIONS,
  PDF_FONT_SIZES,
  type RgbColor,
} from "@/lib/pdf/theme";
import { drawFilledPolygon, toPdfRgb } from "@/lib/pdf/icons";

export interface EmbeddedPdfFonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

export interface RawFontSet {
  regular: Uint8Array;
  bold: Uint8Array;
  italic: Uint8Array;
  boldItalic: Uint8Array;
}

let cachedFontBytes: RawFontSet | null = null;

/**
 * Allows Node-based unit tests to pre-populate the Liberation Sans font bytes
 * without bundling node:fs into the browser client.
 */
export function setCachedLiberationFontBytes(fontSet: RawFontSet): void {
  cachedFontBytes = fontSet;
}

async function fetchFontBytesInBrowser(fileName: string): Promise<Uint8Array> {
  const res = await fetch(`/fonts/${fileName}`);
  if (!res.ok) {
    throw new Error(`Could not load font ${fileName}.`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function getRawLiberationFontBytes(): Promise<RawFontSet> {
  if (cachedFontBytes) {
    return cachedFontBytes;
  }

  const [regular, bold, italic, boldItalic] = await Promise.all([
    fetchFontBytesInBrowser("LiberationSans-Regular.ttf"),
    fetchFontBytesInBrowser("LiberationSans-Bold.ttf"),
    fetchFontBytesInBrowser("LiberationSans-Italic.ttf"),
    fetchFontBytesInBrowser("LiberationSans-BoldItalic.ttf"),
  ]);
  cachedFontBytes = { regular, bold, italic, boldItalic };
  return cachedFontBytes;
}

/**
 * Registers fontkit and embeds the four Liberation Sans font weights into a PDFDocument.
 */
export async function embedLiberationFonts(
  pdfDoc: PDFDocument
): Promise<EmbeddedPdfFonts> {
  pdfDoc.registerFontkit(fontkit);
  const raw = await getRawLiberationFontBytes();

  const [regular, bold, italic, boldItalic] = await Promise.all([
    pdfDoc.embedFont(raw.regular, { subset: true }),
    pdfDoc.embedFont(raw.bold, { subset: true }),
    pdfDoc.embedFont(raw.italic, { subset: true }),
    pdfDoc.embedFont(raw.boldItalic, { subset: true }),
  ]);

  return { regular, bold, italic, boldItalic };
}

/**
 * Measures the total width of letter-spaced text.
 */
export function measureTrackedTextWidth(
  text: string,
  font: PDFFont,
  size: number,
  trackingPoints: number
): number {
  if (!text) return 0;
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] ?? "";
    total += font.widthOfTextAtSize(ch, size);
    if (i < text.length - 1) {
      total += trackingPoints;
    }
  }
  return total;
}

/**
 * Draws letter-spaced text (such as "SPORTS GOODS | INDOOR GAMES | EQUIPMENT" or "BILLED TO").
 */
export function drawTrackedText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    font: PDFFont;
    size: number;
    color: RgbColor;
    tracking?: number;
  }
): void {
  const tracking = options.tracking ?? 1.2;
  let cursorX = options.x;
  const pdfColor = rgb(options.color.r, options.color.g, options.color.b);

  for (let i = 0; i < text.length; i++) {
    const ch = text[i] ?? "";
    page.drawText(ch, {
      x: cursorX,
      y: options.y,
      font: options.font,
      size: options.size,
      color: pdfColor,
    });
    cursorX += options.font.widthOfTextAtSize(ch, options.size) + tracking;
  }
}

export function decodeDataUrlToBytes(dataUrl: string): Uint8Array | null {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return null;
  const base64 = dataUrl.slice(commaIdx + 1).trim();
  if (!base64) return null;
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Draws the sporty footer band with slogan and "Page X of Y" on every page.
 */
export function drawPdfFooter(
  page: PDFPage,
  fonts: EmbeddedPdfFonts,
  settings: BusinessSettings,
  pageNumber: number,
  totalPages: number
): void {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PDF_DIMENSIONS.pageWidth,
    height: PDF_DIMENSIONS.footerHeight,
    color: toPdfRgb(PDF_COLORS.black),
  });
  drawFilledPolygon(
    page,
    [
      { x: 405.28, y: 62 },
      { x: 595.28, y: 62 },
      { x: 595.28, y: 0 },
      { x: 365.28, y: 0 },
    ],
    PDF_COLORS.orange
  );
  drawFilledPolygon(
    page,
    [
      { x: 383.28, y: 62 },
      { x: 393.28, y: 62 },
      { x: 353.28, y: 0 },
      { x: 343.28, y: 0 },
    ],
    PDF_COLORS.orange
  );

  page.drawText("Thank you for your business", {
    x: 42,
    y: 38,
    font: fonts.boldItalic,
    size: PDF_FONT_SIZES.footerThankYou,
    color: toPdfRgb(PDF_COLORS.white),
  });
  page.drawText(
    `${settings.companyName}  |  Shankarapuram, Kadapa  |  ${settings.phoneNumbers}`,
    {
      x: 42,
      y: 23,
      font: fonts.regular,
      size: PDF_FONT_SIZES.footerContact,
      color: toPdfRgb(PDF_COLORS.footerTextGrey),
    }
  );
  page.drawText(`Page ${pageNumber} of ${totalPages}`, {
    x: 42,
    y: 10,
    font: fonts.regular,
    size: PDF_FONT_SIZES.footerPageNumber,
    color: toPdfRgb(PDF_COLORS.footerTextGrey),
  });

  drawTrackedText(page, settings.footerSlogan.toUpperCase(), {
    x: 420.57,
    y: 26,
    font: fonts.bold,
    size: PDF_FONT_SIZES.footerSlogan,
    color: PDF_COLORS.black,
    tracking: 1.2,
  });
}

/**
 * Draws the slim header band ("QUOTATION (continued)") on Page 2 and onward.
 */
export function drawLaterPageHeader(
  page: PDFPage,
  fonts: EmbeddedPdfFonts,
  settings: BusinessSettings
): void {
  const topY = PDF_DIMENSIONS.pageHeight;
  const bottomY = topY - PDF_DIMENSIONS.laterPageHeaderHeight; // 785.89
  const rightEdge = PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.marginX;

  page.drawRectangle({
    x: 0,
    y: bottomY,
    width: PDF_DIMENSIONS.pageWidth,
    height: PDF_DIMENSIONS.laterPageHeaderHeight,
    color: toPdfRgb(PDF_COLORS.black),
  });
  drawFilledPolygon(
    page,
    [
      { x: 375, y: topY },
      { x: PDF_DIMENSIONS.pageWidth, y: topY },
      { x: PDF_DIMENSIONS.pageWidth, y: bottomY },
      { x: 357, y: bottomY },
    ],
    PDF_COLORS.orange
  );
  drawFilledPolygon(
    page,
    [
      { x: 359, y: topY },
      { x: 367, y: topY },
      { x: 349, y: bottomY },
      { x: 341, y: bottomY },
    ],
    PDF_COLORS.orange
  );
  page.drawRectangle({
    x: 0,
    y: bottomY - PDF_DIMENSIONS.laterPageHeaderUnderline,
    width: PDF_DIMENSIONS.pageWidth,
    height: PDF_DIMENSIONS.laterPageHeaderUnderline,
    color: toPdfRgb(PDF_COLORS.orange),
  });

  page.drawText(settings.companyName.toUpperCase(), {
    x: 42,
    y: bottomY + 20,
    font: fonts.boldItalic,
    size: 16,
    color: toPdfRgb(PDF_COLORS.white),
  });

  const contTitle = "QUOTATION (continued)";
  const contW = fonts.boldItalic.widthOfTextAtSize(contTitle, 12.5);
  page.drawText(contTitle, {
    x: rightEdge - contW,
    y: bottomY + 21,
    font: fonts.boldItalic,
    size: 12.5,
    color: toPdfRgb(PDF_COLORS.black),
  });
}
