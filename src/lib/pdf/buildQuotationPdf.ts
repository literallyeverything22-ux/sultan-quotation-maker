// Pure browser- and Node-compatible sporty quotation PDF generator (Design.md section 3).

import { PDFDocument, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { BusinessSettings, QuotationItem } from "@/types/quotation";
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONT_SIZES, type RgbColor } from "@/lib/pdf/theme";
import {
  decodeDataUrlToBytes,
  drawLaterPageHeader,
  drawPdfFooter,
  drawTrackedText,
  embedLiberationFonts,
  measureTrackedTextWidth,
  type EmbeddedPdfFonts,
} from "@/lib/pdf/fonts";
import { drawEquipmentIcon, drawFilledPolygon, drawFilledRoundedRect, toPdfRgb } from "@/lib/pdf/icons";
import {
  formatQuotationDisplayDate,
  paginateQuotationItems,
  wrapTextToLines,
  type MeasuredRow,
} from "@/lib/pdf/layout";
import { calculateGrandTotalPaise, calculateItemAmountPaise, formatMoney } from "@/lib/money/formatMoney";
import { amountInWords } from "@/lib/money/amountInWords";

export interface BuildQuotationPdfInput {
  buyerName: string;
  buyerAddress: string;
  quotationDate: string;
  quotationNumber?: string | null;
  items: ReadonlyArray<QuotationItem>;
  settings: BusinessSettings;
}

function drawTxt(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color: RgbColor): void {
  page.drawText(text, { x, y, font, size, color: toPdfRgb(color) });
}

function drawRect(page: PDFPage, x: number, y: number, width: number, height: number, color: RgbColor): void {
  page.drawRectangle({ x, y, width, height, color: toPdfRgb(color) });
}

function drawPage1Header(page: PDFPage, fonts: EmbeddedPdfFonts, input: BuildQuotationPdfInput): void {
  const { settings, quotationDate, quotationNumber } = input;
  const topY = PDF_DIMENSIONS.pageHeight;
  const bottomY = topY - PDF_DIMENSIONS.page1HeaderHeight;
  const rightEdge = PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.marginX;

  drawRect(page, 0, bottomY, PDF_DIMENSIONS.pageWidth, PDF_DIMENSIONS.page1HeaderHeight, PDF_COLORS.black);
  drawFilledPolygon(
    page,
    [{ x: 405, y: topY }, { x: PDF_DIMENSIONS.pageWidth, y: topY }, { x: PDF_DIMENSIONS.pageWidth, y: bottomY }, { x: 363, y: bottomY }],
    PDF_COLORS.orange
  );
  drawFilledPolygon(
    page,
    [{ x: 382, y: topY }, { x: 392, y: topY }, { x: 350, y: bottomY }, { x: 340, y: bottomY }],
    PDF_COLORS.orange
  );
  drawFilledPolygon(
    page,
    [{ x: 364, y: topY }, { x: 368, y: topY }, { x: 326, y: bottomY }, { x: 322, y: bottomY }],
    PDF_COLORS.darkStripe
  );
  page.drawCircle({ x: 250, y: 771.89, size: 70, borderColor: toPdfRgb(PDF_COLORS.headerRing), borderWidth: 1.2 });
  drawRect(page, 0, bottomY - 5, PDF_DIMENSIONS.pageWidth, 5, PDF_COLORS.orange);

  drawTxt(page, settings.companyName.toUpperCase(), 42, 777.89, fonts.boldItalic, PDF_FONT_SIZES.companyName, PDF_COLORS.white);
  drawTrackedText(page, settings.tagline.toUpperCase(), {
    x: 42,
    y: 759.89,
    font: fonts.bold,
    size: PDF_FONT_SIZES.tagline,
    color: PDF_COLORS.orange,
    tracking: 1.2,
  });
  drawTxt(page, settings.addressLine1, 42, 740.89, fonts.regular, PDF_FONT_SIZES.addressAndPhone, PDF_COLORS.headerTextGrey);
  drawTxt(page, settings.addressLine2, 42, 728.89, fonts.regular, PDF_FONT_SIZES.addressAndPhone, PDF_COLORS.headerTextGrey);
  drawTxt(page, `Mobile: ${settings.phoneNumbers}`, 42, 716.89, fonts.regular, PDF_FONT_SIZES.addressAndPhone, PDF_COLORS.headerTextGrey);
  drawTxt(page, `GSTIN: ${settings.gstin}`, 42, 704.89, fonts.bold, PDF_FONT_SIZES.gstin, PDF_COLORS.white);

  const qTitle = "QUOTATION";
  const qW = fonts.boldItalic.widthOfTextAtSize(qTitle, PDF_FONT_SIZES.quotationTitle);
  drawTxt(page, qTitle, rightEdge - qW, 769.89, fonts.boldItalic, PDF_FONT_SIZES.quotationTitle, PDF_COLORS.black);

  const dateLbl = "DATE";
  const dateLblW = measureTrackedTextWidth(dateLbl, fonts.bold, PDF_FONT_SIZES.dateLabel, 1.2);
  drawTrackedText(page, dateLbl, {
    x: rightEdge - dateLblW,
    y: 747.89,
    font: fonts.bold,
    size: PDF_FONT_SIZES.dateLabel,
    color: PDF_COLORS.black,
    tracking: 1.2,
  });

  const displayDate = formatQuotationDisplayDate(quotationDate);
  const dateValW = fonts.bold.widthOfTextAtSize(displayDate, PDF_FONT_SIZES.dateValue);
  drawTxt(page, displayDate, rightEdge - dateValW, 731.89, fonts.bold, PDF_FONT_SIZES.dateValue, PDF_COLORS.black);

  if (quotationNumber?.trim()) {
    const numText = `No. ${quotationNumber.trim()}`;
    const numW = fonts.bold.widthOfTextAtSize(numText, PDF_FONT_SIZES.quotationNumber);
    drawTxt(page, numText, rightEdge - numW, 714.89, fonts.bold, PDF_FONT_SIZES.quotationNumber, PDF_COLORS.black);
  }
}

