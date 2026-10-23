# Design: Sultan Quotation Maker

This file records the look of the app and the PDF. It is the single source of truth for colors, fonts, sizes, and layout. The approved visual target for the PDF is the file `Quotation_Sporty_Central_Prison_Kadapa.pdf` (keep a copy in a `reference/` folder in the project). When this file and the reference look different, tell Munavar and ask. Do not guess.

Theme in one line: **bold, energetic, sporty. Black and bright orange, italic headlines, racing-stripe slashes, small icons for the equipment.**

---

## 1. Colors

| Name | Hex | Used for |
|------|-----|----------|
| Black | `#121317` | Headers, table header, bank card, footer band, buttons text on orange |
| Orange | `#FF6B0D` | Accent, primary buttons, slashes, total bar, active toggle |
| White | `#FFFFFF` | Page background, text on black |
| Ink | `#1A1A1F` | Main text on white |
| Grey | `#737885` | Secondary text, notes, labels |
| Light grey | `#F4F4F5` | Zebra rows, input backgrounds |
| Line grey | `#D9D9DE` | Thin dividers and borders |
| Header text grey | `#C7CCD6` | Address lines on the black header |
| Card label grey | `#B3B8C4` | Labels inside the black bank card |
| Card divider | `#4D4D59` | Divider line inside the black bank card |
| Footer text grey | `#BFC4D1` | Small text on the black footer |
| Header ring | `#292B33` | Faint decorative circle in the header |
| Dark stripe | `#59331A` | Thin dark stripe beside the orange slash |
| Error red | `#D64545` | Error messages (app screens only) |

**Rules**
- Text on orange is **always black**. Never white on orange.
- Text on black is white or one of the light greys above.
- Orange is for accents and main actions. Do not use it for long text.

---

## 2. Fonts and typography

### PDF
- Font family: **Liberation Sans** (Regular, Bold, Italic, Bold Italic), embedded in the PDF. It looks like Arial.
- Use **Rs.** for money. The PDF font has no rupee symbol.

| Element | Style | Size (points) | Color |
|---------|-------|---------------|-------|
| Company name | Bold Italic | 25 | White |
| Tagline | Bold, letter-spaced | 8.5 | Orange |
| Address and phone lines | Regular | 8.5 | `#C7CCD6` |
| GSTIN | Bold | 8.5 | White |
| QUOTATION title | Bold Italic | 25 | Black (on orange) |
| DATE label | Bold, letter-spaced | 8.5 | Black |
| Date value | Bold | 12 | Black |
| BILLED TO label | Bold, letter-spaced | 8 | Orange |
| Buyer name | Bold Italic | 13 | Ink |
| Buyer address | Regular | 10.5 | Ink |
| Table header labels | Bold, letter-spaced | 8.5 | White |
| Item name | Bold | 10.5 | Ink |
| Item note line | Italic | 8.5 | Grey |
| Quantity, unit price | Regular | 10 | Ink |
| Amount | Bold | 10 | Ink |
| Total label | Bold, letter-spaced | 9 | Black |
| Total value | Bold Italic | 15 | Black |
| AMOUNT IN WORDS label | Bold, letter-spaced | 8 | Orange |
| Amount in words | Italic | 10 | Ink |
| Bank card title | Bold, letter-spaced | 9 | Orange |
| Bank label / value | Regular / Bold | 9 / 9.5 | `#B3B8C4` / White |
| Authorised Signatory caption | Regular | 8.5 | Grey |
| Footer thank-you | Bold Italic | 12 | White |
| Footer contact line | Regular | 8 | `#BFC4D1` |
| Footer slogan | Bold, letter-spaced | 9 | Black (on orange) |

### App screens
- Font: the phone's own clean sans-serif (system font). No web fonts, so the app loads fast.
- Headlines: bold italic, to echo the PDF.
- Body text: at least 16 pixels. Small labels: at least 12 pixels, bold, letter-spaced, in orange or grey.
- Numbers in the item list use tabular (equal width) digits so columns line up.

---

## 3. PDF layout (A4, 595.28 x 841.89 points, side margins 42)

### 3.1 Page 1 header
- Black band across the top, **148 high**.
- Orange slash on the right: a slanted shape from the top right corner. Its top edge starts at x = 405 and its bottom edge at x = 363, running to the right edge.
- A second, thinner orange stripe just left of it (top x = 382 to 392, bottom x = 340 to 350).
- A very thin dark stripe (`#59331A`) just left of that (top x = 364 to 368, bottom x = 322 to 326).
- A faint circle outline (`#292B33`, radius 70) behind the company name, like a ball.
- A 5 high orange line directly under the black band.
- Left side, top to bottom: company name, tagline, address line 1, address line 2, phone numbers, GSTIN.
- Right side, on the orange: QUOTATION (right aligned to the right margin), then DATE label and the date.
- If the quotation number is **on**, it appears under the date as `No. SE-0001` in Bold, 10, black. If it is off, nothing is shown.

### 3.2 Buyer block
- An orange vertical bar (5 wide, 44 high) at the left margin.
- BILLED TO label, buyer name, buyer address to the right of the bar.

