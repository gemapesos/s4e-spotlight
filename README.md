# S4E Spotlight

A Manifest V3 Chrome extension that opens a [shadcn/ui](https://ui.shadcn.com/docs) command palette on ordinary webpages with `Command+/` on macOS or `Ctrl+/` on Windows and Linux. Its actions open Amazon Seller Central support cases, inbound shipments, inventory SKU searches, and Time Out resources, and switch between encrypted Seller Central accounts.

## Develop

```sh
npm install
npm run dev
```

The watch build writes the unpacked extension to `dist/`. UI components live in `src/components/ui`. When adding components, use the pinned [shadcn/ui CLI](https://ui.shadcn.com/docs/cli), `npx shadcn@4.22.1 add <component>`. The CLI is not an extension dependency.

## Build and test

```sh
npm run typecheck
npm test
npm run build
```

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project's `dist/` directory.
5. Open or reload an ordinary HTTP or HTTPS webpage and press `Command+/` or `Ctrl+/`.

- After rebuilding, use the extension card's reload button and refresh the page being tested.
- The toolbar icon opens a compact settings popup. Toggle commands on or off, use **Edit form values** under Time Out to change the prefilled Google Form fields, and **Manage accounts** under Switch store to open the accounts page. **Diagnostics** shows how long the last report took and lets you download or clear the extension's logs.

## Behavior

What each command and screen does is in [docs/spec.md](docs/spec.md).

## Diagnostics and logs

Every part of the extension writes structured log entries: the background worker, the content script on the Seller Central tab, the palette, account automation, and the extension pages. Each entry has a time, level, context, event name, optional duration, and optional run ID; entries from one report run or account switch share that ID across contexts.

- **Console:** entries print with an `[S4E]` prefix. Filter the page console (palette, Seller Central content script) or the service worker console (`chrome://extensions` → **Inspect views**) by `[S4E]`.
- **Stored log:** the background worker keeps the newest 1,000 entries in `chrome.storage.local`. Use **Download logs** in the popup to save them as JSON, or **Clear** to delete them. Only extension pages can read the log.
- **Performance:** every report source logs a `report.fetch` entry with its item count and, per Seller Central endpoint, the request count, failures, status codes, average and slowest time to the response headers, average body time (`bodyMs`: downloading and parsing the response), wall time, maximum requests in flight, and `parallelism` (total request time, bodies included, over wall time; about 1 means the requests ran one after another). Bulk removal logs a `removal.bulk` entry with how many SKUs were requested, opened and skipped, and `removal.resolve` with its Seller Central requests and whether Amazon's multi-SKU lookup or a scan of the unfulfillable list found them (`bulkRemoval.resolve`). Feedback logs how it read the list (`feedback.load`: parallel chains, one chain, or a single page) and the requests it took. The shipping-queue list logs the slices and requests it used, where its last in-window shipment sits (`lastInWindowAt`), and the longest run of older shipments an in-window one still followed (`maxGap`); shipment details log the extra SKU-line requests and any shipment whose SKU lines are still short (`linesCut`). Requests cancelled because they were no longer needed show as `aborted`, not as failures. The palette logs a `report.run` summary with the sections chosen, each source's time, and the slowest source. Slow (5 seconds or more) and failed requests, shipping-queue session pauses, schema retries, feedback falling back to one chain, and partial loads are logged as warnings.
- **Privacy:** logs hold counts, durations, status codes, endpoint paths with IDs collapsed, store names, error messages, a page's content type when the palette fails to load, the shipment IDs of the first few shipments whose details failed, and the path and title of a login page the account automation doesn't recognize. They never contain passwords, verification codes, the master password, or customer data such as feedback text, and nothing leaves the device.

## Browser limitations

The shortcut is captured by a content script, because Chrome's Manifest V3 Commands API does not support `/` as a command key. It therefore works only while an eligible webpage has focus. Chrome does not allow content scripts on browser-owned pages such as `chrome://` URLs or the Chrome Web Store. It also cannot trigger while the address bar or another part of the browser UI has focus. The palette needs an HTML page, so the shortcut does nothing on XML and SVG documents such as feeds, sitemaps, and SVG files.

The manifest requests `storage` for the encrypted local vault, `debugger` to send trusted clicks to Amazon login controls during an explicitly requested account switch, and `scripting` to block Seller Central passkey prompts only while a switch runs, in the page’s main JavaScript world before login scripts run. Outside a switch, passkeys work as usual. Chrome warns that debugger access can read and change website data. The debugger attaches only to the dedicated login tab while it is visible, and detaches immediately after each trusted click. There is no analytics or external credential service.

## Account security and recovery

- Store credentials only through the extension options page; never add them to source files.
- Lock clears the in-memory session key. Restarting, reloading, updating, or disabling the extension also locks the vault.
- There is no master-password recovery. The Reset Vault action requires typing `RESET` and permanently removes the encrypted data.
- A shared vault file uses the same AES-256-GCM and PBKDF2-HMAC-SHA256 protection with its own share password. Imports require 600,000 PBKDF2 iterations; older files using weaker settings must be exported again by their owner. That password is not the master password, is never stored, and cannot be recovered. The recipient has to enter it before any shared account can be decrypted. Give the password separately from the file. After import, the accounts are encrypted with the recipient’s own master password.
- Account data is local to the current Chrome profile and is removed when the extension is uninstalled. The share file leaves the device only when someone chooses to export it.

## Security and protected pages

- When a locked store is selected, **Unlock accounts** opens the S4E Spotlight window on its Accounts tab, so the master password is typed in an extension page rather than on the website. After a successful unlock, the requested store switch continues automatically, and a window opened only for that unlock closes. The return request is single-use, expires after 15 minutes, and is tied to the original page and the window.
- **Generate reports**, **Scrape case** and unlocking use the S4E Spotlight window: one small Chrome popup window with **Reports**, **Cases** and **Accounts** tabs, reused for every launch and opened over the window you started from. Progress, customer data, workbooks, case files and the master password stay in that extension page. **Scrape case** opens the Cases tab directly, where you paste the Case IDs; the window then lists each case with its reply count and opening date, marks cases that failed, and saves the JSON file only when you choose **Download JSON**. The Accounts tab can also switch stores and follow a running switch.
- Report and case requests require a prepared run owned by the same window document and one Seller Central tab. Changing or closing the page, switching stores, cancellation, completion or expiry revokes that authorization.
- **Lock** invalidates unfinished vault work and clears plaintext account editors across open Accounts pages. Repeated incorrect unlocks cause a bounded delay; they never erase the vault.
- Only the Accounts page can create, read, modify, share or reset the vault; the S4E Spotlight window can also unlock and lock it. General webpages receive the public store index and feature flags, not saved Time Out form values or the full vault.
- Automated sign-in checks the exact HTTPS Seller Central origin, top frame and live login document. If another extension prevents a trusted click, its interface is left intact and the user sees an explanation.
- Logs redact password, share-password, OTP and related secret fields before console output, forwarding and persistence.
- Installed packages and local debug logs are ignored by Git. CI runs a clean install with lifecycle scripts disabled, a dependency audit, type checking, tests and production builds.
