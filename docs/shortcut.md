# Where the shortcut cannot run

The Manifest V3 command API cannot use `/` as a command key, so a content script captures the shortcut instead. A content script is extension code that runs on a page. The shortcut works only while an eligible webpage has focus.

The shortcut does nothing in these places:

- A `chrome://` page. Chrome does not run content scripts there.
- The Chrome Web Store. Chrome does not run content scripts there either.
- An XML or SVG document, such as a feed, a sitemap, or an SVG file. The palette needs an HTML page.
- The address bar, or any other browser control that has focus.
