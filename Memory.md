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
- **Current phase:** Phase 1 (PIN access) — all 5 tasks and tests finished; waiting for Munavar to set `STAFF_PIN_HASH`, `OWNER_PIN_HASH`, and `SESSION_SECRET` and test on his phone
- **File or task being worked on right now:** Waiting for Munavar to verify Phase 1 on his phone
- **Next task:** Phase 2, task 1 (Settings screen with business and bank details) once Munavar confirms Phase 1

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
- [ ] Staff PIN and owner PIN chosen (entered only in the host's secret settings)
- [ ] Signature and stamp original photo ready
- [ ] Two or three real handwritten list photos ready for testing
- [x] `reference/` folder holds the six planning files and the sporty reference PDF
