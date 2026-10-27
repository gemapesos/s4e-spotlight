# Command Palette verification map

This directory is the maintained source for verifying the user-facing behavior of the Command Palette Chrome extension (S4E Spotlight). Read this index, then use the matching feature file as the recipe.

## Baseline preconditions

- The repo root is the working directory. `package.json` name is `command-palette-extension`.
- `npm ci --ignore-scripts` has been run in this checkout.
- `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs launch` printed `"ok": true`.
- `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs doctor` printed `"ok": true` and an empty `failures` array.
- `EVIDENCE` is the `evidence` path from that JSON. Create a subdirectory per feature before writing artifacts.
- The fixture is the ordinary page at `fixtureUrl`. Its heading is `S4E verify fixture`. It has no Seller Central session and no vault.
- The profile is the disposable directory from launch. Do not drive any other Chrome profile.

## Driving conventions

- Start every recipe from the command list unless its preconditions say otherwise. `shortcut` opens that list. `status` must report `"open": "true"`.
- Prefer the accessible names in each feature file. The palette lives in a closed shadow root; the harness reads the accessibility tree.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Run the harness as `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs` from the repo root.
- `\n` inside `--value` or `--text` is a newline. `\t` is a tab.
- Pass `--target popup`, `--target options`, `--target timeout`, or `--target results` for those extension pages. The fixture is the default target.
- Restore a settings switch you turn off before leaving `settings-popup`, by turning it on and reloading the fixture.
- Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof is an ARIA snapshot and a screenshot. The fixture heading or the extension document title is visible in the snapshot.
- `check` proof is `doctor/typecheck.log` and `doctor/test.log` with exit code 0.
- Record the feature id and the entry point with every artifact.
- Report a refused live-tab or vault action with the harness message and the unmet operator step. Do not report that action as verified.
- Do not report a skipped entry point as verified through a different path.

## Credential boundary

No-credential journeys are the palette, identifier validation, the settings popup, the Time Out form page, and the empty Accounts and report-option screens. The harness runs those alone.

Unlock vault, switch store, OTP, CAPTCHA, and Generate report against live Seller Central are credential-gated. Stop, tell the operator the human step, and wait. Do not ask for a secret in chat, and do not write one into a command, fixture, snapshot, or git. The harness exits 2 if a command targets those controls.

## Feature entry contract

Each feature file starts with an H1 and one paragraph. It then uses these four H2 sections in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify-palette`, and `Gotchas`.

## Features

- [Open the palette](./open-palette.md) covers the shortcut, arrow keys, filtering, the empty state, and Escape.
- [Open case IDs](./open-case-ids.md) covers chips, duplicates, invalid input, the 50-ID rejection, and confirm-then-cancel. It does not open Seller Central tabs.
- [Shipment IDs and SKUs](./shipment-ids-and-skus.md) covers the same validation for FBA shipment IDs and SKUs, including the command-list SKU suggestion.
- [Settings popup](./settings-popup.md) covers command switches, diagnostics, and the Time Out form page.
- [Accounts and reports](./accounts-and-reports.md) covers the empty store list and the report section picker, then stops for the operator before any secret or live Seller Central fetch.
