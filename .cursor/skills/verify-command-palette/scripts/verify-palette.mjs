#!/usr/bin/env node
/**
 * Drive the Command Palette extension in a disposable Chrome for Testing profile.
 * Never accepts passwords, and refuses controls that open Seller Central or the vault.
 */
import { spawn, spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { createWriteStream, readFileSync } from "node:fs"
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises"
import net from "node:net"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { pipeline } from "node:stream/promises"

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "../../../..")
const FIXTURE_PATH = path.resolve(path.dirname(SCRIPT_PATH), "../fixtures/ordinary-page.html")
const ROOT_DIR = path.join(os.tmpdir(), "verify-command-palette")
const EVIDENCE_ROOT = path.join(os.tmpdir(), "verify-command-palette-evidence")
const CURRENT_PATH = path.join(ROOT_DIR, "current.json")
const CFT_ROOT = path.join(ROOT_DIR, "chrome-for-testing")
const DIST_FILES = [
  "dist/manifest.json",
  "dist/background.js",
  "dist/content.js",
  "dist/palette-app.js",
  "dist/popup.js",
  "dist/options.js",
  "dist/results.js",
]
const EXTENSION_PAGES = new Set(["popup.html", "options.html", "timeout.html"])
const SECRET_NAME = /password|otp|totp|verification code|master password|share password|secret/i

const command = process.argv[2]
const args = process.argv.slice(3)

function flag(name) {
  const index = args.indexOf(`--${name}`)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (value === undefined || value.startsWith("--")) return true
  return value
}

function unescapeArg(value) {
  return value.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r")
}

function die(message, code = 1) {
  console.error(message)
  process.exit(code)
}

function assertRepo() {
  const pkg = path.join(REPO_ROOT, "package.json")
  let raw
  try {
    raw = JSON.parse(readFileSync(pkg, "utf8"))
  } catch (error) {
    die(`Refusing to run outside the Command Palette repo (${error.message}).`)
  }
  if (raw.name !== "command-palette-extension") die(`Refusing to run: ${pkg} is not command-palette-extension.`)
}

function runDir(runId) {
  return path.join(ROOT_DIR, "runs", runId)
}

function evidenceDir(runId) {
  return path.join(EVIDENCE_ROOT, runId)
}

function assertOwnedProfile(profile) {
  const runs = path.join(ROOT_DIR, "runs") + path.sep
  const resolved = path.resolve(profile)
  if (!resolved.startsWith(runs)) {
    die(`Refusing to drive a Chrome profile this run did not create: ${resolved}`)
  }
}

async function readState() {
  try {
    return JSON.parse(await readFile(CURRENT_PATH, "utf8"))
  } catch {
    return null
  }
}

async function writeState(state) {
  await mkdir(ROOT_DIR, { recursive: true })
  const temp = `${CURRENT_PATH}.${process.pid}.tmp`
  await writeFile(temp, JSON.stringify(state, null, 2))
  await rename(temp, CURRENT_PATH)
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function cmdline(pid) {
  try {
    return readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\u0000").filter(Boolean)
  } catch {
    return null
  }
}

async function distHash() {
  const hash = createHash("sha256")
  for (const relative of DIST_FILES) {
    const file = path.join(REPO_ROOT, relative)
    hash.update(relative)
    hash.update("\0")
    hash.update(await readFile(file))
    hash.update("\0")
  }
  return hash.digest("hex")
}

async function manifestVersion() {
  const manifest = JSON.parse(await readFile(path.join(REPO_ROOT, "dist/manifest.json"), "utf8"))
  return { name: manifest.name, version: manifest.version }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

function cftSpec() {
  const { platform, arch } = process
  if (platform === "linux" && arch === "x64") return { key: "linux64", binary: "chrome-linux64/chrome" }
  if (platform === "linux" && arch === "arm64") return { key: "linux-arm64", binary: "chrome-linux-arm64/chrome" }
  if (platform === "darwin" && arch === "arm64") {
    return { key: "mac-arm64", binary: "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" }
  }
  if (platform === "darwin" && arch === "x64") {
    return { key: "mac-x64", binary: "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" }
  }
  if (platform === "win32" && arch === "x64") return { key: "win64", binary: "chrome-win64/chrome.exe" }
  die(`No Chrome for Testing build is mapped for ${platform} ${arch}.`)
}

async function ensureChrome() {
  if (process.env.S4E_VERIFY_CHROME) {
    return path.resolve(process.env.S4E_VERIFY_CHROME)
  }
  const spec = cftSpec()
  const versionUrl = "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json"
  const response = await fetch(versionUrl)
  if (!response.ok) die(`Could not resolve Chrome for Testing (${response.status}). Set S4E_VERIFY_CHROME to a Chromium binary that still accepts --load-extension.`)
  const payload = await response.json()
  const stable = payload.channels.Stable
  const download = stable.downloads.chrome.find((item) => item.platform === spec.key)
  if (!download) die(`Chrome for Testing has no ${spec.key} build.`)
  const binary = path.join(CFT_ROOT, stable.version, spec.binary)
  try {
    await readFile(binary)
    return binary
  } catch {
    // Download below.
  }
  await mkdir(path.join(CFT_ROOT, stable.version), { recursive: true })
  const zipPath = path.join(CFT_ROOT, `chrome-${spec.key}.zip`)
  console.error(`Downloading Chrome for Testing ${stable.version} (${spec.key})`)
  const zip = await fetch(download.url)
  if (!zip.ok || !zip.body) die(`Chrome for Testing download failed (${zip.status}).`)
  await pipeline(zip.body, createWriteStream(zipPath))
  const unzip = spawnSync("unzip", ["-q", "-o", zipPath, "-d", path.join(CFT_ROOT, stable.version)], { stdio: "inherit" })
  if (unzip.status !== 0) die("unzip failed for Chrome for Testing.")
  await rm(zipPath, { force: true })
  return binary
}

function chromeEnv(display) {
  return {
    HOME: process.env.HOME ?? os.homedir(),
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    LANG: process.env.LANG ?? "C.UTF-8",
    USER: process.env.USER ?? "verify",
    TMPDIR: os.tmpdir(),
    ...(display ? { DISPLAY: display } : {}),
  }
}

async function ensureDisplay(state) {
  if (process.env.DISPLAY || process.platform !== "linux") return process.env.DISPLAY ?? ""
  const display = ":97"
  const child = spawn("Xvfb", [display, "-screen", "0", "1280x800x24"], {
    detached: true,
    stdio: "ignore",
  })
  child.unref()
  state.xvfbPid = child.pid
  await new Promise((resolve) => setTimeout(resolve, 300))
  return display
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    let next = 0
    const pending = new Map()
    const contexts = []
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error(`CDP connection timed out: ${wsUrl}`))
    }, 10000)
    ws.addEventListener("open", () => {
      clearTimeout(timer)
      resolve({
        contexts,
        send(method, params = {}, timeoutMs = 15000) {
          const id = ++next
          return new Promise((resolveSend, rejectSend) => {
            const timeout = setTimeout(() => {
              pending.delete(id)
              rejectSend(new Error(`CDP ${method} timed out`))
            }, timeoutMs)
            pending.set(id, {
              resolve: (value) => {
                clearTimeout(timeout)
                resolveSend(value)
              },
              reject: (error) => {
                clearTimeout(timeout)
                rejectSend(error)
              },
            })
            ws.send(JSON.stringify({ id, method, params }))
          })
        },
        close() {
          ws.close()
        },
      })
    })
    ws.addEventListener("error", () => {
      clearTimeout(timer)
      reject(new Error(`CDP websocket failed: ${wsUrl}`))
    })
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data)
      if (message.method === "Runtime.executionContextCreated") contexts.push(message.params.context)
      if (!message.id || !pending.has(message.id)) return
      const waiter = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) waiter.reject(new Error(`${message.error.message ?? "CDP error"}`))
      else waiter.resolve(message.result ?? {})
    })
  })
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json()
}