function drawTableHeader(page: PDFPage, fonts: EmbeddedPdfFonts, topY: number): number {
  const bottomY = topY - PDF_DIMENSIONS.tableHeaderHeight;
  drawRect(page, 42, bottomY, 511, PDF_DIMENSIONS.tableHeaderHeight, PDF_COLORS.black);
  drawRect(page, 42, bottomY, 6, PDF_DIMENSIONS.tableHeaderHeight, PDF_COLORS.orange);

  const cols: ReadonlyArray<[string, number, number]> = [
    ["ITEM", 104, 1.2],
    ["QTY", 342.46, 1.2],
    ["UNIT PRICE (Rs.)", 384.98, 0.6],
    ["AMOUNT (Rs.)", 477.25, 0.6],
  ];
  for (const [label, xPos, track] of cols) {
    drawTrackedText(page, label, {
      x: xPos,
      y: bottomY + 10,
      font: fonts.bold,
      size: PDF_FONT_SIZES.tableHeader,
      color: PDF_COLORS.white,
      tracking: track,
    });
  }
  return bottomY;
}

function drawTableRow(
  page: PDFPage,
  fonts: EmbeddedPdfFonts,
  row: MeasuredRow,
  rowIndexOnPage: number,
  topY: number
): number {
  const bottomY = topY - row.rowHeight;
  const centerY = bottomY + row.rowHeight / 2;
  const bgColor = rowIndexOnPage % 2 === 0 ? PDF_COLORS.lightGrey : PDF_COLORS.white;
  drawRect(page, 42, bottomY, 511, row.rowHeight, bgColor);

  const serialStr = String(row.serialNumber);
  const serialW = fonts.bold.widthOfTextAtSize(serialStr, PDF_FONT_SIZES.serialNumber);
  drawTxt(page, serialStr, 52 - serialW / 2, centerY - 3, fonts.bold, PDF_FONT_SIZES.serialNumber, PDF_COLORS.grey);

  drawEquipmentIcon(page, row.item.iconKey, 78, centerY);

  let lineY = row.noteLines.length > 0 ? topY - 22 : topY - 24.5;
  for (const nameLine of row.nameLines) {
    drawTxt(page, nameLine, 104, lineY, fonts.bold, PDF_FONT_SIZES.itemName, PDF_COLORS.ink);
    lineY -= 13;
  }
  for (const noteLine of row.noteLines) {
    drawTxt(page, noteLine, 104, lineY, fonts.italic, PDF_FONT_SIZES.itemNote, PDF_COLORS.grey);
    lineY -= 12;
  }

  const qtyStr = String(row.item.quantity).padStart(2, "0");
  const qtyW = fonts.regular.widthOfTextAtSize(qtyStr, PDF_FONT_SIZES.qtyAndRate);
  drawTxt(page, qtyStr, 353 - qtyW / 2, centerY - 3.5, fonts.regular, PDF_FONT_SIZES.qtyAndRate, PDF_COLORS.ink);

  const unitPaise = row.item.unitPricePaise ?? 0;
  const unitStr = formatMoney(unitPaise);
  const unitW = fonts.regular.widthOfTextAtSize(unitStr, PDF_FONT_SIZES.qtyAndRate);
  drawTxt(page, unitStr, 466.75 - unitW, centerY - 3.5, fonts.regular, PDF_FONT_SIZES.qtyAndRate, PDF_COLORS.ink);

  const amountPaise = calculateItemAmountPaise(row.item.quantity, unitPaise);
  const amountStr = formatMoney(amountPaise);
  const amountW = fonts.bold.widthOfTextAtSize(amountStr, PDF_FONT_SIZES.amount);
  drawTxt(page, amountStr, 545.75 - amountW, centerY - 3.5, fonts.bold, PDF_FONT_SIZES.amount, PDF_COLORS.ink);

  return bottomY;
}

