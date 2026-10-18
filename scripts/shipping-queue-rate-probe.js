/**
 * Shipping queue hold probe.
 *
 * Temporary. Not part of the extension build. Production still loads shipment
 * details 40 at a time.
 *
 * How to run:
 * 1. Open any https://sellercentral.amazon.* page while signed in to a store.
 * 2. Open DevTools for that page and select the Console tab. Use the page
 *    console, not the extension service worker console.
 * 3. Paste this entire file. It only defines sqProbe(); it does not start.
 * 4. Run: await sqProbe()
 * 5. Leave the tab open. To halt between requests, run: sqProbeStop = true
 *    Each new run clears that flag.
 *
 * The run collects shipment ids at page size 250, then holds a sliding window
 * of 40 for 10 minutes. A session error stops the hold. The probe then waits
 * and checks that the shipment list still loads. It does not resume.
 *
 * Successful detail calls are not logged one by one. Failures are logged
 * immediately, and a line every 15 seconds prints the recent pace. Copy the
 * table back with:
 *
 * copy(JSON.stringify({
 *   reusedIds: sqProbeResult.reusedIds,
 *   detailCalls: sqProbeResult.detailCalls,
 *   list: sqProbeResult.list,
 *   summary: sqProbeResult.summary,
 *   sustain: sqProbeResult.sustain,
 * }, null, 2))
 *
 * A longer hold, set before starting: SQ_PROBE.sustainMs = 3 * 60 * 60 * 1000
 *
 * A single 429 does not end the hold. The hold stops on 3 responses in a row
 * that are 429, or when more than 25% of at least 20 responses are 429 or
 * network failures. There are no retries.
 */
const SQ_PROBE = {
  pageSize: 250,
  maxListPages: 120,
  concurrency: 40,
  sessionRecoveryMs: 60_000,
  sustainMs: 10 * 60 * 1000,
  rollMs: 15_000,
  failRatio: 0.25,
  minSample: 20,
  consecutive429: 3,
}

function sqSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sqPercentile(values, p) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))
  return sorted[index]
}

function sqRound(value) {
  return Math.round(value * 100) / 100
}

function sqInterestingHeaders(response) {
  const headers = {}
  response.headers.forEach((value, name) => {
    if (/rate|limit|quota|throttle|retry/i.test(name)) headers[name] = value
  })
  return headers
}

function sqLogFailure(stageName, result) {
  const retry = result.headers["retry-after"]
  const retryText = retry ? ` retry-after=${retry}` : ""
  const headerText = Object.keys(result.headers).length > 0 ? ` ${JSON.stringify(result.headers)}` : ""
  const errorText = result.error ? ` error=${result.error}` : ""
  const htmlText = result.html ? " html" : ""
  console.log(`[sqProbe] ${stageName} ${result.id} status=${result.status}${htmlText} ${result.ms}ms${retryText}${headerText}${errorText}`)
}

function sqEmptyStats() {
  return { requests: 0, ok: 0, tooMany: 0, network: 0, durations: [] }
}

function sqSummaryRow(stage, stats, wallMs, peak, stopped, concurrency, round) {
  const requests = stats.requests
  return {
    stage,
    round,
    concurrency,
    requests,
    ok: stats.ok,
    429: stats.tooMany,
    other: requests - stats.ok - stats.tooMany,
    p50: sqPercentile(stats.durations, 0.5),
    p95: sqPercentile(stats.durations, 0.95),
    rps: wallMs > 0 ? sqRound(requests / (wallMs / 1000)) : null,
    peak,
    stopped,
  }
}

function sqListRows(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== "object") return null
  if (Array.isArray(payload.shipments)) return payload.shipments
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.shipmentList)) return payload.shipmentList
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.payload)) return payload.payload
  return null
}

function sqShipmentId(row) {
  if (!row || typeof row !== "object" || typeof row.shipmentId !== "string") return ""
  return row.shipmentId.trim()
}

function sqCursor(row) {
  const id = sqShipmentId(row)
  if (!id || row.createdDate == null || row.lastUpdatedDate == null) return undefined
  return {
    lastShipmentId: id,
    createdDate: String(row.createdDate),
    lastUpdatedDate: String(row.lastUpdatedDate),
  }
}