async function targets(port) {
  return fetchJson(`http://127.0.0.1:${port}/json/list`)
}

const MANIFEST_EXPRESSION = `(() => {
  try {
    if (!chrome.runtime || !chrome.runtime.id || !chrome.runtime.getManifest) return ""
    const manifest = chrome.runtime.getManifest()
    return JSON.stringify({ id: chrome.runtime.id, name: manifest.name, version: manifest.version })
  } catch {
    return ""
  }
})()`

async function manifestFromSession(session, contextId) {
  const evaluated = await session.send("Runtime.evaluate", {
    expression: MANIFEST_EXPRESSION,
    returnByValue: true,
    ...(contextId ? { contextId } : {}),
  })
  const value = evaluated.result?.value
  if (typeof value !== "string" || !value) return null
  try {
    const info = JSON.parse(value)
    return info.name === "Command Palette" ? info : null
  } catch {
    return null
  }
}

async function extensionInfo(port) {
  const list = await targets(port)
  const workers = list.filter((target) => target.type === "service_worker" && target.url.endsWith("/background.js"))
  for (const worker of workers) {
    const session = await connect(worker.webSocketDebuggerUrl)
    try {
      const info = await manifestFromSession(session)
      if (info) return info
    } catch {
      // A stopped worker target can reject the evaluation.
    } finally {
      session.close()
    }
  }
  const pages = list.filter((target) => target.type === "page" && (target.url.startsWith("http://127.0.0.1:") || target.url.startsWith("https://") || target.url.startsWith("chrome-extension://")))
  for (const page of pages) {
    const session = await connect(page.webSocketDebuggerUrl)
    try {
      await session.send("Runtime.enable")
      await new Promise((resolve) => setTimeout(resolve, 200))
      if (page.url.startsWith("chrome-extension://")) {
        const info = await manifestFromSession(session)
        if (info) return info
      }
      for (const context of session.contexts) {
        if (context.auxData?.isDefault !== false) continue
        const info = await manifestFromSession(session, context.id)
        if (info) return info
      }
    } catch {
      // Try the next page. A closed target is not the extension.
    } finally {
      session.close()
    }
  }
  return null
}

function safeUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === "chrome-extension:") return `chrome-extension://${parsed.hostname}${parsed.pathname}${parsed.search ? "?…" : ""}`
    if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") return url
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return "[unparsed url]"
  }
}

async function requireState() {
  const state = await readState()
  if (!state) die("No verification Chrome is running. Run launch first.")
  assertOwnedProfile(state.profile)
  if (!pidAlive(state.pid)) die(`Verification Chrome pid ${state.pid} is not running. Run launch again.`)
  const line = cmdline(state.pid)
  if (!line) die(`Could not read the command line for pid ${state.pid}. Refusing to drive it.`)
  const expected = `--user-data-dir=${state.profile}`
  if (!line.includes(expected)) {
    die(`Refusing to drive pid ${state.pid}: its profile is not ${state.profile}.`)
  }
  const marker = JSON.parse(await readFile(path.join(state.profile, "s4e-verify-run.json"), "utf8"))
  if (marker.runId !== state.runId) die("Profile marker does not match this run. Refusing to drive it.")
  return state
}

function nodeText(node) {
  const name = node.name?.value ?? ""
  const role = node.role?.value ?? ""
  return { role, name }
}