function drawClosingBlock(
  page: PDFPage,
  fonts: EmbeddedPdfFonts,
  topY: number,
  totalPaise: number,
  settings: BusinessSettings,
  sigImage: PDFImage | null
): void {
  const barTopY = topY - 19;
  const barBottomY = barTopY - PDF_DIMENSIONS.totalBarHeight;

  drawFilledPolygon(
    page,
    [{ x: 277.28, y: barTopY }, { x: 553.28, y: barTopY }, { x: 539.28, y: barBottomY }, { x: 263.28, y: barBottomY }],
    PDF_COLORS.orange
  );
  drawTrackedText(page, "TOTAL (INCLUDING GST)", {
    x: 289.28,
    y: barBottomY + 14,
    font: fonts.bold,
    size: PDF_FONT_SIZES.totalLabel,
    color: PDF_COLORS.black,
    tracking: 0.8,
  });

  const totalStr = `Rs. ${formatMoney(totalPaise)}`;
  const totalW = fonts.boldItalic.widthOfTextAtSize(totalStr, PDF_FONT_SIZES.totalValue);
  drawTxt(page, totalStr, 533 - totalW, barBottomY + 12, fonts.boldItalic, PDF_FONT_SIZES.totalValue, PDF_COLORS.black);

  drawTrackedText(page, "AMOUNT IN WORDS", {
    x: 42,
    y: barBottomY + 25,
    font: fonts.bold,
    size: PDF_FONT_SIZES.amountInWordsLabel,
    color: PDF_COLORS.orange,
    tracking: 1.2,
  });
  const wordsLines = wrapTextToLines(
    amountInWords(totalPaise),
    212,
    PDF_FONT_SIZES.amountInWordsValue,
    false,
    (t, sz) => fonts.italic.widthOfTextAtSize(t, sz)
  );
  wordsLines.forEach((wLine, idx) => {
    drawTxt(page, wLine, 42, barBottomY + 9 - idx * 13, fonts.italic, PDF_FONT_SIZES.amountInWordsValue, PDF_COLORS.ink);
  });

  const cardBottomY = barBottomY - 38 - PDF_DIMENSIONS.bankCardHeight;
  drawFilledRoundedRect(page, {
    x: 42,
    y: cardBottomY,
    width: PDF_DIMENSIONS.bankCardWidth,
    height: PDF_DIMENSIONS.bankCardHeight,
    radius: 6,
    color: PDF_COLORS.black,
  });
  drawRect(page, 42, cardBottomY, 6, PDF_DIMENSIONS.bankCardHeight, PDF_COLORS.orange);
  drawTrackedText(page, "BANK DETAILS", {
    x: 64,
    y: cardBottomY + 98,
    font: fonts.bold,
    size: PDF_FONT_SIZES.bankCardTitle,
    color: PDF_COLORS.orange,
    tracking: 1.5,
  });
  page.drawLine({ start: { x: 64, y: cardBottomY + 90 }, end: { x: 314, y: cardBottomY + 90 }, thickness: 0.8, color: toPdfRgb(PDF_COLORS.cardDivider) });

  const bankRows: ReadonlyArray<[string, string]> = [
    ["Bank Name", settings.bankDetails.bankName],
    ["A/C Holder", settings.bankDetails.accountHolder],
    ["A/C Number", settings.bankDetails.accountNumber],
    ["IFSC Code", settings.bankDetails.ifscCode],
    ["Branch Code", settings.bankDetails.branchCode],
  ];
  bankRows.forEach(([label, val], idx) => {
    const rowY = cardBottomY + 70 - idx * 14.5;
    drawTxt(page, label, 64, rowY, fonts.regular, PDF_FONT_SIZES.bankLabel, PDF_COLORS.cardLabelGrey);
    drawTxt(page, val, 138, rowY, fonts.bold, PDF_FONT_SIZES.bankValue, PDF_COLORS.white);
  });

  if (sigImage) {
    const dims = sigImage.scaleToFit(190, 92);
    page.drawImage(sigImage, { x: 458.28 - dims.width / 2, y: cardBottomY + 10, width: dims.width, height: dims.height });
  }
  page.drawLine({ start: { x: 373.28, y: cardBottomY + 6 }, end: { x: 543.28, y: cardBottomY + 6 }, thickness: 0.8, color: toPdfRgb(PDF_COLORS.grey) });
  const sigCap = "Authorised Signatory";
  const sigCapW = fonts.regular.widthOfTextAtSize(sigCap, PDF_FONT_SIZES.signatoryCaption);
  drawTxt(page, sigCap, 458.28 - sigCapW / 2, cardBottomY - 8, fonts.regular, PDF_FONT_SIZES.signatoryCaption, PDF_COLORS.grey);
}

