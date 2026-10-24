// Equipment icon word-matching and vector PDF drawing helpers (Design.md section 3.4).

import { rgb, type PDFPage } from "pdf-lib";
import type { IconKey } from "@/types/quotation";
import { PDF_COLORS, PDF_DIMENSIONS, type RgbColor } from "@/lib/pdf/theme";

const ICON_MATCH_RULES: ReadonlyArray<{
  key: Exclude<IconKey, "generic">;
  words: ReadonlyArray<string>;
}> = [
  { key: "net", words: ["net"] },
  {
    key: "ball",
    words: [
      "ball",
      "volley",
      "football",
      "cosco",
      "nivia",
      "basketball",
      "throwball",
      "handball",
    ],
  },
  { key: "dice", words: ["ludo", "snake", "dice"] },
  { key: "carrom", words: ["carrom", "carram", "strox"] },
  { key: "chess", words: ["chess"] },
];

/**
 * Picks the matching icon key for an item name, ignoring capital letters.
 * Unknown items always get "generic" and never fail.
 */
export function matchIconKey(itemName: string): IconKey {
  const lower = itemName.toLowerCase();

  for (const rule of ICON_MATCH_RULES) {
    for (const word of rule.words) {
      if (lower.includes(word)) {
        return rule.key;
      }
    }
  }

  return "generic";
}

export function toPdfRgb(c: RgbColor) {
  return rgb(c.r, c.g, c.b);
}

/**
 * Draws a filled polygon using standard PDF coordinates (y = 0 at bottom, y = 841.89 at top).
 * Note: pdf-lib's drawSvgPath flips the Y axis via scale(1, -1), so we negate Y in the SVG path.
 */
export function drawFilledPolygon(
  page: PDFPage,
  points: ReadonlyArray<{ x: number; y: number }>,
  color: RgbColor
): void {
  if (points.length < 3) return;
  const commands = points.map((pt, idx) => {
    const cmd = idx === 0 ? "M" : "L";
    return `${cmd} ${pt.x.toFixed(2)} ${(-pt.y).toFixed(2)}`;
  });
  commands.push("Z");

  page.drawSvgPath(commands.join(" "), {
    x: 0,
    y: 0,
    color: toPdfRgb(color),
  });
}

/**
 * Draws a filled rounded rectangle in standard PDF coordinates (x, y is bottom-left corner).
 */
export function drawFilledRoundedRect(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    color: RgbColor;
  }
): void {
  const { x, y, width, height, color } = options;
  const r = Math.min(options.radius, width / 2, height / 2);
  const k = 0.55228475 * r;

  // Build path in PDF coordinates, negating y for pdf-lib's drawSvgPath scale(1, -1)
  const ny = (val: number) => (-val).toFixed(2);
  const nx = (val: number) => val.toFixed(2);

  const path = [
    `M ${nx(x + r)} ${ny(y)}`,
    `L ${nx(x + width - r)} ${ny(y)}`,
    `C ${nx(x + width - r + k)} ${ny(y)} ${nx(x + width)} ${ny(y + r - k)} ${nx(x + width)} ${ny(y + r)}`,
    `L ${nx(x + width)} ${ny(y + height - r)}`,
    `C ${nx(x + width)} ${ny(y + height - r + k)} ${nx(x + width - r + k)} ${ny(y + height)} ${nx(x + width - r)} ${ny(y + height)}`,
    `L ${nx(x + r)} ${ny(y + height)}`,
    `C ${nx(x + r - k)} ${ny(y + height)} ${nx(x)} ${ny(y + height - r + k)} ${nx(x)} ${ny(y + height - r)}`,
    `L ${nx(x)} ${ny(y + r)}`,
    `C ${nx(x)} ${ny(y + r - k)} ${nx(x + r - k)} ${ny(y)} ${nx(x + r)} ${ny(y)}`,
    "Z",
  ].join(" ");

  page.drawSvgPath(path, {
    x: 0,
    y: 0,
    color: toPdfRgb(color),
  });
}

/**
 * Draws one of the 6 sporty equipment icons centered at (cx, cy).
 */