function formatTree(nodes) {
  const childIds = new Set()
  for (const node of nodes) {
    for (const child of node.childIds ?? []) childIds.add(child)
  }
  const byId = new Map(nodes.map((node) => [node.nodeId, node]))
  const lines = []
  const walk = (node, depth) => {
    if (!node.ignored) {
      const { role, name } = nodeText(node)
      const secret = SECRET_NAME.test(name)
      const shown = secret ? "[redacted]" : name.replace(/\s+/g, " ").trim().slice(0, 200)
      const props = (node.properties ?? [])
        .filter((property) => ["checked", "selected", "expanded", "invalid", "disabled", "busy"].includes(property.name))
        .map((property) => `${property.name}=${property.value?.value}`)
      const interesting = shown || ["dialog", "listbox", "combobox", "button", "textbox", "option", "switch", "heading", "alert", "status", "progressbar", "list", "searchbox"].includes(role)
      if (interesting && role !== "InlineTextBox" && role !== "LineBreak" && role !== "none") {
        lines.push(`${"  ".repeat(Math.min(depth, 8))}${role}${shown ? ` "${shown}"` : ""}${props.length ? ` ${props.join(" ")}` : ""}`)
      }
    }
    for (const childId of node.childIds ?? []) {
      const child = byId.get(childId)
      if (child) walk(child, depth + (node.ignored ? 0 : 1))
    }
  }
  for (const root of nodes.filter((node) => !childIds.has(node.nodeId))) walk(root, 0)
  return lines.join("\n")
}

async function axNodes(session) {
  await session.send("Accessibility.enable")
  const tree = await session.send("Accessibility.getFullAXTree")
  return tree.nodes ?? []
}

function findNodes(nodes, role, name) {
  const matches = nodes.filter((node) => {
    if (node.ignored) return false
    const text = nodeText(node)
    if (role && text.role !== role) return false
    if (name && text.name !== name && !text.name.includes(name)) return false
    if (!role && !name) return false
    return Boolean(name ? text.name === name || text.name.includes(name) : true)
  })
  matches.sort((left, right) => {
    const leftExact = name && nodeText(left).name === name ? 0 : 1
    const rightExact = name && nodeText(right).name === name ? 0 : 1
    return leftExact - rightExact
  })
  return matches
}

function dialogName(nodes) {
  const dialog = nodes.find((node) => !node.ignored && node.role?.value === "dialog" && node.name?.value)
  return dialog?.name?.value ?? ""
}

function uniqueCount(nodes) {
  for (const node of nodes) {
    const name = node.name?.value ?? ""
    const match = name.match(/^(\d+) unique /)
    if (match) return Number(match[1])
  }
  return null
}

function countInValue(dialog, value) {
  if (dialog === "Open case IDs" || dialog === "Scrape case") {
    return new Set(value.match(/(?<!\d)\d{11}(?!\d)/g) ?? []).size
  }
  if (dialog === "Open shipment IDs") {
    return new Set((value.match(/(?<![a-z0-9])FBA[a-z0-9]{9}(?![a-z0-9])/gi) ?? []).map((id) => id.toUpperCase())).size
  }
  if (dialog === "Search SKUs") {
    return new Set(value.split(/[\n\r,\t]+/u).map((part) => part.trim()).filter((sku) => sku && sku.length <= 40)).size
  }
  return null
}

function blockedReason(role, name) {
  if (!name) return null
  if (SECRET_NAME.test(name) && ["textbox", "searchbox", "combobox", "input"].includes(role)) {
    return `Refusing to type into "${name}". Stop and let the operator handle this. Do not pass secrets on the command line.`
  }
  if (/^Reveal$/.test(name)) return "Refusing Reveal. It would put a stored secret on screen and into the accessibility tree."
  if (/^Open Seller Central$/.test(name)) return "Refusing Open Seller Central. That is a live Amazon page."
  if (/^Generate report$/.test(name)) return "Refusing Generate report. Stop and let the operator confirm a signed-in Seller Central store."
  if (/^(Unlock|Unlock accounts|Create vault|Import vault|Export vault|Add credential|Add store|Reset vault|Change master password|Lock)$/.test(name)) {
    return `Refusing "${name}". Stop and let the operator handle the vault. Do not type or log a password.`
  }
  if (/^Open Time Out$/.test(name)) return "Refusing Open Time Out. It opens live Google pages."
  if (/^Scrape \d+ cases?$/.test(name)) return "Refusing case scrape. It reads live Seller Central case threads."
  if (/^Open \d+ tabs$/.test(name)) return "Refusing the confirm button that opens Seller Central tabs."
  const bulk = name.match(/^Open (\d+) (case|cases|shipment|shipments|SKU|SKUs)$/)
  if (bulk) {
    const count = Number(bulk[1])
    if (count >= 1 && count <= 10) return `Refusing "${name}". One to ten IDs open Seller Central tabs immediately.`
  }
  if (role === "option") {
    if (/^Open case \d/.test(name) || /^Open \d+ case IDs$/.test(name)) return `Refusing "${name}". It opens Seller Central case tabs.`
    if (/^Open shipment FBA/i.test(name) || /^Open \d+ shipment IDs$/.test(name)) return `Refusing "${name}". It opens Seller Central shipment tabs.`
    if (/^Open removal order /i.test(name) || /^Open \d+ removal order IDs$/.test(name)) return `Refusing "${name}". It opens Seller Central removal-order tabs.`
    if (/^Search '.+' as SKU$/.test(name)) return `Refusing "${name}". It opens a Seller Central inventory search.`
  }
  return null
}

