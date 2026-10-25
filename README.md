# Bite & Basket Restaurant (sample site)

Free sample by Teen Tech Technology. Plain HTML, CSS and JS. No backend, no database, no accounts.

## What it does
- Shows the Saturday buffet menu, read from `menu.json`.
- Table reservation form: name, phone, people, date, time, notes. It writes a clear WhatsApp message
  (with a reference code) to +260 965 749 929. The customer presses send.
- Takeaway / delivery order form: pick dishes and quantities, pickup or delivery address, notes. It writes the
  order as a WhatsApp message with a reference code. A total is only shown when every chosen dish has a price.
- Tap to call and open in Maps.

## Updating the menu (menu.json)
- `special.price`: set a number (for example `135`) to show the Saturday price. `null` shows "Ask us for this week's price".
  The poster says K130 but the Facebook caption says K135, so the owner must decide.
- Each dish: `name`, optional `description`, optional `price` (number, kwacha), `soldOut: true`, `special: true`.
- A dish with `choices` (for example Gulab Jamun / Basundi) is shown as one line and ordered as separate choices.
- `ordering.enabled: false` hides the order section.
- A copy of the default menu is also inside `script.js` (`FALLBACK`) in case `menu.json` cannot load. Keep it in step.

Nothing is stored. Reference codes only help both sides find the WhatsApp message again.
Site is `noindex` while it is a sample.
