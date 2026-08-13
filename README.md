# Command Palette Chrome Extension

A minimal Manifest V3 Chrome extension that opens a shadcn-style command palette on ordinary webpages with `Command+/` on macOS or `Ctrl+/` on Windows and Linux. Its actions open Amazon Seller Central support cases and inbound shipments from messy pasted text.

## Develop

```sh
npm install
npm run dev
```

The watch build writes the unpacked extension to `dist/`.

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

After rebuilding, use the extension card's reload button and refresh the page being tested.

## Behavior

- The shortcut toggles the palette and focuses its search field.
- Type to filter commands; use the arrow keys to change selection and Enter to choose.
- Choosing **Open Case ID/s** switches the palette to a multiline text field.
- Paste text containing one or more standalone 11-digit Case IDs. Duplicates are ignored in first-seen order.
- Press Enter to open every unique case, or Shift+Enter to insert a line break.
- Each case opens in a background tab in the same Chrome window, leaving the current tab selected.
- Case tabs use `https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=…`.
- Choosing **Open Shipment IDs** provides the same multiline workflow for standalone `FBA` plus nine-character shipment IDs, including IDs embedded in Seller Central links.
- Shipment IDs are normalized to uppercase and deduplicated before opening background tabs at `https://sellercentral.amazon.com/fba/inbound-shipment/summary/{shipmentId}/contents`.
- While the palette owns focus, an early event guard prevents canvas-style apps such as Google Sheets from intercepting paste or Ctrl/Cmd+A before it reaches the palette. Native paste and select-all behavior remain intact, and no clipboard permission is requested.
- Choosing an enabled sample command closes the palette without taking another action.
- Escape, clicking the backdrop, or pressing the shortcut again closes the palette.
- The palette follows the operating system's light or dark color scheme.

## Browser limitations

The shortcut is captured by a content script, because Chrome's Manifest V3 Commands API does not support `/` as a command key. It therefore works only while an eligible webpage has focus. Chrome does not allow content scripts on browser-owned pages such as `chrome://` URLs or the Chrome Web Store. It also cannot trigger while the address bar or another part of the browser UI has focus.

The manifest requests access only to HTTP and HTTPS pages. A minimal service worker opens user-requested case tabs; no additional extension permission is required. There is no popup, storage, analytics, or extension-initiated network activity.
