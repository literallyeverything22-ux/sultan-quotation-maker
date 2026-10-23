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
- **Current phase:** Phase 0 (Project setup), not started
- **File or task being worked on right now:** none yet
- **Next task:** Phase 0, task 1 (create the Next.js project with the folder structure from Architecture.md)

## Completed
(nothing yet)

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
- [ ] Supabase project created
- [ ] Gemini API key created in Google AI Studio
- [ ] GitHub account and free host ready
- [ ] Staff PIN and owner PIN chosen (entered only in the host's secret settings)
- [ ] Signature and stamp original photo ready
- [ ] Two or three real handwritten list photos ready for testing
- [ ] `reference/` folder holds the six planning files and the sporty reference PDF
