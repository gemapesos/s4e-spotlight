# Open the palette

The shortcut opens a command palette on an ordinary web page, filters its commands, moves the highlight with the arrow keys, and closes again.

## Sub-features

- `palette-open` opens the dialog from Ctrl+/ or Command+/ and focuses the search field.
- `palette-arrows` moves the selected command with ArrowDown.
- `palette-filter` shows only commands that match the query.
- `palette-empty` shows an empty state for a query that matches nothing.
- `palette-close` clears a query with Escape, then closes the palette with a second Escape.

## How to get to it (user POV)

- Focus an ordinary HTTP or HTTPS page. Chrome does not inject the content script on `chrome://` pages, the Chrome Web Store, or XML and SVG documents.
- Press Command+/ on macOS or Ctrl+/ on Windows and Linux. The address bar must not have focus.
- Press Escape to clear the search, and Escape again to close. Clicking the dimmed backdrop also closes the palette.

## Driving it with verify-palette

Preconditions:

- `doctor` reports `ok: true` for this run's disposable profile.
- `open` has loaded `fixtureUrl`. `status` reports `"injected": true` and title `S4E verify fixture`.

- **Open.** Focus the page and press the shortcut. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs shortcut`. `status` reports `"open": "true"`. A dialog named `Command Palette` is visible, the combobox `Search commands` is expanded, and the option `Open case IDs` is `selected=true`.
- **Arrow.** Press ArrowDown. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs press --key ArrowDown`. The option `Scrape case` is `selected=true` and `Open case IDs` is `selected=false`.
- **Filter.** Type `shipment`. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs type --text "shipment"`. The listbox `Suggestions` contains `Open shipment IDs` and does not contain `Open case IDs`. The footer text is `Clear` rather than `Close`.
- **Empty state.** Clear with Escape, then type a query that contains a space. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs press --key Escape` and `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs type --text "missing command"`. A `StaticText` named `No results found.` is visible and no command option remains.
- **Close.** Press Escape twice. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs press --key Escape` and the same command again. The first Escape clears the query. The second closes the palette. `status` reports `"open": "false"` and `"host": true`.
- **Proof.** While the unfiltered palette is open, run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs snapshot --aria --path "$EVIDENCE/open-palette/commands.aria.txt"` and `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs screenshot --path "$EVIDENCE/open-palette/commands.png"`. Both show `S4E verify fixture` and the dialog `Command Palette`.

## Gotchas

- The shortcut is a content script. It does nothing while the address bar, a `chrome://` page, or a non-HTML document has focus. `shortcut` clicks the fixture heading first so the page has focus.
- Send the shortcut once. A second Ctrl+/ or Command+/ toggles the palette closed.
- The listbox accessible name is `Suggestions`. The visible group names are `Open`, `Reports`, and `Settings`.
- A single token with no spaces, at most 40 characters, that matches no command shows `Search '<token>' as SKU` instead of `No results found.` Use a query that contains a space for the empty state. Do not activate the SKU suggestion. The harness exits 2 if you click it, because that opens a Seller Central inventory tab.
- Escape on the command screen clears a non-empty query before it closes. A following command that expects the dialog to be gone must press Escape again.
- Do not type a password or OTP into `Search commands`. The field is a command filter, not an account form.