### 3.3 Item table
- Table width **511** (from left margin to the right margin).
- Header row: black, 28 high, with a 6 wide orange marker at its left end.
- Columns, left to right: serial number and icon (64), item (224), quantity (46), unit price (98), amount (79).
- Header labels: ITEM, QTY, UNIT PRICE (Rs.), AMOUNT (Rs.). Quantity centered, prices right aligned.
- Row height: **42** for a normal row, **50** if the item has a note line.
- Row backgrounds alternate light grey `#F4F4F5` and white.
- Money in the table is shown with two decimals and Indian-style commas (for example 1,700.00).
- A 3 high orange line closes the table after the last row (on the last page).
- **Serial numbers:** every row shows its serial number (1, 2, 3 and so on) in Bold, 8.5, grey, centered about 16 from the left edge of the table, just left of the icon. This lets buyers refer to "item 37". The header's first cell is left blank.

### 3.4 Icons
Each row has a small icon on a black circle (radius 17), drawn with simple shapes in orange and white. The circle sits about 44 from the left edge of the table, to the right of the serial number.

| Icon | How it is drawn | Matches words like |
|------|-----------------|--------------------|
| Ball | Orange circle outline with three curved seams | ball, volley, football, cosco |
| Net | A small orange grid with a white top line and two white posts | net |
| Dice | Orange rounded square with five black dots | ludo, snake, dice |
| Carrom | Orange square outline, thin white inner square, four orange corner dots, small orange center ring | carrom, carram, strox |
| Chess | A 4 by 4 checker pattern in orange and white | chess |
| Generic sports | A simple orange star on the black circle | anything else |

Matching ignores capital letters. The list of words can grow later. An unknown item always gets the generic icon and never causes an error.

### 3.5 Total area (last page)
- Starts 22 below the table.
- Right side: an orange slanted bar, 290 wide and 38 high. Left text "TOTAL (INCLUDING GST)", right text the amount as `Rs. 4,210.00`.
- Left side: AMOUNT IN WORDS label and the amount in words, in italic.

### 3.6 Bank card and signature (last page)
- 38 below the total area.
- Bank card on the left: black, rounded corners (radius 6), 290 wide and 124 high, with a 6 wide orange strip down its left edge.
  - Title BANK DETAILS in orange, a thin divider, then five rows: Bank Name, A/C Holder, A/C Number, IFSC Code, Branch Code.
- Signature and stamp on the right: the transparent-background image, 190 wide, with a thin grey line underneath and the caption "Authorised Signatory" centered.

### 3.7 Footer (every page)
- Black band, 62 high, at the bottom edge.
- Orange slash on the right (top edge starts 190 from the right edge, bottom edge 230), plus a thinner orange stripe beside it.
- Left: "Thank you for your business" and the contact line (business name, area, phone numbers).
- On the orange: "PLAY HARD. PLAY FAIR." (this text is a setting).
- Page X of Y is shown in small text on the footer of every page.

### 3.8 Later pages (page 2 onward)
- A slim black header band, about 56 high, with a 3 high orange line under it. It holds the company name on the left and "QUOTATION (continued)" on the orange slash on the right.
- The table header row repeats at the top of the table.
- The last page holds the total area, bank card, and signature together. They need roughly 250 points of free space. If they do not fit under the last row, they move to a fresh page.

---

## 4. App screens: look and feel

### 4.1 General
- White background, black top bar with the company name in bold italic and a short orange slash shape on the right (a small echo of the PDF header).
- Primary button: orange background, black bold text, rounded corners (12 pixels), full width on phones, at least 48 pixels high.
- Secondary button: white with a black border, black text.
- Danger actions (delete): red text, asks to confirm.
- Cards: light grey background, 12 pixel corners, no heavy shadows.
- Spacing: use steps of 4 (4, 8, 12, 16, 24, 32).
- Page side padding: 16 pixels.

### 4.2 PIN screen
- Black background, orange dots showing digits entered, a large number pad with big round keys.
- Wrong PIN: the dots shake once and a short message appears in red.

### 4.3 Quotation screen
- Fields stacked in one column: buyer name, buyer address, date.
- **Quotation number button:** one switch row, label "Quotation number". Off = grey track, On = orange track with a black knob. When on, a small line below shows what the next number will look like (for example "Next: SE-0007").
- Two big choices to add items: **Paste or type** and **Take photo**.

### 4.4 Review screen (item list)
- A sticky search box at the top and a sticky total bar at the bottom (orange, with the total).
- Each row: serial number, name, quantity, price, amount. Tap to edit in a bottom sheet with large inputs.
- Row actions in the sheet: Delete, Move up, Move down, Add note.
- **Needs attention** rows (missing price, unclear reading): light orange tint `#FFF0E5` with an orange strip on the left and a small "Check" tag.
- The main button at the bottom: **Create PDF**. It is disabled, with a short reason, while any row is missing a price.

### 4.5 Progress and messages
- Photo reading and PDF drawing show a progress bar in orange on light grey with plain text ("Reading photo 2 of 3").
- Error and info messages appear as a card at the top: red strip for errors, orange strip for notices. Wording follows Architecture.md section 8.

### 4.6 Home screen
- List of saved quotations as cards: buyer name in bold, date and total beneath, quotation number on the right if there is one.
- A round orange **+** button at the bottom right to start a new quotation.

---

## 5. Motion
- Keep it minimal. Only short fades and a single shake for a wrong PIN. No decorative animation.

## 6. Accessibility
- Tap targets at least 44 pixels.
- Text and background combinations must be easy to read (black on orange, white on black, ink on white).
- Never rely on color alone: highlighted rows also show a "Check" tag.

## 7. Design decisions made
1. Serial numbers are shown on every row of every quotation, beside the icon.
2. The generic icon for unmatched items is the orange star on the black circle.