function sqListUrl(pageSize, cursor) {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    orderBy: "SHIPMENT_UPDATE_DATE",
    isOrderAscending: "false",
  })
  if (cursor) {
    params.set("lastShipmentId", cursor.lastShipmentId)
    params.set("createdDate", cursor.createdDate)
    params.set("lastUpdatedDate", cursor.lastUpdatedDate)
  }
  params.set("t2pLaunched", "true")
  return `${location.origin}/fba/shippingqueue/api/v1/shipment/listShipments?${params.toString()}`
}

function sqDetailUrl(id) {
  return `${location.origin}/fba/wmsr/eligibilities/${encodeURIComponent(id)}?withInquiry=true&withDiscrepancies=true`
}

function sqIsSession(result) {
  return result.status === 401 || result.status === 403 || result.html === true
}

function sqAddIds(allIds, seen, rows) {
  for (const row of rows) {
    const id = sqShipmentId(row)
    if (!id || seen.has(id)) continue
    seen.add(id)
    allIds.push(id)
  }
}

async function sqWait(ms, label) {
  if (ms <= 0) return !globalThis.sqProbeStop
  console.log(`[sqProbe] waiting ${Math.round(ms / 1000)}s ${label}`)
  const end = performance.now() + ms
  while (performance.now() < end) {
    if (globalThis.sqProbeStop) return false
    await sqSleep(Math.min(250, end - performance.now()))
  }
  return !globalThis.sqProbeStop
}

async function sqFetchList(pageSize, cursor) {
  const started = performance.now()
  const url = sqListUrl(pageSize, cursor)
  let status = 0
  let headers = {}
  let html = false
  let error
  let rows = []
  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      referrer: `${location.origin}/manage/shipments?ref=sc_shipments`,
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
      },
    })
    status = response.status
    headers = sqInterestingHeaders(response)
    html = /text\/html/i.test(response.headers.get("content-type") || "")
    if (response.ok && !html) {
      const payload = await response.json()
      const parsed = sqListRows(payload)
      if (!parsed) error = "response was not a shipment list"
      else rows = parsed
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }
  const ms = Math.round(performance.now() - started)
  const result = {
    id: `list:${pageSize}`,
    status,
    ms,
    headers,
    html,
    error,
    ok: status >= 200 && status < 300 && !html && !error,
    rows,
  }
  if (result.ok) console.log(`[sqProbe] list-${pageSize} status=${status} ${ms}ms rows=${rows.length}`)
  else sqLogFailure(`list-${pageSize}`, result)
  return result
}

async function sqFetchDetail(stageName, id) {
  const started = performance.now()
  let status = 0
  let headers = {}
  let html = false
  let error
  try {
    const response = await fetch(sqDetailUrl(id), {
      method: "GET",
      mode: "cors",
      credentials: "include",
      referrer: `${location.origin}/fba/wmsr/${encodeURIComponent(id)}`,
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
      },
    })
    status = response.status
    headers = sqInterestingHeaders(response)
    html = /text\/html/i.test(response.headers.get("content-type") || "")
    await response.arrayBuffer()
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }
  const result = {
    id,
    status,
    ms: Math.round(performance.now() - started),
    headers,
    html,
    error,
    ok: status >= 200 && status < 300 && !html,
  }
  if (!result.ok) sqLogFailure(stageName, result)
  return result
}

/**
 * Sliding window. Ids repeat until the deadline.
 * A session error stops this hold.
 */
