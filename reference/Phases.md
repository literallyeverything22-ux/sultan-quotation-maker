# Phases: Sultan Quotation Maker

The project is built in phases, one at a time, in this order. Each phase ends with something Munavar can open and check on his phone. Do not start a phase until the one before it is finished and checked.

After every task, update Memory.md.

## Why this order

- The app becomes useful early: typed lists turn into a PDF before photo reading is added.
- Photo reading (the AI part) comes late. If AI limits or reading quality cause trouble, everything else already works.
- The PDF is built before saving, so the most important result can be judged early.

---

## Phase 0: Project setup

**Goal:** An empty but working app that opens on a phone.

**Tasks**
1. Create the Next.js project (TypeScript strict, Tailwind) with the folder structure from Architecture.md.
2. Add Vitest, lint, and type check.
3. Add `.env.example` with the secret names (no real values).
4. Add the PWA manifest and app icons so it can be added to the home screen.
5. Create the Supabase project and `supabase/schema.sql` with the three tables (`settings`, `quotations`, `counters`).
6. Put the app on the free host so it has an https link.

**Done when**
- The link opens on Munavar's phone and shows a simple start screen.
- It can be added to the home screen.
- Type check, lint, tests, and build all pass.

---

## Phase 1: PIN access

**Goal:** Only people with the PIN can get in.

**Tasks**
1. Build the PIN screen with a large number pad.
2. Check the staff PIN on the server and start a session.
3. Lock temporarily after five wrong tries.
4. Add the owner PIN for the settings area.
5. Protect every page and server route (staff routes need a session, settings routes need the owner session).

**Done when**
- A wrong PIN is refused. The right staff PIN opens the home screen.
- Staff cannot open settings. The owner PIN can.
- Five wrong tries causes a lock with a clear message.

---

## Phase 2: Business settings (owner only)

**Goal:** Business details are entered once and used everywhere.

**Tasks**
1. Settings screen with: company name, tagline, address lines, phone numbers, GSTIN, bank details, quotation number prefix.
2. Signature and stamp upload. The app removes the paper background so the stamp sits cleanly on white, and shows a preview.
3. Save to the `settings` row. Signature image goes into storage.
4. Footer line ("Play hard. Play fair.") as a setting.

**Done when**
- The owner can fill in and save every field, and the values are still there after closing and reopening the app.
- The uploaded signature shows a clean preview.

---

## Phase 3: Money and text-reading foundations

**Goal:** The calculating and reading logic is correct before any screens use it.

**Tasks**
1. `formatMoney`: whole paise in, Indian-style display out (for example 1,700.00).
2. `amountInWords`: Indian system, ends with "Only". Tests for small numbers, thousands, lakhs, crores, and paise.
3. `parseTextList`: reads lines like `Cosco Acclaim - 750`, `Ludo & Snakes 260`, `Chess x2 550`. Unclear lines are kept and flagged, not dropped.
4. Automatic tests for all three, including messy input.

**Done when**
- All tests pass.
- 4210 reads "Rupees Four Thousand Two Hundred Ten Only".

---

## Phase 4: New quotation and the item list

**Goal:** Type or paste a list, check it, and see the correct total.

**Tasks**
1. New Quotation screen with buyer name, buyer address, and date (default today, can be changed).
2. Text paste box that fills the item list using `parseTextList`.
3. Review screen as one flat list: serial number, name, quantity, unit price, amount.
4. Edit, delete, add, move up or down, and an optional note line under an item.
5. Search box above the list.
6. Highlight rows that need attention (missing price, unclear line).
7. Total bar and amount in words that update as items change.
8. Auto-save the draft on the phone as the user works.
9. List virtualization so 100 rows stay smooth.

**Done when**
- Pasting 100 lines gives 100 rows and the phone stays smooth.
- Edits change the amounts and total immediately.
- Closing and reopening the browser brings the draft back.

---

## Phase 5: The sporty PDF engine

**Goal:** The PDF looks exactly like the approved sporty design, for any number of items.

