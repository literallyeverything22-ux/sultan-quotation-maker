# Architecture: Sultan Quotation Maker

This file explains how the app is put together: how it flows, what it is built with, and where every file lives. It follows PRD.md. If the two ever disagree, PRD.md wins and this file must be fixed.

## 1. The big picture (plain English)

The app has four jobs:

1. **Collect items.** From typed text, or from a photo of a list.
2. **Let a person check them.** An editable table, because handwriting reading is never perfect.
3. **Do the maths.** Amounts, total, and the total in words.
4. **Draw the PDF.** In the sporty template, on the phone itself.

Three things live outside the phone:

- A small **server** that keeps secrets safe (the AI key and the PINs) and talks to the AI.
- A **database** so every staff phone sees the same saved quotations, settings, and numbering.
- An **AI service** that reads the photo and returns the items as a tidy list.

The PDF is drawn inside the phone browser. This means it works even when the connection is weak, and it costs nothing to run.

## 2. App flow

```
Open app
   |
   v
Enter PIN  --wrong 5 times--> temporary lock
   |
   v
Home: list of saved quotations  [New Quotation]  [Settings: owner PIN]
   |
   v
New Quotation
   |-- Buyer name + address, date (default today)
   |-- Quotation number button: OFF / ON
   |
   |-- Add items --+-- Type or paste text -----> local text reader (no AI needed)
   |               |
   |               +-- Take or pick photo ------> shrink photo on the phone
   |                                               -> server -> AI reads it
   |                                               -> list of items returned
   v
Review screen (editable flat list)
   |-- edit, delete, add, reorder, search
   |-- items the app is unsure about are highlighted
   |-- draft is auto-saved on the phone as you work
   v
[Create PDF]
   |-- if number button is ON: server hands out the next number now
   |-- quotation saved to the database
   |-- PDF drawn on the phone
   v
Preview -> Save to phone / Share (WhatsApp etc.)
```

## 3. Tech stack

| Part | Choice | Why (plain English) |
|------|--------|---------------------|
| App framework | Next.js (React) with TypeScript | One project holds both the screens and the small server. Well supported by coding agents. |
| Styling | Tailwind CSS | Fast to build clean phone layouts. |
| Phone install | PWA (web app that can be added to the home screen) | No app store needed. Works on Android and iPhone. |
| Database | Supabase (Postgres) free plan | Shared by all staff phones. |
| Photo reading | Google Gemini vision model, called from the server | Reads handwriting from images and has a free plan. The exact model name sits in one setting so it can be swapped. |
| PDF drawing | pdf-lib (runs in the browser) with fontkit | Lets us draw the diagonal stripes, icons, and tables exactly like the approved sporty design. |
| Fonts in PDF | Liberation Sans (Regular, Bold, Italic, Bold Italic) | Looks like Arial, free to embed. |
| Hosting | A free host for Next.js (Vercel, Netlify, or Cloudflare Pages) | Gives an https link staff can open on their phones. |
| Tests | Vitest | Checks the maths, text reader, and page splitting automatically. |

Free plans and AI limits change. Before building, check the current limits for the host, Supabase, and Gemini.

## 4. How each hard part works

### 4.1 Photo reading

1. The phone shrinks the photo (long side around 2000 pixels) so uploads are quick.
2. The shrunk photo goes to `/api/read-items`. The server adds the AI key and asks the AI model for a strict list: name, quantity, price, a note if any, and how sure it is.
3. The server checks the reply against a fixed shape. If the reply is broken or has missing fields, it is rejected and the user sees a friendly "try again" message.
4. The list comes back to the phone and opens in the review screen.
5. Several photos can be added. Each photo is its own request, so one bad photo does not spoil the rest. A progress bar shows "photo 2 of 3".
6. Photos are **not stored**. They are used once and thrown away.

What is sent to the AI: only the photo of the list and the reading instructions. Never the buyer details, bank details, or signature. On free AI plans the provider may use what is sent to improve its products, so this keeps business details out of it.

If the AI limit for the day is reached, the app shows a clear message and the text input still works.

### 4.2 Text reading