async function sqRunStage(state, name, ids, concurrency, deadline, round) {
  const stats = sqEmptyStats()
  let peak = 0
  let inFlight = 0
  let cursor = 0
  let consecutive = 0
  let stopLaunch = false
  let reason = "complete"
  const started = performance.now()
  let lastFlush = started
  let windowCount = 0
  let window429 = 0
  let windowOther = 0
  const windowDurations = []

  function note(next) {
    if (reason === "complete") reason = next
  }

  function flushWindow() {
    const now = performance.now()
    const sliceMs = now - lastFlush
    if (sliceMs <= 0 && windowCount === 0) return
    const totalSec = Math.round((now - started) / 1000)
    const rps = sliceMs > 0 ? sqRound(windowCount / (sliceMs / 1000)) : 0
    console.log(`[sqProbe] ${name} ${totalSec}s requests=${windowCount} rps=${rps} 429=${window429} other=${windowOther} p50=${sqPercentile(windowDurations, 0.5)} inFlight=${inFlight} total=${stats.requests}`)
    windowCount = 0
    window429 = 0
    windowOther = 0
    windowDurations.length = 0
    lastFlush = now
  }

  function consider(result) {
    if (sqIsSession(result)) {
      stopLaunch = true
      reason = "session"
      return
    }
    if (result.status === 429) {
      consecutive += 1
      stats.tooMany += 1
    } else {
      consecutive = 0
    }
    if (result.status === 0) stats.network += 1
    if (consecutive >= SQ_PROBE.consecutive429) {
      stopLaunch = true
      note("rate limit")
      return
    }
    if (stats.requests >= SQ_PROBE.minSample) {
      if (stats.tooMany / stats.requests > SQ_PROBE.failRatio) {
        stopLaunch = true
        note("rate limit")
      } else if (stats.network / stats.requests > SQ_PROBE.failRatio) {
        stopLaunch = true
        note("network")
      }
    }
  }

  const timer = setInterval(flushWindow, SQ_PROBE.rollMs)
  try {
    await new Promise((resolve) => {
      const pump = () => {
        if (!stopLaunch && globalThis.sqProbeStop) note("stopped")
        if (!stopLaunch && deadline != null && performance.now() >= deadline) note("time")
        if (stopLaunch || reason !== "complete" || ids.length === 0) {
          if (inFlight === 0) resolve()
          return
        }
        while (inFlight < concurrency && reason === "complete") {
          if (deadline != null && performance.now() >= deadline) {
            note("time")
            break
          }
          const id = ids[cursor % ids.length]
          cursor += 1
          state.detailCalls += 1
          inFlight += 1
          peak = Math.max(peak, inFlight)
          void sqFetchDetail(name, id).then((result) => {
            inFlight -= 1
            stats.requests += 1
            if (result.ok) stats.ok += 1
            stats.durations.push(result.ms)
            windowCount += 1
            if (result.status === 429) window429 += 1
            else if (!result.ok) windowOther += 1
            windowDurations.push(result.ms)
            consider(result)
            pump()
          })
        }
        if (inFlight === 0) resolve()
      }
      pump()
    })
  } finally {
    clearInterval(timer)
  }

  if (cursor > ids.length) state.reusedIds = true
  const wallMs = performance.now() - started
  const row = sqSummaryRow(name, stats, wallMs, peak, reason, concurrency, round)
  console.log(`[sqProbe] ${name} stopped=${reason} concurrency=${concurrency} peak=${peak} requests=${row.requests} ok=${row.ok} 429=${row[429]} other=${row.other} p50=${row.p50} rps=${row.rps}`)
  return { name, concurrency, round, stats, wallMs, peak, stopped: reason, row, cycled: cursor > ids.length }
}

async function sqCollectIds(state, summary, list) {
  const pageSize = SQ_PROBE.pageSize
  const first = await sqFetchList(pageSize)
  summary.push(sqSummaryRow("list-250", {
    requests: 1,
    ok: first.ok ? 1 : 0,
    tooMany: first.status === 429 ? 1 : 0,
    durations: [first.ms],
  }, first.ms, 1, sqIsSession(first) ? "session" : first.ok ? "complete" : "error", 1, null))
  list.push({
    pageSize,
    status: first.status,
    ms: first.ms,
    rows: first.rows.length,
    headers: first.headers,
    error: first.error,
    html: first.html,
  })
  if (sqIsSession(first)) {
    state.sessionDead = true
    console.log("[sqProbe] session rejected the list request; stopping")
    return []
  }
  if (!first.ok) return []

  const allIds = []
  const seen = new Set()
  sqAddIds(allIds, seen, first.rows)
  let rows = first.rows
  let cursor = rows.length > 0 ? sqCursor(rows[rows.length - 1]) : undefined
  let pages = 1
  while (pages < SQ_PROBE.maxListPages && cursor && rows.length >= pageSize) {
    const page = await sqFetchList(pageSize, cursor)
    pages += 1
    if (sqIsSession(page)) {
      state.sessionDead = true
      console.log("[sqProbe] session rejected a list page; stopping")
      break
    }
    if (!page.ok) break
    rows = page.rows
    sqAddIds(allIds, seen, rows)
    cursor = rows.length > 0 ? sqCursor(rows[rows.length - 1]) : undefined
  }
  console.log(`[sqProbe] collected ${allIds.length} shipment ids`)
  return allIds
}

