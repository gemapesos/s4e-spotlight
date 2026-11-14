# Logs

Every part of the extension writes log entries: the background worker, the content script on the Seller Central tab, the palette, account automation, and the extension pages.

Each entry has a time, a level, a context, and an event name. An entry can also have a duration and a run ID. Entries from one report or one store switch share that run ID.

## Where to read them

- **Settings.** Choose Download logs to save the log as JSON.
- **Page console.** Console lines start with `[S4E]`, so you can filter by it. The page console includes the palette and the Seller Central content script.
- **Service worker console.** A service worker is the extension's background process. Open `chrome://extensions`, choose Inspect views for the service worker, and filter by `[S4E]`.

The background worker keeps the newest 1,000 entries in `chrome.storage.local`. Only an extension page can read the log.

## Report entries

Each report source writes a `report.fetch` entry with the item count. For each Seller Central endpoint, the entry also has:

- The request count and failure count.
- The status codes.
- The average and slowest time to the response headers.
- The average body time. `bodyMs` is the download and parse time.
- The wall time.
- The maximum number of requests in flight.
- `parallelism`, which is total request time (body time included) divided by wall time. A value near 1 means the requests ran one after another.

The palette writes a `report.run` summary that lists the chosen sections, the time for each source, and the slowest source.

A request that is no longer needed is `aborted`. An aborted request is not a failure.

### Source-specific entries

- **Feedback** writes `feedback.load`, which says whether the read used parallel chains, one chain, or one page, and counts the requests.
- **Shipping queue.** The list records the slices and the requests. `lastInWindowAt` marks the last in-window shipment. `maxGap` is the longest stretch of older shipments, which an in-window shipment can follow. Shipment details record the extra SKU-line requests, and `linesCut` names a shipment with short SKU lines.
- **Bulk removal** writes `removal.bulk`, which counts SKUs requested, opened, and skipped. It also writes `removal.resolve`, which lists the Seller Central requests and records whether the Amazon multi-SKU lookup found the SKUs, or whether a scan of the unfulfillable list did. That result is in the `bulkRemoval.resolve` field.

## Warnings

The extension writes a warning when:

- A request takes 5 seconds or more.
- A request fails.
- The shipping queue pauses for a session.
- The extension tries a schema read again.
- Feedback falls back to one chain.
- A load is only partial.

## What a log can hold

- Counts, durations, and status codes.
- Endpoint paths with the IDs collapsed.
- Store names and error messages.
- The content type of a page when the palette fails to load.
- The shipment IDs of the first few shipments whose details failed.
- The path and title of a login page that account automation does not recognize.

A log never holds a password, a verification code, the master password, or customer data such as feedback text. A log never leaves the device.
