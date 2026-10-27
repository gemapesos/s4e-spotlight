# Accounts and reports

Switch store and Generate reports both stop before a secret or a live Seller Central fetch. On a new profile the agent can open the empty store list, the create-vault screen, and the report section picker. The operator takes over for the master password, OTP, CAPTCHA, and the signed-in store.

## Sub-features

- `stores-empty` shows no stores and the current store as Unknown.
- `accounts-gate` opens Create encrypted vault and stops before the master password.
- `reports-options` opens the Results tab with all five sections checked and stops before Generate report.
- `reports-page` shows the Results page after the dialog closes, including the control that would open Seller Central.
- `switch-live` and `reports-generate` are the operator steps. The harness does not perform them.

## How to get to it (user POV)

- In the palette, choose `Switch store`. A fresh profile says `No stores configured.` and offers `Manage accounts`. The status reads `Current store: Unknown`.
- `Manage accounts` opens the Accounts page. With no vault, the heading is `Create encrypted vault` and the fields are `Master password` and `Confirm master password`. The button is `Create vault`.
- In the palette, choose `Generate reports`. The extension opens its Results tab. The dialog `Generate reports` lists Unfulfillable, Seller Feedback, Stranded, Suppressed, and Shipping Queue, all checked. The button is `Generate report`.
- Escape from that dialog returns to the command list inside Results. Escape again closes the dialog. The page heading is `Reports`, with `Start report` and `Open Seller Central`.

## Driving it with verify-palette

Preconditions:

- `doctor` reports `ok: true` on a profile this run created. The profile has never had a vault.
- The palette is open on the fixture. `Search SKUs` is still enabled, so the command list matches a default install.
- You will not type into a password field. You will not click `Reveal`, `Create vault`, `Unlock`, `Generate report`, or `Open Seller Central`.

- **Empty stores.** Choose `Switch store`. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --role option --name "Switch store"`. The dialog name is `Accounts`. The combobox is `Search accounts`. A status named `Current store: Unknown` is visible. `StaticText` `No stores configured.` is visible. The option `Manage accounts` is visible.
- **Vault gate.** Choose `Manage accounts`. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs click --role option --name "Manage accounts"`. On `--target options`, the heading is `Create encrypted vault` and a textbox named `Master password` is visible. The button is `Create vault`. Stop. Do not run `fill` on that textbox. The harness exits 2 if you do. Write `$EVIDENCE/accounts/empty.aria.txt` and `$EVIDENCE/accounts/create-vault.aria.txt`. The snapshot redacts accessible names that contain `password`.
- **Report sections.** Reload the fixture, open the palette, and choose `Generate reports`. Run `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs open`, `shortcut`, and `click --role option --name "Generate reports"`. On `--target results`, the document is `S4E Spotlight Results` and the dialog is `Generate reports`. Options `Unfulfillable`, `Seller Feedback`, `Stranded`, `Suppressed`, and `Shipping Queue` are `checked=true`. A status named `Current store: Unknown` contains `No store open`. The button `Generate report` is visible. Do not click it. The harness exits 2.
- **Results page.** Press Escape twice on `--target results`. The heading `Reports` is visible, with buttons `Start report` and `Open Seller Central`. Do not click `Open Seller Central`. The harness exits 2. `pages` shows `results.html` with its query redacted and does not show `sellercentral.amazon.com`.
- **Proof.** Write `$EVIDENCE/reports/options.aria.txt`, `options.png`, `page.aria.txt`, and `page.png`. Record that `reports-generate` and `switch-live` were not run.

Operator steps, only after the operator agrees to continue in this disposable window:

- **Create or unlock the vault.** On the Accounts page, the operator types the master password and confirms it. The agent waits. The operator does not paste the password into chat. After they say the vault is unlocked, the heading area shows `Unlocked` and the Stores section is visible. Still do not click `Reveal`.
- **Switch store.** The operator picks a store. If Amazon asks for a password, OTP, or CAPTCHA, the operator finishes that in the helper window. The agent waits until the operator confirms the signed-in store. The palette can then show `Switched to <store>`. Do not log the OTP or the password.
- **Generate the report.** The operator clicks `Generate report` only after a Seller Central store is signed in. The agent waits. Progress rows and the `Download` button are the operator's confirmation. Do not copy the workbook into git.

## Gotchas

- A new profile shows `Create encrypted vault`, not `Unlock accounts`. `Unlock accounts` appears only after a vault exists and the session is locked. Both are operator steps. The harness exits 2 for `Create vault` and `Unlock`.
- Snapshot files redact names that match password, OTP, TOTP, or secret. `expect --name "Master password"` still works against the live tree. Do not "fix" a redacted snapshot by typing the field's value into the evidence file.
- `Generate reports` on a normal web page does not open the section picker in that page. It opens the Results extension tab and closes the fixture palette. Attach with `--target results`. The page heading `Reports` is hidden from the accessibility tree while the dialog is open.
- The section count is split into `StaticText` nodes `5`, `of`, `5`, and `sections`. Assert each option's `checked=true` rather than one node named `5 of 5 sections`.
- `Start report` reopens the dialog. It does not fetch Seller Central. `Generate report` does. Stop on the button even if every section is checked.
- `Open Seller Central` from the Results page is a live Amazon navigation. Leave it for the operator.
- Only one account switch can run at a time. CAPTCHA or an unrecognized sign-in page needs the operator in the helper window. Do not automate those pages, and do not store the verification code.
- `Share vault` and `Import a shared vault` use a share password that is not the master password. Do not type either password. Do not put a share file that could be decrypted into the repo.
