---
name: verify-command-palette
description: "Drive the Command Palette (S4E Spotlight) Manifest V3 Chrome extension the way a user does: build dist/, load it in a disposable Chrome for Testing profile, and prove the palette, identifier validation, and settings. Use when verifying this extension's UI, shortcut, popup, or options page. Credential-gated Seller Central and vault steps stop for the operator."
---

# Verify Command Palette

Drive the unpacked Command Palette extension from the repo root. The harness is `node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs`. Read `features/README.md` before a feature, then follow that feature file. One feature file is the recipe for that journey.

The palette is a closed shadow root on an ordinary web page. The harness reads the Chrome accessibility tree, which includes that shadow root. It does not read or write passwords, OTPs, master passwords, or share passwords.

## Launch

From the repo root:

```sh
npm ci --ignore-scripts
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs launch
```

`launch` runs `npm run build`, serves `fixtures/ordinary-page.html` on `127.0.0.1`, and starts Chrome for Testing with a new profile. Ready means the JSON it prints has `"ok": true` plus `fixtureUrl`, `extensionId`, `extensionVersion`, `evidence`, `distHash`, and `pid`. The fixture title is `S4E verify fixture` and `status` reports `"injected": true` after `open`.

The profile path is `$TMPDIR/verify-command-palette/runs/<runId>/profile`. A marker file `s4e-verify-run.json` in that profile records the run id. Launch refuses to start a second Chrome while that pid is alive. It does not accept a profile path. Do not point it at `~/.config/google-chrome` or `~/Library/Application Support/Google/Chrome`.

Chrome for Testing is required. Branded Google Chrome ignores `--load-extension` and `--disable-extensions-except` (the Chrome 156 binary contains the text `--load-extension is not allowed in Google Chrome, ignoring.`). The harness downloads the current Stable Chrome for Testing build for this OS into `$TMPDIR/verify-command-palette/chrome-for-testing/<version>/` unless `S4E_VERIFY_CHROME` is a Chromium binary that still accepts `--load-extension`. Cleanup does not delete that cache.

On Linux with no `DISPLAY`, launch starts Xvfb on `:97` and records `xvfbPid`. A session that already has `DISPLAY` does not start Xvfb. macOS uses the existing display and the macOS Chrome for Testing binary. This is a disposable automation profile, not the operator's daily Chrome.

Pass `--no-build` only when this checkout's `dist/` was just produced by `npm run build` and a following `doctor` still reports `distHashMatches: true`.

If the download cannot run, stop automated UI driving. The operator can still build with `npm run build`, then in a new Chrome profile (not the daily profile) open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select this repo's `dist/`. Open any ordinary `https://` page and press Command+/ on macOS or Ctrl+/ on Windows and Linux. The agent still runs `check` and `self-check`. It does not attach the harness to a profile it did not create.

Credential boundary: launch does not ask for, accept, or store a password, OTP, master password, or share password. The new profile has no vault and no Seller Central session. Do not copy cookies, a vault, or a Chrome profile into it.

## Doctor

```sh
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs doctor
```

Drive the session only when the printed JSON has `"ok": true` and `"failures": []`. That means the recorded pid is alive, its command line contains this run's `--user-data-dir`, the profile marker run id matches, DevTools on `127.0.0.1` answers, `distHash` matches the hash recorded at launch, the manifest name is `Command Palette`, and the loaded extension version equals `dist/manifest.json`. The extension is read from its service worker when the worker is running, and from the content-script world on the open fixture page when the worker has gone idle. A failed doctor exits 1. Do not keep driving.

Adjuncts, from the repo root:

```sh
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs check
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs self-check
```

`check` runs `npm run typecheck` and `npm test`. Both must exit 0. When a run exists, logs are `$EVIDENCE/doctor/typecheck.log` and `$EVIDENCE/doctor/test.log`. `self-check` checks the harness refusal table without Chrome.

Credential boundary: doctor reads the extension manifest name and version. It does not read the vault, log files, or password fields. A profile-marker mismatch means this run did not create that Chrome. Stop.

## Drive

Set `EVIDENCE` to the `evidence` value from launch or doctor. Run every command below from the repo root. `\n` and `\t` inside `--value` and `--text` become newline and tab.

```sh
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs open
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs shortcut
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs status
```

`shortcut` focuses the fixture heading, then sends Ctrl+/ on Linux and Windows or Command+/ on macOS. The content script treats either modifier as the palette shortcut (`event.code` `Slash` or key `/`, no Alt, no Shift). Ready for a command is `"open": "true"` on `#command-palette-extension-root`. The host is light DOM. The dialog inside it is not.

The accessibility names below were read from Chrome's tree with the extension loaded:

- Dialog `Command Palette`, combobox `Search commands`, listbox `Suggestions`.
- Groups `Open`, `Reports`, and `Settings`. Options `Open case IDs` (selected on open), `Scrape case`, `Open shipment IDs`, `Search SKUs`, `Open Time Out`, `Generate reports`, `Switch store`.
- Identifier dialogs `Open case IDs`, `Open shipment IDs`, `Search SKUs`. Textboxes `Case IDs`, `Shipment IDs`, `SKUs`. Lists `Detected case IDs`, `Detected shipment IDs`, `Detected SKUs`. Button `Back`.
- Confirm dialog `Confirm bulk open`, buttons `Cancel` and `Open 11 tabs` (the count varies).
- Accounts dialog `Accounts`, combobox `Search accounts`, status `Current store: Unknown`, text `No stores configured.`, option `Manage accounts`.
- Popup tab: document `Settings`, heading `S4E Spotlight`, list `Commands`, switches named with the command labels, region `Diagnostics`, buttons `Clear`, `Download logs`, `Edit form values`, `Manage accounts`.
- Options tab: document `S4E Spotlight Accounts`, heading `Create encrypted vault` on a new profile, textbox `Master password`, button `Create vault`.
- Results tab: document `S4E Spotlight Results`. While the dialog is open its name is `Generate reports` and the page heading is hidden. After the dialog closes, heading `Reports`, buttons `Start report` and `Open Seller Central`.