async function sqRecover(state, summary, list) {
  console.log("[sqProbe] session error on the hold; checking whether the list still loads")
  const waited = await sqWait(SQ_PROBE.sessionRecoveryMs, "before the list check")
  if (!waited) return false
  const page = await sqFetchList(SQ_PROBE.pageSize)
  const stopped = sqIsSession(page) ? "session" : page.ok ? "complete" : "error"
  summary.push(sqSummaryRow("session-check", {
    requests: 1,
    ok: page.ok ? 1 : 0,
    tooMany: page.status === 429 ? 1 : 0,
    durations: [page.ms],
  }, page.ms, 1, stopped, 1, null))
  list.push({
    pageSize: SQ_PROBE.pageSize,
    status: page.status,
    ms: page.ms,
    rows: page.rows.length,
    headers: page.headers,
    error: page.error,
    html: page.html,
    check: true,
  })
  if (!page.ok) {
    state.sessionDead = true
    console.log("[sqProbe] list check failed; stopping")
    return false
  }
  console.log("[sqProbe] list check ok; ending without resuming")
  return true
}

async function sqProbe() {
  if (globalThis.__sqProbeRunning) {
    console.warn("[sqProbe] already running")
    return globalThis.sqProbeResult
  }
  globalThis.__sqProbeRunning = true
  globalThis.sqProbeStop = false

  const state = { detailCalls: 0, sessionDead: false, reusedIds: false }
  const summary = []
  const list = []
  let sustain = null
  const startedAt = new Date().toISOString()
  const holdName = `hold-${SQ_PROBE.concurrency}`

  try {
    if (!/sellercentral\.amazon\./i.test(location.hostname)) {
      console.warn("[sqProbe] This page is not Seller Central. Open a signed-in sellercentral.amazon.* tab and paste the probe there.")
    }
    console.log(`[sqProbe] start ${location.origin} hold ${Math.round(SQ_PROBE.sustainMs / 60000)} minutes at concurrency ${SQ_PROBE.concurrency}`)

    const allIds = await sqCollectIds(state, summary, list)
    if (state.sessionDead || globalThis.sqProbeStop) {
      console.log("[sqProbe] hold skipped")
    } else if (allIds.length === 0) {
      console.log("[sqProbe] no shipment ids, so the hold was not run")
    } else {
      console.log(`[sqProbe] ${holdName} for ${Math.round(SQ_PROBE.sustainMs / 60000)} minutes`)
      const run = await sqRunStage(
        state,
        holdName,
        allIds,
        SQ_PROBE.concurrency,
        performance.now() + SQ_PROBE.sustainMs,
        null,
      )
      summary.push(run.row)
      sustain = {
        name: holdName,
        concurrency: SQ_PROBE.concurrency,
        cycled: run.cycled,
        requests: run.stats.requests,
        stopped: run.stopped,
        wallMs: run.wallMs,
        peak: run.peak,
      }
      if (run.stopped === "session" && !globalThis.sqProbeStop) {
        await sqRecover(state, summary, list)
      }
    }
  } finally {
    globalThis.__sqProbeRunning = false
  }

  const result = {
    origin: location.origin,
    startedAt,
    finishedAt: new Date().toISOString(),
    reusedIds: state.reusedIds,
    detailCalls: state.detailCalls,
    sessionDead: state.sessionDead,
    list,
    summary,
    sustain,
  }
  globalThis.sqProbeResult = result
  console.log("[sqProbe] summary")
  console.table(summary)
  console.log("[sqProbe] full result is on window.sqProbeResult")
  return result
}

globalThis.SQ_PROBE = SQ_PROBE
globalThis.sqProbe = sqProbe
console.log("[sqProbe] ready. On this page's console, run: await sqProbe()")
console.log("[sqProbe] To halt between requests, run: sqProbeStop = true")
console.log("[sqProbe] One 10 minute hold at concurrency 40. A session error ends the hold.")
