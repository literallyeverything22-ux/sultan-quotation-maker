# Rules: Sultan Quotation Maker

These rules are for the coding agent (and for anyone helping build this app). Read this file, PRD.md, Architecture.md, Phases.md, Design.md and Memory.md before starting any task. If rules and a request ever clash, stop and ask Munavar.

## 1. How to work

1. Work on **one phase and one task at a time**, as listed in Phases.md. Do not jump ahead.
2. Build only what PRD.md asks for. If an idea is not in the PRD, suggest it in plain words and wait. Do not add it.
3. Before writing code for a task, say in two or three plain sentences what you are about to do.
4. After each task, **update Memory.md** (what was finished, what file is being worked on, what is next).
5. Keep files small and focused. If a file grows past about 300 lines, split it.
6. Explain things to Munavar in **plain English, step by step, without jargon**. He is not a programmer. Do not give time estimates or dates.
7. At the end of each task, give a short "how to check it on your phone" list.

## 2. What to use

| Need | Use |
|------|-----|
| Framework | Next.js (App Router) with TypeScript in strict mode |
| Styling | Tailwind CSS only |
| PDF drawing | `pdf-lib` with `@pdf-lib/fontkit` |
| PDF font | Liberation Sans (Regular, Bold, Italic, Bold Italic) stored in `public/fonts` |
| Database | Supabase, used from the server only |
| Input checking | `zod` for every request and every AI reply |
| Long lists on phone | `@tanstack/react-virtual` so 100 rows scroll smoothly |
| PIN hashing | A standard, well-known hashing library (for example `bcryptjs`) |
| Session | A signed, httpOnly cookie made with a well-known library (for example `jose`) |
| AI photo reading | Google's official Gemini SDK for JavaScript. Check its current package name and model names in the official docs before using. |
| Tests | Vitest |
| Photo shrinking | The browser's own canvas. No extra library. |

## 3. What to avoid

- **No headless browser or "print the page to PDF" approach** (Puppeteer, html2canvas, window.print). They are blurry, break pages badly, and will not run on free hosting or a phone.
- **No second PDF library.** Only `pdf-lib`.
- **No ORMs, state management libraries, UI kits, or animation libraries.** Plain React, Tailwind, and the libraries above are enough.
- **No new package** without asking Munavar first and explaining why in plain words.
- **No `any` type** in TypeScript. No ignoring type errors.
- **No rupee symbol (₹) in the PDF.** The PDF font does not have it. Write **Rs.** instead.
- **No special subscript or superscript characters** in the PDF.
- **No storing of photos.** A photo is used once to read items, then thrown away.
- **No secrets in the code**, in the browser, in logs, or in git.
- **No decimals for money in code.** Money is whole paise (integers). Only convert to rupees when showing it.
- **No hardcoding business details** (name, phones, GSTIN, bank details, tagline) inside components or the PDF code. They come from the settings row.
- **No hover-only actions.** Everything must work by tapping.

## 4. Phone-first rules

- Design and test at **360 pixels wide** first. Then check larger screens.
- Tap targets (buttons, toggles, row actions) must be at least **44 pixels** high and wide.
- Text inside input boxes must be at least **16 pixels**, so iPhones do not zoom in.
- Respect the phone's safe areas (notch and bottom bar).
- One main action per screen, clearly visible. The main button stays reachable with a thumb.
- The long item list must remain smooth with **100 rows**. Use list virtualization.
- Never block the screen with a long task without showing progress (photo reading, PDF drawing).
- The app must install to the home screen and open full screen.

## 5. PDF rules