function enterBlocked(nodes, count = uniqueCount(nodes)) {
  const focused = nodes.find((node) => node.focused)
  const focusedRole = focused?.role?.value ?? ""
  const focusedName = focused?.name?.value ?? ""
  const selected = nodes.find((node) => (node.properties ?? []).some((property) => property.name === "selected" && property.value?.value === true) && node.role?.value === "option")
  const selectedName = selected?.name?.value ?? ""
  const dialog = dialogName(nodes)
  const direct = blockedReason(focusedRole, focusedName) || blockedReason("option", selectedName)
  if (direct) return direct
  const identifier = /^(Case IDs|Shipment IDs|SKUs|Removal order IDs)$/.test(focusedName)
  if (identifier && dialog === "Scrape case" && count !== 0) {
    return "Refusing Enter on Scrape case. It reads live Seller Central case threads."
  }
  if (identifier && count !== null && count >= 1 && count <= 10 && dialog !== "Scrape case") {
    return `Refusing Enter with ${count} IDs. One to ten IDs open Seller Central tabs immediately. Use the validation paths (0 IDs, more than 50, or 11–50 then Cancel).`
  }
  if (identifier && count === null) {
    return "Refusing Enter because the unique-ID count is not visible yet."
  }
  return null
}

async function resolveBoxClick(session, node) {
  if (!node.backendDOMNodeId) throw new Error("Accessibility node has no DOM id.")
  const resolved = await session.send("DOM.resolveNode", { backendNodeId: node.backendDOMNodeId })
  const objectId = resolved.object?.objectId
  if (!objectId) throw new Error("Could not resolve the accessibility node.")
  await session.send("Runtime.callFunctionOn", {
    objectId,
    functionDeclaration: "function () { this.scrollIntoView({ block: 'center', inline: 'center' }); if (typeof this.focus === 'function') this.focus(); this.click(); }",
  })
}

async function readNodeValue(session, node) {
  if (!node?.backendDOMNodeId) return ""
  const resolved = await session.send("DOM.resolveNode", { backendNodeId: node.backendDOMNodeId })
  const objectId = resolved.object?.objectId
  if (!objectId) return ""
  const evaluated = await session.send("Runtime.callFunctionOn", {
    objectId,
    functionDeclaration: "function () { return typeof this.value === 'string' ? this.value : ''; }",
    returnByValue: true,
  })
  return evaluated.result?.value ?? ""
}

async function insertText(session, node, text) {
  await resolveBoxClick(session, node)
  await session.send("Input.insertText", { text })
  await new Promise((resolve) => setTimeout(resolve, 150))
  let nodes = await axNodes(session)
  let current = findNodes(nodes, node.role?.value, node.name?.value)[0] ?? node
  let value = await readNodeValue(session, current)
  if (value.includes(text) || value === text) return "insertText"
  const resolved = await session.send("DOM.resolveNode", { backendNodeId: current.backendDOMNodeId })
  await session.send("Runtime.callFunctionOn", {
    objectId: resolved.object.objectId,
    arguments: [{ value: text }],
    functionDeclaration: `function (text) {
      const prototype = this instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set
      if (setter) setter.call(this, text)
      else this.value = text
      this.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }))
    }`,
  })
  await new Promise((resolve) => setTimeout(resolve, 100))
  nodes = await axNodes(session)
  current = findNodes(nodes, node.role?.value, node.name?.value)[0] ?? current
  value = await readNodeValue(session, current)
  if (!value.includes(text) && value !== text) {
    throw new Error(`The field did not accept the text (got ${value.length} characters).`)
  }
  return "input-event"
}

function pickPages(list, state, targetName) {
  const pages = list.filter((target) => target.type === "page")
  if (!targetName || targetName === "fixture") {
    return pages.filter((target) => target.url.startsWith(state.fixtureUrl))
  }
  const file = targetName.endsWith(".html") ? targetName : `${targetName}.html`
  return pages.filter((target) => {
    try {
      const url = new URL(target.url)
      return url.protocol === "chrome-extension:" && url.pathname === `/${file}`
    } catch {
      return false
    }
  })
}

async function withPage(state, targetName, fn) {
  const list = await targets(state.port)
  const pages = pickPages(list, state, targetName)
  if (pages.length === 0) {
    die(`No ${targetName || "fixture"} page is open. URLs: ${list.filter((item) => item.type === "page").map((item) => safeUrl(item.url)).join(", ") || "(none)"}`)
  }
  const page = pages[pages.length - 1]
  const session = await connect(page.webSocketDebuggerUrl)
  try {
    await session.send("Page.enable")
    await session.send("Runtime.enable")
    return await fn(session, page)
  } finally {
    session.close()
  }
}