A local reader handles lines like `Cosco Acclaim - 750` or `Ludo & Snakes 260` or `Chess x2 550`. It works on the phone with no AI. A line it cannot understand is kept and highlighted for the user to fix. An optional "Fix with AI" button can send messy text to the same AI route.

### 4.3 Review screen with 100 items

- The list is built so that 100 rows scroll smoothly (only visible rows are drawn).
- A search box at the top finds an item by name.
- Quick actions on each row: edit, delete, move up or down.
- Highlighted rows: unsure reading, missing price, or a price that looks very different from the others.
- Every change is auto-saved to the phone as a draft, so a dropped connection or a closed browser does not lose work.

### 4.4 Maths

- Money is stored as whole paise (integers) to avoid rounding mistakes.
- Item amount = quantity x unit price.
- Total = sum of all item amounts. Prices already include GST, so there is no GST addition.
- Amount in words uses the Indian system (thousand, lakh, crore). This is covered by automatic tests.

### 4.5 Quotation numbers (the single button)

- The button on the quotation screen is a simple on/off switch.
- **Off:** nothing is shown or used.
- **On:** the number is given **when Create PDF is tapped**, not when the button is switched on. This way, quotations that are abandoned do not use up numbers.
- The server hands out the next number in one safe step, so two staff using the app at the same time can never get the same number.
- Format: `SE-0001`, `SE-0002`, and so on. The prefix `SE` is a setting.

### 4.6 PDF drawing and long quotations

- The PDF is drawn in the browser with pdf-lib using the same layout as the approved sporty design (A4 page).
- **Page 1:** full header (black and orange, QUOTATION title, date, number if on), buyer block, then the start of the table.
- **Next pages:** a slimmer header, and the table header row repeats.
- **Row heights:** normal rows are shorter, rows with a note line are taller. The code measures space left on the page before placing each row and starts a new page when needed.
- **Last page:** total bar, amount in words, bank details card, signature and stamp. These stay together. If they do not fit under the last row, they move to a fresh page.
- **Every page:** footer with business name, and "Page X of Y".
- **Icons:** each row gets a small icon chosen by matching words in the item name (ball, net, ludo, carrom, chess and similar). Anything unmatched gets a generic sports icon. Icons are drawn with simple shapes, so they stay sharp and light.
- A 100-item quotation should come out at roughly 7 to 8 pages.
- The signature and stamp image is stored once in settings, prepared with a transparent background, and reused.

### 4.7 Sharing

The phone's normal share sheet is used (Web Share with the PDF file). If the phone or browser does not support it, the PDF is downloaded instead.

### 4.8 PIN and access

- Two PINs: a **staff PIN** that opens the app for everyone, and an **owner PIN** that unlocks the settings screen.
- PINs are kept only as hashed values in server settings, never in the app code.
- After a correct PIN the server gives the phone a private session that lasts a while, so staff are not asked every time.
- Five wrong tries causes a temporary lock.
- Changing a PIN from inside the app is a later feature. For the first version the PINs are set when the app is installed.

## 5. Data (what is saved in the database)

| Table | What it holds |
|-------|---------------|
| `settings` | One row: company name, tagline, address, phones, GSTIN, bank details, signature image reference, number prefix |
| `quotations` | One row per quotation: id, number (can be empty), buyer name, buyer address, date, items list, total, created time |
| `counters` | The last quotation number given out |

- The items list is stored inside the quotation row as a flat list. Each item has: id, name, quantity, unit price (in paise), optional note, and icon key.
- Nothing in the database is open to the public. Only the server talks to it.
- The signature image is kept in Supabase Storage and read when drawing the PDF.

## 6. Folder and file structure

