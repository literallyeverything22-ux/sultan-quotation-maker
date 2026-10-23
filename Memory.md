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
- **Current phase:** Phase 0 (Project setup) — all code, icons, database SQL, and quality checks finished; ready for Munavar's Supabase and free host setup
- **File or task being worked on right now:** Waiting for Munavar to check Phase 0 and complete the external Supabase / hosting steps
- **Next task:** Phase 1, task 1 (Build the PIN screen with a large number pad) once Munavar confirms Phase 0 is done

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
- [ ] GitHub account and free host ready
- [ ] Staff PIN and owner PIN chosen (entered only in the host's secret settings)
- [ ] Signature and stamp original photo ready
- [ ] Two or three real handwritten list photos ready for testing
- [x] `reference/` folder holds the six planning files and the sporty reference PDF