async function pageStatus(session) {
  const evaluated = await session.send("Runtime.evaluate", {
    expression: `JSON.stringify({
      readyState: document.readyState,
      title: document.title,
      host: Boolean(document.getElementById("command-palette-extension-root")),
      open: document.getElementById("command-palette-extension-root")?.getAttribute("data-s4e-palette-open") ?? "missing"
    })`,
    returnByValue: true,
  })
  let injected = false
  for (const context of session.contexts) {
    if (context.auxData?.isDefault !== false) continue
    try {
      const probe = await session.send("Runtime.evaluate", {
        contextId: context.id,
        expression: "typeof window.__s4eSpotlightPasteGuard === 'object'",
        returnByValue: true,
      })
      if (probe.result?.value === true) injected = true
    } catch {
      // A destroyed isolated world is not the extension.
    }
  }
  return { ...JSON.parse(evaluated.result.value), injected }
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now()
  let last
  while (Date.now() - start < timeoutMs) {
    last = await fn()
    if (last) return last
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for ${label}.`)
}

function killPid(pid) {
  if (!pid) return
  try { process.kill(-pid, "SIGTERM") } catch { /* not a group */ }
  try { process.kill(pid, "SIGTERM") } catch { /* already gone */ }
  setTimeout(() => {
    try { process.kill(-pid, "SIGKILL") } catch { /* already gone */ }
    try { process.kill(pid, "SIGKILL") } catch { /* already gone */ }
  }, 1500).unref()
}

async function launch() {
  assertRepo()
  const existing = await readState()
  if (existing && pidAlive(existing.pid)) {
    die(`Refusing to start a second Chrome. A run is already alive (${existing.runId}, pid ${existing.pid}). Run cleanup first.`)
  }
  if (flag("no-build") !== true) {
    const built = spawnSync("npm", ["run", "build"], { cwd: REPO_ROOT, stdio: "inherit" })
    if (built.status !== 0) die("npm run build failed.")
  }
  const hash = await distHash()
  const manifest = await manifestVersion()
  const runId = `${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}-${randomBytes(3).toString("hex")}`
  const profile = path.join(runDir(runId), "profile")
  const evidence = evidenceDir(runId)
  await mkdir(profile, { recursive: true })
  await mkdir(evidence, { recursive: true })
  await writeFile(path.join(profile, "s4e-verify-run.json"), JSON.stringify({ runId, createdAt: new Date().toISOString(), repoRoot: REPO_ROOT }))
  const chrome = await ensureChrome()
  const port = await freePort()
  const fixturePort = await freePort()
  const state = {
    runId,
    pid: 0,
    serverPid: 0,
    profile,
    port,
    fixturePort,
    fixtureUrl: `http://127.0.0.1:${fixturePort}/`,
    evidence,
    distHash: hash,
    chrome,
    manifestName: manifest.name,
    manifestVersion: manifest.version,
    startedAt: new Date().toISOString(),
  }
  const display = await ensureDisplay(state)
  const server = spawn(process.execPath, [SCRIPT_PATH, "serve", "--port", String(fixturePort)], {
    detached: true,
    stdio: "ignore",
  })
  server.unref()
  state.serverPid = server.pid
  const logPath = path.join(runDir(runId), "chrome.log")
  await mkdir(runDir(runId), { recursive: true })
  const logFd = createWriteStream(logPath, { flags: "a" })
  await new Promise((resolve) => logFd.once("open", resolve))
  const child = spawn(chrome, [
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-sync",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-popup-blocking",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--window-size=1280,800",
    `--remote-debugging-port=${port}`,
    "--remote-debugging-address=127.0.0.1",
    "--remote-allow-origins=*",
    `--load-extension=${path.join(REPO_ROOT, "dist")}`,
    `--disable-extensions-except=${path.join(REPO_ROOT, "dist")}`,
    state.fixtureUrl,
  ], {
    detached: true,
    env: chromeEnv(display),
    stdio: ["ignore", logFd.fd, logFd.fd],
  })
  child.unref()
  state.pid = child.pid
  await writeState(state)
  const started = Date.now()
  let version
  while (Date.now() - started < 20000) {
    if (!pidAlive(child.pid)) {
      const log = await readFile(logPath, "utf8").catch(() => "")
      die(`Chrome exited before DevTools came up.\n${log.slice(-2000)}`)
    }
    try {
      version = await fetchJson(`http://127.0.0.1:${port}/json/version`)
      break
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  if (!version) die("Timed out waiting for Chrome DevTools.")
  let extension
  const extensionStart = Date.now()
  while (Date.now() - extensionStart < 15000) {
    extension = await extensionInfo(port)
    if (extension) break
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  if (!extension) {
    const log = await readFile(logPath, "utf8").catch(() => "")
    die(`Command Palette did not load from dist/. Branded Google Chrome ignores --load-extension; this harness uses Chrome for Testing.\n${log.slice(-1500)}`)
  }
  state.extensionId = extension.id
  state.browser = version.Browser
  await writeState(state)
  console.log(JSON.stringify({
    ok: true,
    runId: state.runId,
    pid: state.pid,
    profile: state.profile,
    fixtureUrl: state.fixtureUrl,
    evidence: state.evidence,
    extensionId: extension.id,
    extensionVersion: extension.version,
    browser: version.Browser,
    distHash: hash,
    chrome,
  }, null, 2))
}

async function doctor() {
  assertRepo()
  const failures = []
  const state = await readState()
  if (!state) failures.push("no current run")
  else {
    assertOwnedProfile(state.profile)
    if (!pidAlive(state.pid)) failures.push(`chrome pid ${state.pid} is not running`)
    const line = state.pid ? cmdline(state.pid) : null
    if (state.pid && pidAlive(state.pid) && (!line || !line.includes(`--user-data-dir=${state.profile}`))) {
      failures.push("chrome command line is not the disposable profile this run created")
    }
    try {
      const marker = JSON.parse(await readFile(path.join(state.profile, "s4e-verify-run.json"), "utf8"))
      if (marker.runId !== state.runId) failures.push("profile marker run id mismatch")
    } catch {
      failures.push("profile marker missing")
    }
    let hash = ""
    try { hash = await distHash() } catch (error) { failures.push(`dist unreadable: ${error.message}`) }
    if (hash && hash !== state.distHash) failures.push("dist hash does not match the hash recorded at launch")
    let manifest = { name: "", version: "" }
    try { manifest = await manifestVersion() } catch (error) { failures.push(error.message) }
    if (manifest.name && manifest.name !== "Command Palette") failures.push(`manifest name is ${manifest.name}`)
    let extension = null
    let browser = ""
    try {
      const version = await fetchJson(`http://127.0.0.1:${state.port}/json/version`)
      browser = version.Browser
      extension = await extensionInfo(state.port)
    } catch (error) {
      failures.push(`devtools unreachable: ${error.message}`)
    }
    if (!extension) failures.push("Command Palette service worker is not loaded")
    else if (extension.version !== manifest.version) failures.push(`extension version ${extension.version} != manifest ${manifest.version}`)
    const report = {
      ok: failures.length === 0,
      runId: state.runId,
      pid: state.pid,
      profile: state.profile,
      profileOwned: true,
      chrome: state.chrome,
      browser,
      debuggingPort: state.port,
      fixtureUrl: state.fixtureUrl,
      extensionId: extension?.id ?? state.extensionId ?? null,
      extensionName: extension?.name ?? null,
      extensionVersion: extension?.version ?? null,
      manifestVersion: manifest.version,
      distHash: state.distHash,
      distHashMatches: hash === state.distHash,
      evidence: state.evidence,
      failures,
    }
    console.log(JSON.stringify(report, null, 2))
    if (failures.length) process.exit(1)
    return
  }
  console.log(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

async function check() {
  assertRepo()
  const state = await readState()
  const dir = state?.evidence
    ? path.join(state.evidence, "doctor")
    : path.join(EVIDENCE_ROOT, `static-${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`)
  await mkdir(dir, { recursive: true })
  const results = []
  for (const script of ["typecheck", "test"]) {
    const logPath = path.join(dir, `${script}.log`)
    const child = spawnSync("npm", ["run", script], { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 })
    const output = `${child.stdout ?? ""}${child.stderr ?? ""}`
    await writeFile(logPath, output)
    results.push({ script, exitCode: child.status ?? 1, log: logPath })
    console.log(`${script} exit ${child.status ?? 1} log ${logPath}`)
    if (child.status !== 0) console.error(output.slice(-4000))
  }
  if (results.some((result) => result.exitCode !== 0)) process.exit(1)
}

async function serve() {
  const port = Number(flag("port"))
  if (!port) die("serve requires --port")
  const html = await readFile(FIXTURE_PATH)
  const server = net.createServer((socket) => {
    let buffer = ""
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8")
      if (!buffer.includes("\r\n\r\n")) return
      const request = buffer.split("\r\n")[0] ?? ""
      const target = request.split(" ")[1] ?? "/"
      if (target === "/" || target === "/verify.html") {
        socket.end(`HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: ${html.length}\r\nConnection: close\r\n\r\n${html.toString("utf8")}`)
        return
      }
      socket.end("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
    })
  })
  server.listen(port, "127.0.0.1")
  await new Promise(() => {})
}

async function openFixture() {
  const state = await requireState()
  await withPage(state, "fixture", async (session) => {
    await session.send("Page.navigate", { url: state.fixtureUrl })
    await waitFor(async () => {
      const status = await pageStatus(session)
      return status.readyState === "complete" && status.title === "S4E verify fixture" ? status : null
    }, 15000, "fixture page")
    const status = await pageStatus(session)
    console.log(JSON.stringify({ ok: true, ...status, url: state.fixtureUrl }, null, 2))
  })
}

async function shortcut() {
  const state = await requireState()
  await withPage(state, flag("target") || "fixture", async (session) => {
    await session.send("Page.bringToFront")
    const readyFallback = Date.now() + 3000
    await waitFor(async () => {
      const status = await pageStatus(session)
      if (status.readyState === "complete" && status.injected) return status
      if (status.readyState === "complete" && Date.now() > readyFallback) return status
      return null
    }, 15000, "content script injection")
    const nodes = await axNodes(session)
    const heading = findNodes(nodes, "heading", "S4E verify fixture")[0]
    if (heading) await resolveBoxClick(session, heading)
    else {
      await session.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 40, y: 40, button: "left", clickCount: 1 })
      await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 40, y: 40, button: "left", clickCount: 1 })
    }
    const modifiers = process.platform === "darwin" ? 4 : 2
    await session.send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      modifiers,
      key: "/",
      code: "Slash",
      windowsVirtualKeyCode: 191,
      nativeVirtualKeyCode: 191,
    })
    await session.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      modifiers,
      key: "/",
      code: "Slash",
      windowsVirtualKeyCode: 191,
      nativeVirtualKeyCode: 191,
    })
    const opened = await waitFor(async () => {
      const status = await pageStatus(session)
      return status.open === "true" ? status : null
    }, 15000, "palette open")
    console.log(JSON.stringify({ ok: true, shortcut: process.platform === "darwin" ? "Meta+/" : "Ctrl+/", ...opened }, null, 2))
  })
}

