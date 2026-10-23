# PRD: Sultan Quotation Maker

## 1. What we are building

A simple phone-friendly web app that turns a list of items (typed, pasted, or photographed) into a finished, professional quotation PDF in the sporty orange-and-black Sultan Enterprises design.

The quotation can have anywhere from 1 to 100 items. The person using it should never have to retype a long list by hand.

## 2. The problem today

- Quotations are made by hand in a word processor, one row at a time.
- Long quotations (50 to 100 items) take a very long time to type and are easy to get wrong.
- The original format looked plain and unprofessional.
- Price lists often arrive as handwritten notes or photos.
- It must work on a phone, because that is what is in hand at the shop.

## 3. Who will use it

| User | How they use it |
|------|-----------------|
| Owner (Munavar) | Creates quotations, changes business settings |
| Family staff | Create quotations from notes and photos at the shop |

Everyone uses it on a phone. Nobody is expected to be technical.

## 4. Core idea in one line

Give it a note or a photo, check the items it found, tap one button, and get a ready-to-send PDF.

## 5. Main user flow

1. Open the app on the phone.
2. Tap **New Quotation**.
3. Fill in who it is for (buyer name and address). Date is filled in automatically.
4. Add items in either of two ways:
   - **Type or paste** a list of items with prices.
   - **Take or upload a photo** of a handwritten or printed list.
5. The app reads the input and shows an **editable item table**.
6. The user checks and fixes anything that looks wrong.
7. The app calculates the total and writes the amount in words.
8. Tap **Create PDF**. The PDF opens in the sporty template.
9. Save it to the phone or share it (for example on WhatsApp).

## 6. Features

### 6.1 Must have (first version)

1. **Buyer details**
   - Buyer name and address.
   - Date defaults to today and can be changed.

2. **Text input**
   - Paste or type a list. One item per line, with a name and a price.
   - Quantity is optional. If it is missing, quantity is 1.

3. **Photo input**
   - Take a photo with the phone camera or pick one from the gallery.
   - The app reads the items and prices from the photo.
   - More than one photo can be added to the same quotation.
   - Handwriting can be misread, so the review step is required (see 6.1.4).

4. **Review and edit screen**
   - Items are one flat list in the order given (no category groups).
   - Every item shows: serial number, item name, quantity, unit price, amount.
   - The user can edit any field, delete an item, add an item, and reorder items.
   - Anything the app is unsure about is highlighted so the user checks it.
   - An optional small note line can be added under an item (for example: "Comes with coins, striker & powder").

5. **Automatic calculations**
   - Amount for each item = quantity x unit price.
   - Grand total is calculated automatically.
   - Prices are treated as already including GST (same as the current quotation).
   - Total is also written in words in the Indian style (for example: "Rupees Four Thousand Two Hundred Ten Only").

6. **PDF quotation in the sporty template**
   - Same look as the approved sporty design: black and orange header with diagonal stripes, "QUOTATION" title and date, buyer block, item table, orange total bar, amount in words, bank details card, signature and stamp, and the footer.
   - Works for 1 to 100 items.
   - Long quotations flow onto extra pages. The table header repeats on every page. The total, bank details, and signature appear only at the end.
   - Each item row has a small icon. Known items (volleyball, net, ludo, carrom, chess) get their matching icon. Everything else gets a generic sports icon.

7. **Save and share**
   - Download the PDF to the phone.
   - Share the PDF using the phone's normal share menu.

8. **Saved quotations list**
   - Past quotations are kept so they can be opened, duplicated, or edited again.
   - Staff can find a quotation by buyer name or date.

9. **Quotation number (optional, one button)**
   - A single on/off button on the quotation screen controls this.
   - **Off:** no number is shown on the quotation.
   - **On:** the app gives the quotation the next number automatically (for example SE-0001, SE-0002) and shows it next to the date on the PDF.
   - The numbers count up on their own and are never reused. The same button works for every user.

10. **Business settings** (owner only)
   - Company name, tagline, address, phone numbers, GSTIN.
   - Bank details.
   - Signature and stamp image.
   - These are filled in once and appear on every quotation.

### 6.2 Nice to have (later)

- Saved list of regular buyers, so their details fill in with one tap.
- A "valid for X days" line.
- Word (.docx) export.
- Remembering item names and prices from past quotations to suggest them.
- Handwriting in more than one language.

### 6.3 Not part of this project

- Invoicing, payments, or receipts.
- Stock or inventory.
- GST breakup (prices already include GST).
- Customer accounts or customer-facing logins.

## 7. Where it runs

- A web app opened in the phone browser.
- It can be added to the phone home screen so it opens like a normal app.
- It must work well on a small screen with one hand: large buttons, simple screens, no tiny text.
- It should work on both Android and iPhone.
- It should also open fine on a computer, but the phone is the priority.

## 8. Important behaviour for large quotations

- Typing or pasting 100 lines must not freeze the phone.
- Reading a photo with many items must show progress so the user knows it is working.
- The review screen must stay easy to use with 100 rows (scrolling, quick edit, quick delete, search within the list).
- Creating the PDF must work on a phone without needing a computer.

## 9. Data and privacy

- Quotations contain business and buyer information, so they are not public.
- Staff do not get separate logins. One shared PIN opens the app for the owner and family staff. The exact way the PIN works is decided in Architecture.md.
- Business settings (bank details, signature) are protected by a second owner PIN, so only the owner can change them.
- Bank details and signature are stored once in settings, not typed each time.

## 10. Success looks like

- A quotation with 50 to 100 items can be produced from a photo or a pasted list without retyping items one by one.
- The PDF looks the same as the approved sporty design on every page.
- A family staff member can use it on their own phone with no help.
- Totals and the amount in words are always correct.

## 11. Assumptions made (please confirm or correct)

1. Prices in the note are the final price per item, including GST.
2. If no quantity is written, quantity is 1.
3. The language of the app is English. Item names can be in English, with handwritten notes that may contain a mix of English and local words.
4. One quotation is for one buyer.
5. The signature and stamp image stays the same on every quotation.
6. Quantity is shown on every row, even when it is 1.
7. The quotation date defaults to today and can be changed.
8. Saved regular buyers are a later feature, not part of the first version.
9. The tagline "Sports Goods | Indoor Games | Equipment" and the footer line "Play hard. Play fair." stay as they are in the sporty design.

## 12. Decisions already made

1. Quotation numbering is optional and controlled by a single on/off button.
2. No separate staff logins. One shared PIN is enough.
3. Items are shown as one flat list, not grouped by category.

## 13. Open questions

1. Should the owner be able to set the starting quotation number (for example start at 101)?
2. Should the PIN be changeable by the owner from the settings screen?