1. The PDF is drawn by **one pure function**: quotation data in, PDF bytes out. No screen code inside it. This keeps it easy to test.
2. Page size is **A4**. Use vector shapes only. All fonts are embedded.
3. The look must match **Design.md** exactly (colors, header stripes, icons, total bar, bank card, footer). Do not restyle it.
4. Measure text with the font before drawing it. Long names wrap to the next line. **Text must never overlap or run outside its box.**
5. Before drawing each row, check the space left on the page. If it does not fit, start a new page.
6. Repeat the table header on every page after the first.
7. Keep the total bar, amount in words, bank card, and signature together on the last page. If they do not fit, move them all to a new page.
8. Show "Page X of Y" in the footer of every page.
9. Pick each row icon by matching words in the item name. Unknown items get the generic sports icon. Never fail because of an unknown item.
10. Amount in words follows the Indian system (thousand, lakh, crore) and always ends with "Only".
11. A PDF with 1 item and a PDF with 100 items must both look correct. Test both.

## 6. Error handling

1. **Every server route** answers in the same shape: either `ok: true` with data, or `ok: false` with an error code and a friendly message.
2. **Check everything that comes in** with `zod`: forms, request bodies, and especially **AI replies**. Treat an AI reply as untrusted. If it does not match the expected shape, reject it and show a friendly message. Never crash.
3. **User messages are friendly and plain.** No technical words, no stack traces. Technical details go to the server log only, without buyer names or bank details.
4. **Never lose work.** The draft is auto-saved on the phone as the user edits. A failed save or a lost connection must not clear it.
5. **AI calls:** set a time limit, retry once on a temporary failure, then show "Could not read this photo. Try a clearer one or paste text." If the daily limit is reached, say so and keep text input working.
6. **No silent failures.** If something fails, the user must be told.
7. **Each screen has an error fallback** so one broken part does not blank the whole app.
8. **Missing price or quantity:** highlight the row, and ask the user to fix it before the PDF is created. Do not guess.
9. **Numbering:** the next number is handed out by one safe database step. If saving fails after a number is handed out, show the error and do not create a second number when the user retries.
10. Messages must match the table in Architecture.md section 8.

## 7. Security rules

- PINs are stored only as hashes. Never log or display a PIN.
- Five wrong PIN tries lock the screen temporarily.
- The session cookie is httpOnly and secure.
- The database key lives on the server only. The database is never opened to the public. Row-level security stays on.
- Settings routes check for the **owner** session. Staff access must be refused.
- Only the list photo and reading instructions go to the AI. **Never send buyer details, bank details, or the signature image to the AI.**
- Do not log buyer names, addresses, or bank details.

## 8. Code quality rules

- Clear names in plain English. A function should do one thing.
- Add a short plain-English comment above anything that is not obvious (for example page-splitting logic, numbering).
- Put the colors, sizes, and spacing of the PDF in `theme.ts`, not scattered through the code.
- Write automatic tests for: amount in words, text list reading, money maths, and page splitting (including 1, 14, 15, 50, and 100 items).
- Before saying a task is done, run: type check, lint, tests, and a production build. Report the result in plain words.

## 9. Boundaries for the AI agent

### The agent may do without asking
- Create and edit files inside the project folder, as required by the current task.
- Write and run tests.
- Fix bugs in code it wrote in this project.
- Update Memory.md.

### The agent must ask Munavar first
- Adding any new library.
- Changing the database tables.
- Changing the folder structure in Architecture.md.
- Changing anything in PRD.md, Design.md, or the tech stack.
- Anything that could cost money (paid plans, paid AI usage).
- Deleting a file or a feature.
- Changing how money, numbering, or amount-in-words work.

### The agent must never do
- Touch, print, or commit real secrets or `.env` values.
- Run destructive database commands (drop, delete all) without an explicit yes.
- Change the approved sporty look.
- Remove or weaken tests to make them pass.
- Rewrite the history in Memory.md. Only add to it.
- Send real buyer or bank data to any outside service other than the database.
- Guess at missing information. If something is unclear, ask.

## 10. A task is done only when

1. It does what Phases.md says for that task.
2. Tests pass and the build succeeds.
3. It works on a 360 pixel wide phone screen.
4. Memory.md is updated.
5. Munavar has been told, in plain English, what changed and how to check it.
