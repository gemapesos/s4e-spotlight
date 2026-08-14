# Command Palette Chrome Extension

A Manifest V3 Chrome extension that opens a [shadcn/ui](https://ui.shadcn.com/docs) command palette on ordinary webpages with `Command+/` on macOS or `Ctrl+/` on Windows and Linux. Its actions open Amazon Seller Central support cases, inbound shipments, inventory SKU searches, and Time Out resources, and switch between encrypted Seller Central accounts.

## Develop

```sh
npm install
npm run dev
```

The watch build writes the unpacked extension to `dist/`. UI components are installed with the [shadcn/ui CLI](https://ui.shadcn.com/docs/cli) into `src/components/ui`.

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
- The toolbar icon opens a compact settings popup. Toggle commands on or off, and use **Edit form values** under Time Out to change the prefilled Google Form fields.

## Behavior

- The shortcut toggles the palette and focuses its search field.
- Type to filter commands; use the arrow keys to change selection and Enter to choose.
- Choosing **Open Case ID/s** switches the palette to a multiline text field.
- Paste text containing one or more standalone 11-digit Case IDs. Duplicates are ignored in first-seen order.
- The palette shows the unique-ID count. Press Enter or choose **Open** to continue; Shift+Enter inserts a line break.
- Batches of 11–50 IDs require confirmation. More than 50 IDs are rejected in both the palette and background worker.
- Each case opens in a background tab in the same Chrome window, leaving the current tab selected.
- If Chrome fails partway through a batch, the extension closes tabs created by that attempt and reports any tab it could not close.
- Case tabs use `https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=…`.
- Choosing **Open Shipment IDs** provides the same multiline workflow for standalone `FBA` plus nine-character shipment IDs, including IDs embedded in Seller Central links.
- Shipment IDs are normalized to uppercase and deduplicated before opening background tabs at `https://sellercentral.amazon.com/fba/inbound-shipment/summary/{shipmentId}/contents`.
- Choosing **Search SKU/s** provides the same multiline workflow for merchant SKUs pasted one per line, or separated by commas or tabs. Values longer than 40 characters are ignored. Each SKU opens a background inventory search at `https://sellercentral.amazon.com/myinventory/inventory?…&searchTerm={sku}`.
- Choosing **Time Out** opens its Google Sheet in the background, then opens the prefilled Google Form as the active tab with its Date set to the current local calendar date. Prefill values come from the Time Out form settings page. If either tab cannot be created, the extension attempts to close any tab created by that request and reports the error.
- Choosing **Generate Reports** first focuses an open Seller Central tab, or opens `https://sellercentral.amazon.com/` if none is open. If that tab is not signed in to a store, the palette stays open with an alert and an **Open Accounts** action. After a store session is confirmed, it downloads an `.xlsx` named `{Current Store} - {dd-mmm-yyyy}.xlsx`, using the last store switched to from Accounts or Unknown. The workbook has empty Daily Tasks, Unfulfillable, Stranded, Suppressed, and Shipping Queue worksheets.
- **Accounts** opens a searchable list of configured Seller Central stores. The palette shows the last store switched to from Accounts, or Unknown if none has been switched yet. Selecting the current store again focuses an open Seller Central tab, or opens `https://sellercentral.amazon.com/` if none is open. Selecting a different store that uses the same saved credential opens that store URL in an existing Seller Central tab, or a new tab if none is open, without signing out. Selecting a store on a different credential, or when no current store is recorded, opens an active login tab, signs out, signs in with its saved credential and locally generated TOTP, and opens the store URL. A running switch can be focused or cancelled from the palette and expires after 15 minutes if it becomes orphaned.
- **Manage Accounts** opens a full options page. Create a master password first, add shared credentials, then add stores such as **JMG Outdoors** that reference those credentials.
- Account data is encrypted locally with AES-256-GCM. The master password is processed with PBKDF2-HMAC-SHA256 (600,000 iterations), is never stored, and unlocks the vault only for the current browser session.
- CAPTCHA challenges pause for manual completion. The extension then resumes automatically. Only one account switch can run at a time.
- On Seller Central login pages, an early passkey guard blocks WebAuthn `navigator.credentials.get/create` calls and reports conditional passkeys and platform authenticators as unavailable, so account switching stays on password login.
- While the palette owns focus, an early event guard prevents host pages from intercepting text entry, editing events, paste, or Ctrl/Cmd+A before they reach the palette. Native input behavior remains intact, and no clipboard permission is requested.
- Choosing an enabled sample command closes the palette without taking another action.
- Escape acts as Back: it first clears a non-empty field, then returns from a nested screen to its parent, and finally closes an already-empty command palette. Escape is ignored while an action is running. Clicking the backdrop or pressing the shortcut again still closes the palette immediately.
- The palette follows the operating system's light or dark color scheme.

## Browser limitations

The shortcut is captured by a content script, because Chrome's Manifest V3 Commands API does not support `/` as a command key. It therefore works only while an eligible webpage has focus. Chrome does not allow content scripts on browser-owned pages such as `chrome://` URLs or the Chrome Web Store. It also cannot trigger while the address bar or another part of the browser UI has focus.

The manifest requests `storage` for the encrypted local vault and `debugger` to send trusted clicks to Amazon login controls during an explicitly requested account switch. Seller Central passkey prompts are blocked proactively in the page’s main JavaScript world before login scripts run. Chrome warns that debugger access can read and change website data. The debugger attaches only to the dedicated login tab and detaches immediately after each trusted click. There is no analytics or external credential service.

## Account security and recovery

- Store credentials only through the extension options page; never add them to source files.
- Lock clears the in-memory session key. Restarting, reloading, updating, or disabling the extension also locks the vault.
- There is no master-password recovery. The Reset Vault action requires typing `RESET` and permanently removes the encrypted data.
- Account data is local to the current Chrome profile and is removed when the extension is uninstalled.