async function press() {
  const state = await requireState()
  const key = flag("key")
  if (typeof key !== "string") die("press requires --key")
  const shift = flag("shift") === true
  const keys = {
    ArrowDown: { key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 },
    ArrowUp: { key: "ArrowUp", code: "ArrowUp", windowsVirtualKeyCode: 38 },
    Enter: { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 },
    Escape: { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 },
    Backspace: { key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 },
    Tab: { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
    " ": { key: " ", code: "Space", windowsVirtualKeyCode: 32, text: " " },
  }
  const spec = keys[key] ?? (key.length === 1 ? { key, code: `Key${key.toUpperCase()}`, text: key, windowsVirtualKeyCode: key.toUpperCase().charCodeAt(0) } : null)
  if (!spec) die(`Unsupported key ${key}`)
  await withPage(state, flag("target") || "fixture", async (session) => {
    if (key === "Enter" && !shift) {
      const nodes = await axNodes(session)
      const focused = nodes.find((node) => node.focused)
      const fromField = focused ? countInValue(dialogName(nodes), await readNodeValue(session, focused)) : null
      const reason = enterBlocked(nodes, fromField ?? uniqueCount(nodes))
      if (reason) die(reason, 2)
    }
    const modifiers = shift ? 8 : 0
    await session.send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      modifiers,
      key: spec.key,
      code: spec.code,
      windowsVirtualKeyCode: spec.windowsVirtualKeyCode,
      nativeVirtualKeyCode: spec.windowsVirtualKeyCode,
    })
    if (spec.text && !shift) {
      await session.send("Input.dispatchKeyEvent", {
        type: "char",
        modifiers,
        key: spec.key,
        code: spec.code,
        text: spec.text,
        windowsVirtualKeyCode: spec.windowsVirtualKeyCode,
      })
    }
    await session.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      modifiers,
      key: spec.key,
      code: spec.code,
      windowsVirtualKeyCode: spec.windowsVirtualKeyCode,
      nativeVirtualKeyCode: spec.windowsVirtualKeyCode,
    })
    console.log(JSON.stringify({ ok: true, key, shift }))
  })
}

