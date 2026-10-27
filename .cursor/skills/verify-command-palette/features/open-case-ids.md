# Open case IDs

Open case IDs turns pasted text into 11-digit Case ID chips, ignores duplicates, rejects more than 50 IDs, and asks before opening 11 to 50 tabs. This recipe stops on the confirm screen. It does not open Seller Central.

## Sub-features

- `case-open-screen` opens the Case IDs field from the command list.
- `case-chips` shows unique IDs as chips and counts a repeated ID as ignored.
- `case-invalid` keeps a value that contains no 11-digit ID and explains why.
- `case-over-limit` rejects 51 or more IDs without opening tabs.
- `case-confirm-cancel` asks before 11 to 50 IDs and returns when the operator cancels.

## How to get to it (user POV)

- Open the palette and choose `Open case IDs`.
- The screen breadcrumb reads Commands / Open case IDs. The field label is `Paste one or more 11-digit case IDs`.
- Press Enter to submit. Shift+Enter inserts a newline and does not submit.
- Escape clears the field, then a second Escape returns to the command list. `Back` returns immediately.

## Driving it with verify-palette

Preconditions:

- `doctor` reports `ok: true`.
- The palette is open on dialog `Command Palette`.
- The identifier field is empty. If a previous identifier screen still holds text, press Escape until `status` reports the palette closed, then `shortcut` again. Identifier screens share one field until the palette closes.

- **Open the screen.** Choose `Open case IDs`. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --role option --name "Open case IDs"`. The dialog name is `Open case IDs` and a textbox named `Case IDs` is visible. The button `Open` is `disabled=true`.
- **Chips.** Paste two IDs with the first repeated. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs fill --role textbox --name "Case IDs" --value "First case 21476974831, then 21476874681.\nDuplicate: 21476974831"`. The list `Detected case IDs` contains `21476974831` and `21476874681`. Separate `StaticText` nodes read `1`, `duplicate`, and `ignored`. The button name is `Open 2 cases`.
- **Invalid.** Clear the field and enter a short number. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs press --key Escape`, then `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs fill --role textbox --name "Case IDs" --value "Case 12345"`, then `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs press --key Enter`. The textbox is `invalid=true`. An alert contains `StaticText` `Enter at least one 11-digit Case ID.` The alert's own accessible name is empty. `pages` still lists only the fixture.
- **Over the limit.** Clear, then enter 51 distinct 11-digit IDs separated by `\n`. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs press --key Escape` and `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs fill --role textbox --name "Case IDs" --value "<51 ids joined by \\n>"`. Click the rejection button: `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --role button --name "Open 51 cases"`. A `StaticText` reads `Open no more than 50 IDs at a time.` `pages` does not gain a Seller Central tab.
- **Confirm, then cancel.** Clear, enter 11 distinct 11-digit IDs, and choose the button that asks. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --role button --name "Open 11 cases"`. The dialog name is `Confirm bulk open`. A `StaticText` reads `Open 11 case tabs in the background?` Buttons `Cancel` and `Open 11 tabs` are visible. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --role button --name "Cancel"`. The dialog name returns to `Open case IDs`. `pages` still has no Seller Central tab.
- **Proof.** On the chip screen, run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs snapshot --aria --path "$EVIDENCE/open-case-ids/chips.aria.txt"` and `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs screenshot --path "$EVIDENCE/open-case-ids/chips.png"`. On the confirm screen, before Cancel, write `$EVIDENCE/open-case-ids/confirm.aria.txt` and `confirm.png`.

## Gotchas

- One to ten IDs open Seller Central tabs on Enter or on `Open N cases`. The harness exits 2 for those buttons and for Enter when the field holds 1–10 IDs. Do not work around that exit. Opening the tabs is a separate, optional check and is not part of this recipe.
- Eleven to fifty IDs stop on `Confirm bulk open`. The focused button is `Open N tabs`. Enter would open Seller Central. The harness exits 2 for that button. Use `Cancel`.
- More than 50 IDs is an in-palette error. `Open 51 cases` does not call the background worker. The background also rejects a batch over 50.
- The duplicate sentence and the unique count are split into several `StaticText` nodes. Assert `duplicate` and `ignored` under `Detected case IDs`, not one node named `1 duplicate ignored`.
- `Back` leaves leftover text in the shared identifier field. Escape clears it before you switch to shipment IDs or SKUs. Closing the palette also clears it.
- Typing an 11-digit ID into `Search commands` shows an option such as `Open case <id>`. Do not activate it. The harness exits 2. Case ID shape is 11 digits with no longer digit run beside them.
- Scrape case uses the same Case IDs field and dialog title `Scrape case`. Any `Scrape N case` or `Scrape N cases` button reads live Seller Central threads. The harness exits 2. Leave that journey for an operator who is already signed in, and do not start it from this recipe.
