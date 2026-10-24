# Memory: Sultan Quotation Maker

This is the agent's running notes. Read it at the start of every session. Update it after every task. **Only add to the history. Never rewrite or delete old entries.**

## Project in one line
A phone-friendly web app that turns typed or photographed item lists into a professional sporty-themed quotation PDF for Sultan Enterprises.

## Planning files (all finished)
- [x] PRD.md
- [x] Architecture.md
- [x] Rules.md
- [x] Phases.md
- [x] Design.md
- [x] Memory.md (this file)

Visual target for the PDF: `reference/Quotation_Sporty_Central_Prison_Kadapa.pdf`

## Current status
- **Current phase:** Phase 7 (Save and history) — all 5 tasks finished and tested; ready for Munavar to check on his phone
- **File or task being worked on right now:** Waiting for Munavar to check Phase 7 on his phone
- **Next task:** Phase 8, task 1 (Quotation number on/off button `src/components/NumberToggle.tsx` and `/api/next-number`) once Munavar confirms Phase 7

## Completed
(nothing yet)
- [x] Phase 0, task 1: Created the Next.js project (TypeScript strict, Tailwind CSS) with the full folder and file structure from Architecture.md, plus a sporty phone-first start screen.
- [x] Phase 0, task 2: Added Vitest, ESLint (`no-explicit-any`), and TypeScript strict check scripts (`test`, `lint`, `typecheck`).
- [x] Phase 0, task 3: Added `.env.example` with all seven secret names from Architecture.md section 7 and no real values.
- [x] Phase 0, task 4: Added `public/manifest.webmanifest` and sporty black-and-orange app icons (`public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon.svg`) for home screen installation.
- [x] Phase 0, task 5 (code part): Created `supabase/schema.sql` with the three tables (`settings`, `quotations`, `counters`), atomic number counter helper, and Row-Level Security enabled.
- [x] Phase 0, task 5 (Supabase live check): Munavar created the Supabase project, ran `supabase/schema.sql`, and configured `.env.local`; verified live connection to `settings` (1 default row), `quotations` (0 rows), and `counters` (1 default row).
- [x] Phase 0 quality checks: Verified `npm run typecheck`, `npm run lint`, `npm run test` (3/3 passed), and `npm run build` all pass with zero errors.
- [x] Pushed Phase 0 project to private GitHub repository (`https://github.com/RevivedSoul37/sultan-quotation-maker`).
- [x] Pushed Phase 0 project to `https://github.com/literallyeverything22-ux/sultan-quotation-maker.git`.
- [x] Phase 0, task 6: Deployed on Vercel and verified on Munavar's mobile phone (Home, New Quotation, and Business Settings screens all working).
- [x] Phase 1, task 1: Built the PIN lock screen (`src/components/PinPad.tsx` and `src/app/pin/page.tsx`) with black background, orange digit dots, single-shake error animation, and 72px round number keys.
- [x] Phase 1, task 2: Implemented server PIN verification and signed httpOnly session cookies (`src/lib/auth/pin.ts`, `src/lib/auth/session.ts`, `src/app/api/auth/route.ts`).
- [x] Phase 1, task 3: Implemented 5-wrong-tries temporary lock (memory + signed cookie state so serverless restarts cannot bypass the lock).
- [x] Phase 1, task 4: Added Owner PIN verification (`mode="owner"`) for unlocking the Business Settings area.
- [x] Phase 1, task 5: Protected every page (`page.tsx`, `new/page.tsx`, `q/[id]/page.tsx`, `settings/page.tsx`) and every server API route (`read-items`, `quotations`, `quotations/[id]`, `next-number`, `settings`), and added unit tests for PIN verification, 5-try lockout, and signed session tokens.
- [x] Phase 1 live verification: Verified on `https://sultan-quotation-maker.vercel.app` that unauthenticated requests redirect to `/pin`, wrong PIN is refused, Staff PIN opens the home screen (`STAFF ACCESS`) and is blocked from `/settings`, and Owner PIN unlocks `/settings` (`OWNER ONLY — UNLOCKED`).
- [x] Phase 2, task 1: Built the Owner Business Settings screen (`src/app/settings/page.tsx`) with company name, tagline, address lines 1 & 2, phone numbers, GSTIN, bank details (Bank Name, A/C Holder, A/C Number, IFSC Code, Branch Code), and quotation number prefix.
- [x] Phase 2, task 2: Implemented browser canvas signature & stamp paper-background removal (`src/lib/image/shrinkPhoto.ts`) with adjustable strength slider and live preview on white.
- [x] Phase 2, task 3: Implemented server-only Supabase settings read/write and private `signatures` storage bucket upload/download (`src/lib/db/supabaseServer.ts` and `src/app/api/settings/route.ts`).
- [x] Phase 2, task 4: Added the footer slogan line ("PLAY HARD. PLAY FAIR.") as an editable setting in `settings`.
- [x] Phase 3, task 1: Implemented `formatMoney`, `formatMoneyWithRs`, `rupeesToPaise`, and integer paise totals in `src/lib/money/formatMoney.ts`.
- [x] Phase 3, task 2: Implemented Indian-system `amountInWords` and `rupeesInWords` in `src/lib/money/amountInWords.ts`.
- [x] Phase 3, task 3: Implemented `parseTextList` in `src/lib/parse/parseTextList.ts` and equipment icon word-matching `matchIconKey` in `src/lib/pdf/icons.ts`.
- [x] Phase 3, task 4: Added automatic Vitest tests in `tests/amountInWords.test.ts` and `tests/parseTextList.test.ts` covering `formatMoney`, `amountInWords` (small numbers, thousands, lakhs, crores, paise, and 4210 -> "Rupees Four Thousand Two Hundred Ten Only"), and `parseTextList` (clean and messy inputs).
- [x] Phase 4, task 1: Built `src/components/BuyerForm.tsx` with buyer name, buyer address, and date (defaulting to today).
- [x] Phase 4, task 2: Built `src/components/TextPaste.tsx` that fills or appends to the item list using `parseTextList`.
- [x] Phase 4, task 3: Built the flat item review list (`src/components/ItemRow.tsx` and `src/components/ItemList.tsx`) showing serial number, name, quantity, unit price, and amount.
- [x] Phase 4, task 4: Built the bottom-sheet row editor to edit fields, delete, add, move up or down, and add an optional note line under an item.
- [x] Phase 4, task 5: Added the sticky search box above the item list.
- [x] Phase 4, task 6: Highlighted rows that need attention (missing price or unclear reading) with `#FFF0E5` tint, left orange border, and `Check` badge.
- [x] Phase 4, task 7: Built `src/components/TotalBar.tsx` with live grand total, Indian amount in words, and missing-price check before PDF creation.
- [x] Phase 4, task 8: Built `src/lib/draft/draftStore.ts` and connected auto-save in `src/app/new/page.tsx`.
- [x] Phase 4, task 9: Added list virtualization with `@tanstack/react-virtual` in `src/components/ItemList.tsx` so 100 rows scroll smoothly on a phone.
- [x] Phase 5, task 1: Built `src/lib/pdf/theme.ts` with all colors, font sizes, layout dimensions, and sample items from Design.md.
- [x] Phase 5, task 2: Added the 4 Liberation Sans TTF font files (`public/fonts/LiberationSans-*.ttf`) and built `src/lib/pdf/fonts.ts` to embed them via `@pdf-lib/fontkit`.
- [x] Phase 5, task 3: Implemented Page 1 sporty header with diagonal orange slash, thin stripes, faint ball circle, QUOTATION title, date, optional quotation number, and buyer block (`src/lib/pdf/buildQuotationPdf.ts`).
- [x] Phase 5, task 4: Implemented the item table with alternating zebra rows, serial numbers, wrapped item names, italic note lines, and 3pt closing orange line.
- [x] Phase 5, task 5: Implemented vector equipment icons (`ball`, `net`, `dice`, `carrom`, `chess`, and `generic` orange star) in `src/lib/pdf/icons.ts`.
- [x] Phase 5, task 6: Implemented the slanted orange total bar, Indian amount in words, rounded black Bank Details card, Signature & Stamp embedding, and every-page footer (`src/lib/pdf/buildQuotationPdf.ts` and `src/lib/pdf/fonts.ts`).
- [x] Phase 5, task 7: Implemented multi-page pagination (`src/lib/pdf/layout.ts`) with slim header ("QUOTATION (continued)"), repeated table header, atomic closing block, and "Page X of Y".
- [x] Phase 5, task 8: Built `src/components/PdfPreview.tsx` with the sample PDF test bench for 1, 5, 14, 15, 50, and 100 items, plus live preview, download, and share actions.
- [x] Phase 5, task 9: Added automatic pagination and PDF generation tests (`tests/pagination.test.ts`) for 1, 5, 14, 15, 50, and 100 items and long wrapped item names.
- [x] Phase 6, tasks 1–4: Connected the Create PDF button, progress indicator, inline PDF preview, Save to Phone download, and native Web Share (`navigator.share`) in `src/components/PdfPreview.tsx` and `src/app/new/page.tsx`.
- [x] Phase 7, task 1: Implemented server database helpers (`listQuotationsFromDb`, `getQuotationByIdFromDb`, `createQuotationInDb`, `updateQuotationInDb` in `src/lib/db/supabaseServer.ts`) and API routes (`src/app/api/quotations/route.ts` and `src/app/api/quotations/[id]/route.ts`), saving quotations when Create PDF is tapped.
- [x] Phase 7, task 2: Updated the Home screen (`src/app/page.tsx`) to show saved quotations newest first with buyer name, date, item count, total, and quotation number badge.
- [x] Phase 7, task 3: Added search by buyer name or date on the Home screen (`src/app/page.tsx`).
- [x] Phase 7, task 4: Built the saved quotation view/edit/re-create PDF screen (`src/app/q/[id]/page.tsx`).
- [x] Phase 7, task 5: Added Duplicate buttons on both the Home screen and `/q/[id]` to copy a saved quotation into a fresh draft on `/new`.

## Decisions log (add new decisions at the bottom)
1. Quotation number is optional, controlled by one on/off button. The number is handed out only when Create PDF is tapped.
2. No separate staff logins. A staff PIN opens the app, and a second owner PIN unlocks settings.
3. Items are one flat list, no categories.
4. Photos are not stored after reading.
5. The PDF is drawn on the phone with pdf-lib.
6. Serial numbers are shown on every PDF row.
7. The generic icon for unmatched items is an orange star on the black circle.
8. Money is stored as whole paise. The PDF writes "Rs." because the font has no rupee symbol.

## Known issues and open questions
- Starting quotation number cannot be set yet (later feature).
- PIN cannot be changed from inside the app yet (later feature).
- Check current free-plan limits and the current Gemini model name before Phase 9.

## Notes for Munavar's setup (done outside the code)
- [x] Supabase project created
- [ ] Gemini API key created in Google AI Studio
- [x] GitHub account and free host ready
- [x] Staff PIN and owner PIN chosen (entered only in the host's secret settings)
- [ ] Signature and stamp original photo ready
- [ ] Two or three real handwritten list photos ready for testing
- [x] `reference/` folder holds the six planning files and the sporty reference PDF