export function drawEquipmentIcon(
  page: PDFPage,
  iconKey: IconKey,
  cx: number,
  cy: number
): void {
  const black = toPdfRgb(PDF_COLORS.black);
  const orange = toPdfRgb(PDF_COLORS.orange);
  const white = toPdfRgb(PDF_COLORS.white);

  // Base black circle (radius 17)
  page.drawCircle({
    x: cx,
    y: cy,
    size: PDF_DIMENSIONS.iconRadius,
    color: black,
  });

  if (iconKey === "ball") {
    page.drawCircle({
      x: cx,
      y: cy,
      size: 9.5,
      borderColor: orange,
      borderWidth: 1.3,
    });

    // Three curved seams rotated 0, 120, and 240 degrees
    const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
    for (const angle of angles) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rot = (dx: number, dy: number) => ({
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      });
      const p0 = rot(0, 9.5);
      const p1 = rot(9.025, 4.75);
      const p2 = rot(9.025, -3.325);
      const p3 = rot(1.425, -2.375);
      const seamPath = `M ${p0.x.toFixed(2)} ${(-p0.y).toFixed(2)} C ${p1.x.toFixed(2)} ${(-p1.y).toFixed(2)} ${p2.x.toFixed(2)} ${(-p2.y).toFixed(2)} ${p3.x.toFixed(2)} ${(-p3.y).toFixed(2)}`;
      page.drawSvgPath(seamPath, {
        x: 0,
        y: 0,
        borderColor: orange,
        borderWidth: 1,
      });
    }
    return;
  }

  if (iconKey === "net") {
    for (const dx of [-6, -2, 2, 6]) {
      page.drawLine({
        start: { x: cx + dx, y: cy + 6 },
        end: { x: cx + dx, y: cy - 6 },
        thickness: 0.8,
        color: orange,
      });
    }
    for (const dy of [2, -2]) {
      page.drawLine({
        start: { x: cx - 10, y: cy + dy },
        end: { x: cx + 10, y: cy + dy },
        thickness: 0.8,
        color: orange,
      });
    }
    page.drawLine({
      start: { x: cx - 10, y: cy + 6 },
      end: { x: cx + 10, y: cy + 6 },
      thickness: 1.4,
      color: white,
    });
    for (const dx of [-10, 10]) {
      page.drawLine({
        start: { x: cx + dx, y: cy + 8 },
        end: { x: cx + dx, y: cy - 10 },
        thickness: 1.6,
        color: white,
      });
    }
    return;
  }

  if (iconKey === "dice") {
    drawFilledRoundedRect(page, {
      x: cx - 7.5,
      y: cy - 7.5,
      width: 15,
      height: 15,
      radius: 3,
      color: PDF_COLORS.orange,
    });
    const pips = [
      { dx: -3.8, dy: 3.8 },
      { dx: 3.8, dy: 3.8 },
      { dx: 0, dy: 0 },
      { dx: -3.8, dy: -3.8 },
      { dx: 3.8, dy: -3.8 },
    ];
    for (const pip of pips) {
      page.drawCircle({
        x: cx + pip.dx,
        y: cy + pip.dy,
        size: 1.3,
        color: black,
      });
    }
    return;
  }

  if (iconKey === "carrom") {
    page.drawRectangle({
      x: cx - 8.5,
      y: cy - 8.5,
      width: 17,
      height: 17,
      borderColor: orange,
      borderWidth: 1.3,
    });
    page.drawRectangle({
      x: cx - 5.5,
      y: cy - 5.5,
      width: 11,
      height: 11,
      borderColor: white,
      borderWidth: 0.6,
    });
    for (const dx of [-6.5, 6.5]) {
      for (const dy of [-6.5, 6.5]) {
        page.drawCircle({
          x: cx + dx,
          y: cy + dy,
          size: 1.7,
          color: orange,
        });
      }
    }
    page.drawCircle({
      x: cx,
      y: cy,
      size: 2.6,
      borderColor: orange,
      borderWidth: 0.8,
    });
    return;
  }

  if (iconKey === "chess") {
    const cell = 4.2;
    const startX = cx - 8.4;
    const startY = cy - 8.4;
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        const isOrange = (col + row) % 2 === 1;
        page.drawRectangle({
          x: startX + col * cell,
          y: startY + row * cell,
          width: cell,
          height: cell,
          color: isOrange ? orange : white,
        });
      }
    }
    return;
  }

  // Generic sports icon: 5-pointed orange star on the black circle
  const starPoints: { x: number; y: number }[] = [];
  const outerR = 9.5;
  const innerR = 4.0;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = Math.PI / 2 + (i * Math.PI) / 5;
    starPoints.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  drawFilledPolygon(page, starPoints, PDF_COLORS.orange);
}