async function click() {
  const state = await requireState()
  const role = flag("role")
  const name = flag("name")
  if (typeof role !== "string" || typeof name !== "string") die("click requires --role and --name")
  const reason = blockedReason(role, name)
  if (reason) die(reason, 2)
  await withPage(state, flag("target") || "fixture", async (session) => {
    const nodes = await axNodes(session)
    const matches = findNodes(nodes, role, name)
    if (matches.length === 0) die(`No ${role} named "${name}" is visible.`)
    const exact = matches.filter((node) => nodeText(node).name === name)
    const node = exact[0] ?? matches[0]
    if (!exact.length && matches.length > 1) {
      die(`Several ${role} nodes match "${name}": ${matches.map((item) => nodeText(item).name).join(" | ")}`)
    }
    await resolveBoxClick(session, node)
    console.log(JSON.stringify({ ok: true, role, name: nodeText(node).name }))
  })
}

async function fill() {
  const state = await requireState()
  const role = flag("role")
  const name = flag("name")
  const raw = flag("value")
  if (typeof role !== "string" || typeof name !== "string" || typeof raw !== "string") die("fill requires --role, --name, and --value")
  const reason = blockedReason(role, name)
  if (reason) die(reason, 2)
  const text = unescapeArg(raw)
  await withPage(state, flag("target") || "fixture", async (session) => {
    const nodes = await axNodes(session)
    const node = findNodes(nodes, role, name)[0]
    if (!node) die(`No ${role} named "${name}" is visible.`)
    const via = await insertText(session, node, text)
    console.log(JSON.stringify({ ok: true, role, name, characters: text.length, via }))
  })
}

async function typeText() {
  const state = await requireState()
  const raw = flag("text")
  if (typeof raw !== "string") die("type requires --text")
  const text = unescapeArg(raw)
  await withPage(state, flag("target") || "fixture", async (session) => {
    const nodes = await axNodes(session)
    const focused = nodes.find((node) => node.focused) ?? findNodes(nodes, "combobox", "Search commands")[0] ?? findNodes(nodes, "textbox", "")[0]
    if (!focused) die("Nothing is focused.")
    const reason = blockedReason(focused.role?.value ?? "", focused.name?.value ?? "")
    if (reason) die(reason, 2)
    const via = await insertText(session, focused, text)
    console.log(JSON.stringify({ ok: true, role: focused.role?.value, name: focused.name?.value, characters: text.length, via }))
  })
}