**Tasks**
1. `theme.ts` with the colors and sizes from Design.md.
2. Embed the Liberation Sans fonts.
3. Draw page 1: header with diagonal stripes, QUOTATION title, date, buyer block.
4. Draw the item table with zebra rows, the note line, and the orange line under the last row.
5. Draw the icons (volleyball, net, dice, carrom, chess, and the generic sports icon) and the word-matching that picks them.
6. Draw the total bar, amount in words, bank details card, signature and stamp, and the footer.
7. Pagination: slim header and repeated table header on later pages, last-page block kept together, "Page X of Y".
8. A temporary test page that builds sample PDFs with 1, 5, 14, 15, 50, and 100 items.
9. Tests for the page-splitting rules.

**Done when**
- The 5-item sample matches the approved sporty PDF.
- The 100-item sample runs on Munavar's phone, looks correct on every page, and nothing overlaps or is cut off.
- Long item names wrap neatly.

---

## Phase 6: Create PDF, preview, and share

**Goal:** From the review screen to a PDF in hand.

**Tasks**
1. **Create PDF** button on the review screen. It blocks if any row is missing a price.
2. Show progress while the PDF is drawn.
3. PDF preview screen.
4. **Save to phone** and **Share** (phone share menu, with a download fallback).

**Done when**
- A pasted list becomes a PDF on the phone, which can be shared to WhatsApp.

---

## Phase 7: Save and history

**Goal:** Quotations are kept and can be reused.

**Tasks**
1. Save each created quotation to the database.
2. Home screen list of saved quotations, newest first, showing buyer, date, and total.
3. Search by buyer name or date.
4. Open a saved quotation to view, edit, and create the PDF again.
5. Duplicate a quotation to start a new one from it.

**Done when**
- A quotation created on one phone can be opened on another phone.
- Edit and duplicate both work.

---

## Phase 8: Quotation number (the single button)

**Goal:** The on/off numbering button works safely.

**Tasks**
1. Add the on/off button to the quotation screen.
2. When Create PDF is tapped and the button is on, the server hands out the next number in one safe step.
3. Show the number next to the date on the PDF and in the saved list.
4. Make sure retrying a failed save never creates a second number.
5. Test two phones creating numbered quotations at the same moment.

**Done when**
- Off: no number anywhere. On: the next number appears.
- Abandoned drafts do not use numbers.
- Two phones at the same time never get the same number.

---

## Phase 9: Photo reading

**Goal:** A photo of a list becomes items in the review screen.

**Tasks**
1. Camera and gallery picker, with several photos allowed.
2. Shrink the photo on the phone before sending.
3. `/api/read-items` route: sends the photo to the AI, checks the reply, returns the items.
4. Mark items the AI is unsure about so the review screen highlights them.
5. Progress bar ("photo 2 of 3") and friendly messages for a bad photo, a daily limit, or a broken reply.
6. Make sure only the list photo is sent, never buyer or bank details.
7. Test with the real handwritten list and with a long printed list.

**Done when**
- A photo of the handwritten list from the first quotation gives the five items and prices, with anything uncertain highlighted.
- A bad photo gives a clear message and loses nothing.
- Text input still works when photo reading is unavailable.

---

## Phase 10: Polish and hardening

**Goal:** Ready for the whole family to use every day.

**Tasks**
1. An error fallback on every screen.
2. Check the full flow on an Android phone and an iPhone.
3. Run a 100-item quotation from a photo, from start to a shared PDF.
4. Check that the app installs and opens full screen.
5. Review the security rules in Rules.md one by one.
6. Fix anything awkward found during real use.

**Done when**
- A family staff member makes a quotation on their own phone without help.
- Every rule in Rules.md is satisfied.

---

## Later ideas (not part of the first version)

- Saved list of regular buyers.
- Changing the PIN from inside the app.
- Valid-for-X-days line.
- Word export.
- Remembering item names and prices from past quotations.
- Setting the starting quotation number.