export async function buildQuotationPdf(input: BuildQuotationPdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await embedLiberationFonts(pdfDoc);

  let sigImage: PDFImage | null = null;
  if (input.settings.signatureDataUrl) {
    const bytes = decodeDataUrlToBytes(input.settings.signatureDataUrl);
    if (bytes) sigImage = await pdfDoc.embedPng(bytes);
  }

  const measureWidth = (text: string, fontSize: number, isBold: boolean) =>
    (isBold ? fonts.bold : fonts.regular).widthOfTextAtSize(text, fontSize);
  const pagePlans = paginateQuotationItems(input.items, measureWidth);
  const totalPaise = calculateGrandTotalPaise(
    input.items.map((it) => ({ quantity: it.quantity, unitPricePaise: it.unitPricePaise ?? 0 }))
  );

  for (const plan of pagePlans) {
    const page = pdfDoc.addPage([PDF_DIMENSIONS.pageWidth, PDF_DIMENSIONS.pageHeight]);
    let cursorY: number;

    if (plan.isFirstPage) {
      drawPage1Header(page, fonts, input);
      drawRect(page, 42, 621.89, 5, 44, PDF_COLORS.orange);
      drawTrackedText(page, "BILLED TO", {
        x: 58,
        y: 655.89,
        font: fonts.bold,
        size: PDF_FONT_SIZES.billedToLabel,
        color: PDF_COLORS.orange,
        tracking: 1.5,
      });
      drawTxt(page, input.buyerName || "Valued Customer", 58, 638.89, fonts.boldItalic, PDF_FONT_SIZES.buyerName, PDF_COLORS.ink);
      drawTxt(page, input.buyerAddress || "Kadapa", 58, 624.89, fonts.regular, PDF_FONT_SIZES.buyerAddress, PDF_COLORS.ink);
      cursorY = 593.89;
    } else {
      drawLaterPageHeader(page, fonts, input.settings);
      cursorY = PDF_DIMENSIONS.pageHeight - PDF_DIMENSIONS.laterPageHeaderHeight - PDF_DIMENSIONS.laterPageHeaderUnderline - 18;
    }

    if (plan.rows.length > 0) {
      cursorY = drawTableHeader(page, fonts, cursorY);
      plan.rows.forEach((row, idx) => {
        cursorY = drawTableRow(page, fonts, row, idx, cursorY);
      });
      if (plan.closesTable) {
        cursorY -= PDF_DIMENSIONS.tableBottomOrangeLine;
        drawRect(page, 42, cursorY, 511, PDF_DIMENSIONS.tableBottomOrangeLine, PDF_COLORS.orange);
      }
    }

    if (plan.hasClosingBlock) {
      drawClosingBlock(page, fonts, cursorY, totalPaise, input.settings, sigImage);
    }

    drawPdfFooter(page, fonts, input.settings, plan.pageNumber, pagePlans.length);
  }

  return pdfDoc.save();
}