async function expectNode() {
  const state = await requireState()
  const role = typeof flag("role") === "string" ? flag("role") : ""
  const name = flag("name")
  if (typeof name !== "string") die("expect requires --name")
  const timeoutMs = Number(flag("timeout") ?? 8000)
  const absent = flag("absent") === true
  const target = flag("target") || "fixture"
  const started = Date.now()
  let last = ""
  while (Date.now() - started < timeoutMs) {
    const found = await withPage(state, target, async (session) => {
      const nodes = await axNodes(session)
      last = formatTree(nodes)
      return findNodes(nodes, role, name).length > 0
    })
    if (found !== absent) {
      console.log(JSON.stringify({ ok: true, role: role || null, name, absent, found }))
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  die(`${absent ? "Still found" : "Did not find"} ${role || "node"} "${name}".\n${last.slice(0, 4000)}`)
}

async function snapshot() {
  const state = await requireState()
  const out = flag("path")
  if (typeof out !== "string") die("snapshot requires --path")
  if (flag("aria") !== true) die("snapshot requires --aria")
  await withPage(state, flag("target") || "fixture", async (session) => {
    const text = formatTree(await axNodes(session))
    await mkdir(path.dirname(path.resolve(out)), { recursive: true })
    await writeFile(out, `${text}\n`)
    console.log(JSON.stringify({ ok: true, path: path.resolve(out), lines: text.split("\n").length }))
  })
}

async function screenshot() {
  const state = await requireState()
  const out = flag("path")
  if (typeof out !== "string") die("screenshot requires --path")
  await withPage(state, flag("target") || "fixture", async (session) => {
    await session.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
    const shot = await session.send("Page.captureScreenshot", { format: "png" })
    await mkdir(path.dirname(path.resolve(out)), { recursive: true })
    await writeFile(out, Buffer.from(shot.data, "base64"))
    console.log(JSON.stringify({ ok: true, path: path.resolve(out) }))
  })
}

async function status() {
  const state = await requireState()
  await withPage(state, flag("target") || "fixture", async (session, page) => {
    const pageState = await pageStatus(session)
    console.log(JSON.stringify({ ok: true, url: safeUrl(page.url), ...pageState }, null, 2))
  })
}

async function pages() {
  const state = await requireState()
  const list = await targets(state.port)
  console.log(JSON.stringify(list.filter((target) => target.type === "page" || target.type === "service_worker").map((target) => ({
    type: target.type,
    title: target.title,
    url: safeUrl(target.url),
  })), null, 2))
}

async function extensionUrl() {
  const state = await requireState()
  const page = args.find((arg) => !arg.startsWith("--"))
  if (!page || !EXTENSION_PAGES.has(page)) die("extension-url requires popup.html, options.html, or timeout.html")
  const info = await extensionInfo(state.port)
  if (!info) die("Command Palette is not loaded.")
  console.log(`chrome-extension://${info.id}/${page}`)
}

async function newTab() {
  const state = await requireState()
  const page = flag("page")
  if (typeof page !== "string" || !EXTENSION_PAGES.has(page)) {
    die("new-tab requires --page popup.html, options.html, or timeout.html. Open results.html from Generate reports so it receives a launch id.")
  }
  const info = await extensionInfo(state.port)
  if (!info) die("Command Palette is not loaded.")
  const version = await fetchJson(`http://127.0.0.1:${state.port}/json/version`)
  const browser = await connect(version.webSocketDebuggerUrl)
  try {
    await browser.send("Target.createTarget", { url: `chrome-extension://${info.id}/${page}` })
  } finally {
    browser.close()
  }
  await waitFor(async () => {
    const list = await targets(state.port)
    return pickPages(list, state, page).length > 0 ? true : null
  }, 10000, page)
  console.log(JSON.stringify({ ok: true, page, url: `chrome-extension://${info.id}/${page}` }))
}

async function cleanup() {
  const state = await readState()
  if (!state) {
    console.log(JSON.stringify({ ok: true, cleaned: false, reason: "no run" }))
    return
  }
  assertOwnedProfile(state.profile)
  if (!state.evidence.startsWith(EVIDENCE_ROOT + path.sep) && state.evidence !== EVIDENCE_ROOT) {
    die(`Refusing cleanup because evidence path is unexpected: ${state.evidence}`)
  }
  killPid(state.pid)
  killPid(state.serverPid)
  killPid(state.xvfbPid)
  const deadline = Date.now() + 4000
  while (Date.now() < deadline && pidAlive(state.pid)) {
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  if (pidAlive(state.pid)) {
    try { process.kill(-state.pid, "SIGKILL") } catch { /* already gone */ }
    try { process.kill(state.pid, "SIGKILL") } catch { /* already gone */ }
  }
  await rm(runDir(state.runId), { recursive: true, force: true })
  const current = await readState()
  if (current?.runId === state.runId) await rm(CURRENT_PATH, { force: true })
  let evidenceEntries = []
  try {
    const { readdir } = await import("node:fs/promises")
    evidenceEntries = await readdir(state.evidence)
  } catch {
    evidenceEntries = []
  }
  console.log(JSON.stringify({
    ok: true,
    cleaned: true,
    runId: state.runId,
    evidence: state.evidence,
    evidenceSurvived: evidenceEntries.length >= 0 && await exists(state.evidence),
    evidenceEntries,
  }, null, 2))
}

async function exists(file) {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

function selfCheck() {
  const cases = [
    ["button", "Open 1 case", true],
    ["button", "Open 10 cases", true],
    ["button", "Open 11 cases", false],
    ["button", "Open 50 cases", false],
    ["button", "Open 51 cases", false],
    ["button", "Open 11 tabs", true],
    ["button", "Scrape 1 case", true],
    ["button", "Scrape 11 cases", true],
    ["button", "Scrape", false],
    ["button", "Generate report", true],
    ["button", "Cancel", false],
    ["button", "Back", false],
    ["button", "Reveal", true],
    ["button", "Unlock", true],
    ["button", "Create vault", true],
    ["button", "Open Seller Central", true],
    ["button", "Download logs", false],
    ["button", "Clear", false],
    ["button", "Edit form values", false],
    ["option", "Open case IDs", false],
    ["option", "Open case 21476974831", true],
    ["option", "Open Time Out", true],
    ["option", "Switch store", false],
    ["option", "Generate reports", false],
    ["option", "Search 'WIDGET-1' as SKU", true],
    ["option", "Search SKUs", false],
    ["textbox", "Master password", true],
    ["textbox", "Case IDs", false],
    ["switch", "Search SKUs", false],
  ]
  const failures = []
  for (const [role, name, blocked] of cases) {
    const reason = blockedReason(role, name)
    if (Boolean(reason) !== blocked) failures.push(`${role} "${name}" blocked=${Boolean(reason)} expected=${blocked} ${reason ?? ""}`)
  }
  if (failures.length) die(failures.join("\n"))
  const evidence = evidenceDir("example")
  const owned = path.join(ROOT_DIR, "runs", "example", "profile")
  if (!evidence.startsWith(EVIDENCE_ROOT + path.sep)) die("evidence path escaped")
  if (!owned.startsWith(path.join(ROOT_DIR, "runs") + path.sep)) die("profile path escaped")
  console.log(JSON.stringify({ ok: true, cases: cases.length }))
}

const handlers = {
  launch,
  doctor,
  check,
  serve,
  open: openFixture,
  shortcut,
  press,
  click,
  fill,
  type: typeText,
  expect: expectNode,
  snapshot,
  screenshot,
  status,
  pages,
  "extension-url": extensionUrl,
  "new-tab": newTab,
  cleanup,
  "self-check": async () => selfCheck(),
}

if (!command || !handlers[command]) {
  die(`Usage: verify-palette.mjs <${Object.keys(handlers).join("|")}>`)
}

handlers[command]().catch((error) => die(error.stack || error.message))