`cmdk` exposes the command list as `Suggestions`, not `Commands`. Query options by their names. An alert's accessible name is empty; the sentence is a `StaticText` child, and the textbox gets `invalid=true`. A duplicate count is split across `StaticText` nodes `1`, `duplicate`, and `ignored` under the detected-ID list. The same split applies to `2`, `unique`, `case ID`, `s`.

Popup, options, and the Time Out form are extension pages. Open them with `new-tab --page popup.html`, `options.html`, or `timeout.html`, then pass `--target popup`, `--target options`, or `--target timeout`. Do not open `results.html` directly. Choosing `Generate reports` creates that tab with a launch id. Attach with `--target results`. `pages` prints document titles and redacts query strings.

Credential boundary: the harness exits 2 and does not perform the action for a password field, `Reveal`, `Create vault`, `Unlock`, `Import vault`, `Export vault`, `Add credential`, `Add store`, `Reset vault`, `Change master password`, `Lock`, `Generate report`, `Open Seller Central`, `Open Time Out`, `Scrape N cases`, `Open N tabs`, `Open 1` through `Open 10` cases, shipments, or SKUs, or a detected-ID row such as `Open case 21476974831` or `Search 'WIDGET-1' as SKU`. `Open 11` through `Open 50` cases only reaches the confirm screen. `Open 51 cases` and above is the palette's own rejection and does not open tabs. Enter in an identifier field is allowed for 0 IDs and for more than 50 IDs (both show an error) and for 11–50 IDs (confirm screen). Enter with 1–10 IDs is refused because those IDs open Seller Central tabs. Shift+Enter only inserts a newline.

For a signed-in store, OTP, CAPTCHA, or master password: stop the harness, tell the operator what to do in the Chrome window this run opened, and wait for confirmation. Do not ask them to paste a secret into chat. Do not put a secret in a command, a fixture, a snapshot, or git. Do not click `Reveal`.

## Evidence

Proof is the user action plus the resulting accessibility tree and screenshot. Write both under the `evidence` directory from launch. That path is `$TMPDIR/verify-command-palette-evidence/<runId>/` and is outside the repo.

```sh
mkdir -p "$EVIDENCE/open-palette"
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs snapshot --aria --path "$EVIDENCE/open-palette/commands.aria.txt"
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs screenshot --path "$EVIDENCE/open-palette/commands.png"
```

Name files by feature and state. Record the feature id and the entry point used. `check` logs belong in `$EVIDENCE/doctor/`. Snapshot files replace any accessible name that matches password, OTP, TOTP, verification code, or secret with `[redacted]`. `expect --name "Master password"` still matches the live tree. Do not copy downloaded log JSON or workbooks into evidence or git. Do not commit the evidence directory.

A skipped Seller Central or vault action is not verified. Report the command that was refused and the unmet sign-in or unlock step.

## Cleanup

```sh
node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs cleanup
```

Cleanup sends SIGTERM, then SIGKILL, to the Chrome process group, the fixture server, and the Xvfb process launch started. It deletes that run's profile directory and `current.json`. It does not delete the evidence directory or the Chrome for Testing cache. Afterward, `doctor` prints `"failures": ["no current run"]`. List the evidence directory and confirm the aria files and screenshots are still there. Run cleanup after a failed launch too, so a half-started Chrome is not left behind.

## Helpers

`node .cursor/skills/verify-command-palette/scripts/verify-palette.mjs` is the harness. Run it from the repo root.

- `launch` builds `dist/` unless `--no-build`, then starts the fixture server and Chrome for Testing.
- `doctor` is the read-only instance check. Exit 0 only when `ok` is true.
- `check` runs typecheck and the unit tests and writes their logs.
- `self-check` checks the refusal table. No Chrome.
- `open` reloads the fixture and waits for its title.
- `shortcut` sends the palette shortcut once.
- `status` prints the fixture ready state, whether the content script ran, and `data-s4e-palette-open`.
- `press --key Enter|Escape|ArrowDown|ArrowUp|Backspace|Tab` with optional `--shift`.
- `type --text "..."` inserts into the focused field.
- `fill --role textbox --name "Case IDs" --value "..."` focuses that control and inserts the value.
- `click --role option --name "Open case IDs"` clicks one accessible node.
- `expect --role option --name "Search SKUs"` waits up to `--timeout` milliseconds (default 8000). `--absent` requires it to be missing.
- `snapshot --aria --path <file>` and `screenshot --path <file>` write proof. Add `--target popup`, `options`, `timeout`, or `results` when that tab is the subject.
- `new-tab --page popup.html|options.html|timeout.html` opens that extension page.
- `pages` lists open pages with query strings redacted.
- `extension-url popup.html` prints the extension URL.
- `cleanup` tears down this run and leaves evidence in place.

`serve` is the fixture server launch starts. Do not invoke it yourself.

Keep this map current with `/maintain-verification-skill` as the extension changes.
