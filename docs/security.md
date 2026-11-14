# Security

How S4E Spotlight protects saved logins and limits what it can do. For the short version, see [Privacy and security](../README.md#privacy-and-security) in the README.

## The vault

- The vault uses AES-256-GCM. The master password is stretched with PBKDF2-HMAC-SHA256 over 600,000 iterations.
- A wrong password causes a delay, and the delay has a limit. A wrong password does not erase the vault.
- Plaintext is text that is not encrypted. Lock clears the session key from memory, stops unfinished vault work, and clears plaintext account editors on open Accounts pages.
- The vault also locks when you restart the browser, reload the extension, update the extension, or turn the extension off.
- Account data stays in this Chrome profile. If you uninstall the extension, Chrome removes that data.
- Do not put passwords in source files. A commit keeps them.

## Share files

A share file uses the same two protections as the vault, with its own password. That password is not the master password.

- The extension does not store the share password, and it cannot be recovered.
- Give the share password apart from the file. The recipient needs it before the extension can decrypt the file.
- An import must use 600,000 iterations. If a file used fewer, its owner must export it again.
- After import, the vault uses the recipient's master password.
- The share file leaves the device only when you export it.

## Who can see what

- Only the Accounts page can create, read, change, share, or reset the vault. The S4E Spotlight window can also unlock and lock it.
- The public store index is the list of store names. A feature flag records whether a command is on.
- A normal webpage receives the public store index and the feature flags. It does not receive Time Out form values or the full vault.
- Progress, customer data, workbooks, case files, and the master password stay in the S4E Spotlight window.

## The S4E Spotlight window

Generate reports, Scrape case, and unlock share one window, with Reports, Cases, and Accounts tabs. The extension reuses it each time and opens it over the window you started from. Scrape case opens the Cases tab. The Accounts tab can switch stores and can follow a switch that is still running.

A prepared run permits one report or case job, and report and case requests need one. A prepared run belongs to one window document and one Seller Central tab. The extension drops the permission when the page changes or closes, the store switches, you cancel, the run finishes, or the run expires.

## Unlocking during a switch

When you choose a locked store, Unlock accounts opens the Accounts tab. You type the master password on that extension page. After the unlock succeeds, the store switch continues and that window closes.

The return request works once and expires after 15 minutes. It belongs to the original page and to that window.

## Permissions

- **storage** holds the vault.
- **debugger** lets the extension send a trusted click, which is a click Chrome accepts as yours. Chrome warns that debugger access can read and change website data. In practice:
  - The click happens only during a store switch you requested.
  - The debugger attaches only to the dedicated login tab, and only while that tab is visible.
  - It detaches after each trusted click.
- **scripting** lets the passkey block run only during a switch.

## Automated sign-in

- A passkey is a login that uses the device. While a switch runs, the extension blocks passkey prompts on Seller Central. The block runs in the main JavaScript world of the page, before the login scripts. Outside a switch, passkeys work as usual.
- Automated sign-in accepts only the exact HTTPS Seller Central origin, only the top frame, and only a live login document.
- If another extension blocks a trusted click, that extension stays as it is, and you see an explanation.

## Logs and network

- There is no analytics service and no external credential service.
- An OTP is a one-time passcode. The extension removes password, share-password, OTP, and related secret fields before it prints, forwards, or stores a log. See [Logs](logs.md).

## Repository

Git ignores installed packages and local debug logs.
