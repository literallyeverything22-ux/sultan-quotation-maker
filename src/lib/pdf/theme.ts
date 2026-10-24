// Single source of truth for PDF colors, font sizes, and layout measurements from Design.md.

import type { BusinessSettings, IconKey, QuotationItem } from "@/types/quotation";

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function hexToRgbNormalized(hex: string): RgbColor {
  const clean = hex.replace("#", "");
  const num = Number.parseInt(clean, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

export const PDF_COLORS = {
  black: hexToRgbNormalized("#121317"),
  orange: hexToRgbNormalized("#FF6B0D"),
  white: hexToRgbNormalized("#FFFFFF"),
  ink: hexToRgbNormalized("#1A1A1F"),
  grey: hexToRgbNormalized("#737885"),
  lightGrey: hexToRgbNormalized("#F4F4F5"),
  lineGrey: hexToRgbNormalized("#D9D9DE"),
  headerTextGrey: hexToRgbNormalized("#C7CCD6"),
  cardLabelGrey: hexToRgbNormalized("#B3B8C4"),
  cardDivider: hexToRgbNormalized("#4D4D59"),
  footerTextGrey: hexToRgbNormalized("#BFC4D1"),
  headerRing: hexToRgbNormalized("#292B33"),
  darkStripe: hexToRgbNormalized("#59331A"),
} as const;

export const PDF_FONT_SIZES = {
  companyName: 25,
  tagline: 8.5,
  addressAndPhone: 8.5,
  gstin: 8.5,
  quotationTitle: 25,
  dateLabel: 8.5,
  dateValue: 12,
  quotationNumber: 10,
  billedToLabel: 8,
  buyerName: 13,
  buyerAddress: 10.5,
  tableHeader: 8.5,
  serialNumber: 8.5,
  itemName: 10.5,
  itemNote: 8.5,
  qtyAndRate: 10,
  amount: 10,
  totalLabel: 9,
  totalValue: 15,
  amountInWordsLabel: 8,
  amountInWordsValue: 10,
  bankCardTitle: 9,
  bankLabel: 9,
  bankValue: 9.5,
  signatoryCaption: 8.5,
  footerThankYou: 12,
  footerContact: 8,
  footerSlogan: 9,
  footerPageNumber: 8,
} as const;

export const PDF_DIMENSIONS = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginX: 42,
  tableWidth: 511.28,
  page1HeaderHeight: 148,
  page1HeaderUnderline: 5,
  laterPageHeaderHeight: 56,
  laterPageHeaderUnderline: 3,
  buyerBlockTopGap: 24,
  buyerBarWidth: 5,
  buyerBarHeight: 44,
  buyerBlockBottomGap: 20,
  tableHeaderHeight: 28,
  tableHeaderMarkerWidth: 6,
  normalRowHeight: 42,
  noteRowHeight: 50,
  extraWrappedLineHeight: 13,
  tableBottomOrangeLine: 3,
  iconRadius: 17,
  serialOffsetX: 14,
  iconCenterOffsetX: 42,
  colSerialAndIcon: 64,
  colItem: 224,
  colQty: 46,
  colUnitPrice: 98,
  colAmount: 79,
  totalAreaTopGap: 22,
  totalBarWidth: 290,
  totalBarHeight: 38,
  bankSectionTopGap: 34,
  bankCardWidth: 290,
  bankCardHeight: 124,
  bankCardStripWidth: 6,
  signatureWidth: 190,
  footerHeight: 62,
  footerSafetyMargin: 16,
  /** Total height needed for the closing block (total bar + bank card + signature) on the last page. */
  closingBlockHeight: 238,
} as const;

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  companyName: "Sultan Enterprises",
  tagline: "SPORTS GOODS  |  INDOOR GAMES  |  EQUIPMENT",
  addressLine1: "Shankarapuram, Opp Apoorva Function Hall, Near Shankarapuram",
  addressLine2: "Kadapa, YSR District, Andhra Pradesh - 516002",
  phoneNumbers: "9110744845, 6303974896",
  gstin: "37DDEPA9307Q1Z4",
  bankDetails: {
    bankName: "Indian Bank",
    accountHolder: "Sultan Sports Manzil",
    accountNumber: "7602541196",
    ifscCode: "IDIB000N085",
    branchCode: "01278",
  },
  signatureStoragePath: null,
  signatureDataUrl: null,
  numberPrefix: "SE",
  footerSlogan: "PLAY HARD. PLAY FAIR.",
};

const APPROVED_FIVE_ITEMS: ReadonlyArray<{
  name: string;
  quantity: number;
  unitPricePaise: number;
  note?: string;
  iconKey: IconKey;
}> = [
  {
    name: "Cosco Acclaim (Volleyball)",
    quantity: 1,
    unitPricePaise: 75000,
    iconKey: "ball",
  },
  {
    name: "Volleyball Net (Gupta)",
    quantity: 1,
    unitPricePaise: 170000,
    iconKey: "net",
  },
  {
    name: "Ludo & Snakes",
    quantity: 1,
    unitPricePaise: 26000,
    iconKey: "dice",
  },
  {
    name: "Carrom Board (STROX)",
    quantity: 1,
    unitPricePaise: 95000,
    note: "Comes with coins, striker & powder",
    iconKey: "carrom",
  },
  {
    name: "Maxen Wooden Chess - Big Size",
    quantity: 1,
    unitPricePaise: 55000,
    note: "Comes with all chess pieces",
    iconKey: "chess",
  },
];

const EXTRA_SAMPLE_ITEMS: ReadonlyArray<{
  name: string;
  quantity: number;
  unitPricePaise: number;
  note?: string;
  iconKey: IconKey;
}> = [
  {
    name: "SG Kashmir Willow Bat",
    quantity: 2,
    unitPricePaise: 185000,
    note: "Includes padded bat cover",
    iconKey: "generic",
  },
  {
    name: "Yonex Mavis 350 Shuttle Box",
    quantity: 3,
    unitPricePaise: 115000,
    iconKey: "generic",
  },
  {
    name: "Nivia Shining Star Football",
    quantity: 2,
    unitPricePaise: 89000,
    iconKey: "ball",
  },
  {
    name: "Badminton Net (Heavy Nylon)",
    quantity: 1,
    unitPricePaise: 65000,
    iconKey: "net",
  },
  {
    name: "Cosco Tennis Ball (Pack of 3)",
    quantity: 4,
    unitPricePaise: 32000,
    iconKey: "ball",
  },
];

export function buildSampleQuotationItems(count: number): QuotationItem[] {
  const result: QuotationItem[] = [];
  for (let i = 0; i < count; i++) {
    const base =
      i < APPROVED_FIVE_ITEMS.length
        ? APPROVED_FIVE_ITEMS[i]!
        : EXTRA_SAMPLE_ITEMS[(i - APPROVED_FIVE_ITEMS.length) % EXTRA_SAMPLE_ITEMS.length]!;
    result.push({
      id: `sample-${i + 1}`,
      name: i < 5 ? base.name : `${base.name} #${i + 1}`,
      quantity: base.quantity,
      unitPricePaise: base.unitPricePaise,
      note: base.note,
      iconKey: base.iconKey,
    });
  }
  return result;
}