```
sultan-quotation-maker/
├── PRD.md
├── Architecture.md
├── Rules.md
├── Phases.md
├── Design.md
├── Memory.md
├── .env.example                 (names of secrets, no real values)
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── public/
│   ├── manifest.webmanifest     (makes it installable on the phone)
│   ├── icons/                   (app icons)
│   └── fonts/                   (Liberation Sans files used in the PDF)
├── supabase/
│   └── schema.sql               (creates the three tables)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             (home: saved quotations)
│   │   ├── pin/page.tsx         (PIN screen)
│   │   ├── new/page.tsx         (new quotation)
│   │   ├── q/[id]/page.tsx      (open, edit, re-create a saved quotation)
│   │   ├── settings/page.tsx    (owner only)
│   │   └── api/
│   │       ├── auth/route.ts            (check PIN, start session)
│   │       ├── read-items/route.ts      (photo -> AI -> items)
│   │       ├── quotations/route.ts      (list, save)
│   │       ├── quotations/[id]/route.ts (open, update)
│   │       ├── next-number/route.ts     (hand out next quotation number)
│   │       └── settings/route.ts        (read, update)
│   ├── components/
│   │   ├── PinPad.tsx
│   │   ├── BuyerForm.tsx
│   │   ├── NumberToggle.tsx     (the single on/off button)
│   │   ├── TextPaste.tsx
│   │   ├── PhotoPicker.tsx
│   │   ├── ItemList.tsx
│   │   ├── ItemRow.tsx
│   │   ├── TotalBar.tsx
│   │   └── PdfPreview.tsx
│   ├── lib/
│   │   ├── pdf/
│   │   │   ├── buildQuotationPdf.ts   (main entry)
│   │   │   ├── layout.ts              (page splitting, row heights)
│   │   │   ├── theme.ts               (colors, sizes from Design.md)
│   │   │   ├── icons.ts               (the small drawn icons + word matching)
│   │   │   └── fonts.ts
│   │   ├── parse/
│   │   │   └── parseTextList.ts
│   │   ├── ai/
│   │   │   ├── readItemsFromImage.ts
│   │   │   ├── prompt.ts
│   │   │   └── itemSchema.ts
│   │   ├── money/
│   │   │   ├── amountInWords.ts
│   │   │   └── formatMoney.ts
│   │   ├── image/
│   │   │   └── shrinkPhoto.ts
│   │   ├── auth/
│   │   │   ├── pin.ts
│   │   │   └── session.ts
│   │   ├── db/
│   │   │   └── supabaseServer.ts
│   │   └── draft/
│   │       └── draftStore.ts          (auto-save on the phone)
│   └── types/
│       └── quotation.ts
└── tests/
    ├── amountInWords.test.ts
    ├── parseTextList.test.ts
    └── pagination.test.ts
```

## 7. Secrets and settings (names only)

| Name | Used for |
|------|----------|
| `GEMINI_API_KEY` | Server calls to the AI |
| `GEMINI_MODEL` | Which AI model to use (easy to change) |
| `SUPABASE_URL` | Database address |
| `SUPABASE_SERVICE_KEY` | Server-only database key |
| `STAFF_PIN_HASH` | Staff PIN (hashed) |
| `OWNER_PIN_HASH` | Owner PIN (hashed) |
| `SESSION_SECRET` | Signs the session |

These live only in the host's secret settings and a local `.env` file. They are never put in the app code or sent to the phone.

## 8. Things that can go wrong and what the app does

| Problem | What the user sees |
|---------|--------------------|
| Bad or blurry photo | "Could not read this photo. Try a clearer one or paste text." |
| AI daily limit reached | "Photo reading is paused for today. You can still paste text." |
| AI returns broken data | "Something went wrong. Try again." Nothing is lost. |
| Internet drops while editing | Draft stays on the phone. Saving is retried when back online. |
| Two staff create numbered quotations at the same moment | Each gets a different number. |
| An item has no price | The row is highlighted and Create PDF asks to fix it first. |
| Very long item name | It wraps to two lines in the PDF. |
| Wrong PIN many times | Temporary lock. |

## 9. Decisions in this file to confirm

1. **Supabase plus a free Next.js host.** Chosen because it matches tools already used on other projects.
2. **Two PINs** (staff and owner), so only the owner can open settings. PRD.md says one shared PIN opens the app and only the owner changes settings, so a second PIN is the simplest way to do both.
3. **Photos are not stored** after reading.
4. **PDF drawn on the phone**, not on a server.
