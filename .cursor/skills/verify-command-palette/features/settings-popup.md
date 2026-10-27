# Settings popup

The toolbar icon opens a settings popup that toggles commands, shows diagnostics, and links to the Time Out form and Accounts. The harness opens the same popup document in a tab because the real toolbar popup closes when it loses focus.

## Sub-features

- `popup-open` shows S4E Spotlight and one switch per command.
- `popup-toggle` turns Search SKUs off and the next palette on a reloaded page hides that command.
- `popup-restore` turns the switch back on and the command returns after another reload.
- `popup-diagnostics` clears logs and reports a download count without copying the file.
- `popup-timeout-form` opens the local Time Out form page and does not open Google.

## How to get to it (user POV)

- Click the toolbar icon. Its title is `Settings`. The popup heading is `S4E Spotlight`, with the shortcut hint `to open`.
- Each command has a switch. `Open Time Out` also has `Edit form values`. `Switch store` also has `Manage accounts`.
- Diagnostics shows the last report timing when one exists, otherwise `Timings and errors from report runs show here.` Buttons are `Clear` and `Download logs`.
- `Edit form values` opens the extension page titled `Time Out form`.

## Driving it with verify-palette

Preconditions:

- `doctor` reports `ok: true` and includes `extensionId`.
- The disposable profile still has the default switches on. If a previous recipe turned one off, turn it on and reload the fixture before starting here.

- **Open the popup.** Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs new-tab --page popup.html`. On `--target popup`, the document is `Settings`, the heading is `S4E Spotlight`, and the list is `Commands`. Switches `Open case IDs`, `Scrape case`, `Open shipment IDs`, `Search SKUs`, `Open Time Out`, `Generate reports`, and `Switch store` are `checked=true`. The region `Diagnostics` is visible.
- **Turn Search SKUs off.** Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --target popup --role switch --name "Search SKUs"`. That switch is `checked=false`. The others stay `checked=true`.
- **Palette hides it.** Reload the fixture and open the palette. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs open` and `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs shortcut`. Option `Open case IDs` is present. Option `Search SKUs` is absent. Close the palette with Escape.
- **Restore.** Click the same switch again so it is `checked=true`. Reload with `open`, then `shortcut`. Option `Search SKUs` is visible. Close the palette.
- **Diagnostics.** On the popup, run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --target popup --role button --name "Clear"`. A `StaticText` reads `Logs cleared.` Then click `Download logs`. A `StaticText` reads `Downloaded 0 log entries.` on a profile that has not written a report log, or `Downloaded N log entries.` after the extension has logged. Leave the downloaded file in the disposable profile. Do not copy it into evidence or git.
- **Time Out form.** Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs new-tab --page timeout.html`. On `--target timeout`, the heading is `Time Out form` and the region `You` contains combobox `Staff name`. Do not change the fields. Do not choose `Open Time Out` in the palette.
- **Proof.** Write `$EVIDENCE/settings/popup-on.aria.txt`, `popup-on.png`, `popup-off.aria.txt`, `palette-hidden.aria.txt`, and `timeout.aria.txt` from the states above.

## Gotchas

- The content script reads settings when the palette is first mounted on that document. A switch changed after the palette has already opened does not change the open palette. `open` reloads the fixture before the next `shortcut`.
- The harness tab is `popup.html`, the same `PopupApp` as the toolbar popup. It is not the toolbar popup window. The toolbar icon remains the user entry; this tab is how the harness reaches it.
- `Edit form values` and `new-tab --page timeout.html` stay inside the extension. `Open Time Out` opens a Google Sheet and a Google Form. The harness exits 2 on that option. Stop if the recipe is meant to include the live form, and let the operator complete it.
- `Manage accounts` from the popup opens the Accounts page. That page is covered by `accounts-and-reports`. Do not type into `Master password` from this recipe.
- `Download logs` can include store names and page titles. It must not include passwords. Do not add secrets to a log to test that, and do not attach the download to the proof.
- Default switch state is on. Leave Search SKUs on before the next feature so the command list matches the other recipes.
