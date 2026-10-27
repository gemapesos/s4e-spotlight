# Shipment IDs and SKUs

Open shipment IDs and Search SKUs use the same chip screen as case IDs. Shipment IDs are normalized to uppercase. SKUs longer than 40 characters stay in the field and are not chips. Neither recipe opens a Seller Central tab.

## Sub-features

- `shipment-normalize` uppercases an FBA id and ignores a second copy of it.
- `shipment-invalid` explains a value with no shipment ID.
- `sku-chips` splits on newlines, commas, and tabs, and drops a SKU longer than 40 characters.
- `sku-fallback` offers a command-list row for a single unmatched token and does not activate it.

## How to get to it (user POV)

- Open the palette and choose `Open shipment IDs` or `Search SKUs`.
- Shipment placeholder: `Paste shipment IDs, links or text…`. The label is `Paste one or more FBA shipment IDs`.
- SKU placeholder: `Paste SKUs, one per line…`. The label is `Paste one or more SKUs, one per line`.
- A shipment ID is `FBA` plus nine letters or digits, read from plain text or from a Seller Central inbound URL. A SKU is a trimmed piece split on newline, comma, or tab.
- From the command list, a single token that matches no command shows `Search '<token>' as SKU`.

## Driving it with verify-palette

Preconditions:

- `doctor` reports `ok: true`.
- The palette is on dialog `Command Palette` and the identifier field is empty. Press Escape to clear a leftover value before choosing the next command. `Back` does not clear that field.

- **Shipment chips.** Choose `Open shipment IDs`. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --role option --name "Open shipment IDs"`. The dialog name is `Open shipment IDs` and the textbox is `Shipment IDs`. Fill mixed case and a duplicate: `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs fill --role textbox --name "Shipment IDs" --value "see fba19749wj6q and FBA19749WJ6Q"`. The list `Detected shipment IDs` contains one chip, `FBA19749WJ6Q`, plus `StaticText` `duplicate` and `ignored`. The button name is `Open 1 shipment`. Do not click it.
- **Shipment invalid.** Clear and enter text with no ID. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs press --key Escape`, `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs fill --role textbox --name "Shipment IDs" --value "not a shipment"`, and `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs press --key Enter`. A `StaticText` reads `Enter at least one valid FBA Shipment ID.` Clear with Escape and press `Back`.
- **SKU chips.** Choose `Search SKUs`. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --role option --name "Search SKUs"`. Fill a repeated SKU and a 41-character token: `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs fill --role textbox --name "SKUs" --value "WIDGET-1\nWIDGET-1,\tAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"`. The list `Detected SKUs` contains `WIDGET-1` and the duplicate text. It does not contain the 41-character token as a chip. That token remains visible in the textbox. The button name is `Open 1 SKU`. Do not click it.
- **Command-list suggestion.** Clear, press `Back`, and type the token into search. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs type --text "WIDGET-1"`. An option named `Search 'WIDGET-1' as SKU` is visible. Do not click it. Press Escape twice to close.
- **Proof.** Write `$EVIDENCE/shipment-sku/shipment.aria.txt`, `shipment.png`, `sku.aria.txt`, and `sku.png` from the chip screens, before any button that would open a tab. `pages` lists only the fixture.

## Gotchas

- `Open 1 shipment` and `Open 1 SKU` open Seller Central tabs immediately. The harness exits 2. The same is true for Enter while the unique count is 1–10, and for the command-list row `Search '<token>' as SKU`.
- Eleven to fifty shipment IDs or SKUs use the same confirm screen as cases (`Confirm bulk open`, then `Open N tabs`). Cancel there. The harness exits 2 on `Open N tabs`.
- A lowercase shipment ID is shown as uppercase. Assert the chip `FBA19749WJ6Q`, not the typed lowercase text.
- The 41-character SKU is still in the textbox, so an accessibility search of the whole page finds it. Assert that `Detected SKUs` has one `WIDGET-1` chip and the button says `Open 1 SKU`.
- Identifier text survives `Back`. Escape on that screen clears it. A shipment fill appended to leftover case IDs will not prove normalization.
- Shipment IDs inside a longer letter-or-digit run are ignored. `FBA19749WJ6Q30000000000` is not a chip.
- Removal-order IDs (`S4E` plus two letters and four digits) appear only as a detected row on the command list, such as `Open removal order S4EAB1234`. There is no command row for them. Do not activate that row. The harness exits 2.
