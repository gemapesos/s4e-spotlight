import * as React from "react"
import { Camera, CircleAlert, Download } from "lucide-react"

import { HeaderButton, KeyHint, Notice, PanelFooter, PrimaryButton } from "@/components/panel"
import { Spinner } from "@/components/ui/spinner"
import { CheckBubble } from "@/components/switch/SwitchProgress"
import { cn } from "@/lib/utils"
import { extractShipmentIds, findShipmentIds } from "@/shared/identifiers"
import { saveFile } from "@/shared/download"
import { errorMessage } from "@/shared/log"
import { MAX_BULK_IDS, type AccountsStatus } from "@/shared/messages"
import type { SellerCentralSessionState } from "@/sellerCentral/session"
import {
  captureShipment,
  openCaptureTab,
  shipmentsZip,
  shipmentsZipName,
  StoppedError,
  type ShipmentCapture,
} from "@/sellerCentral/shipmentScreenshots"
import { formatDuration, plural, ResultHeader, StoreStrip, useTabKeys, WorkspaceBody, type WorkspaceLaunch } from "@/pages/workspace/workspaceParts"

type Phase = "input" | "running" | "done"
type Row = { state: "waiting" } | { state: "running"; message: string } | { state: "done"; capture: ShipmentCapture } | { state: "failed"; error: string }

const MAX_CHIPS = 12

function rowDetail(row: Row): string {
  if (row.state === "waiting") return "Waiting…"
  if (row.state === "running") return row.message
  if (row.state === "failed") return row.error
  const shots = plural(row.capture.files.length, "screenshot")
  return row.capture.notes.length ? `${shots} · ${plural(row.capture.notes.length, "note")}: ${row.capture.notes.join(" ")}` : shots
}

/**
 * Screenshots of each shipment's Send to Amazon steps and UPS Proof of Delivery, saved as one zip.
 * The capture runs in a background tab of the user's window that this page drives, so closing
 * this window stops it.
 */
export function ShipmentsTab({
  hidden,
  launch,
  onChangeStore,
  onOpenSellerCentral,
  session,
  status,
}: {
  hidden: boolean
  launch: WorkspaceLaunch | null
  onChangeStore?: () => void
  onOpenSellerCentral: () => void
  session: SellerCentralSessionState
  status: AccountsStatus | null
}) {
  const [input, setInput] = React.useState("")
  const [phase, setPhase] = React.useState<Phase>("input")
  const [requested, setRequested] = React.useState<string[]>([])
  const [rows, setRows] = React.useState<Record<string, Row>>({})
  const [captures, setCaptures] = React.useState<ShipmentCapture[]>([])
  const [finishedAt, setFinishedAt] = React.useState(() => new Date())
  const [elapsedMs, setElapsedMs] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const token = React.useRef(0)
  const closeTab = React.useRef<(() => Promise<void>) | null>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const ids = React.useMemo(() => extractShipmentIds(input), [input])
  const duplicates = React.useMemo(() => findShipmentIds(input).length - ids.length, [ids.length, input])

  const launchSerial = launch?.serial
  React.useEffect(() => {
    if (launch?.mode === "shipments" && phase !== "running") window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [launchSerial])

  // Closing the window ends the run; let go of its tab and the debugger with it.
  React.useEffect(() => {
    const onLeave = () => { void closeTab.current?.() }
    window.addEventListener("pagehide", onLeave)
    return () => window.removeEventListener("pagehide", onLeave)
  }, [])

  const capture = async () => {
    if (phase === "running") return
    const shipmentIds = extractShipmentIds(input)
    if (shipmentIds.length === 0) return setError("Enter at least one valid FBA Shipment ID.")
    if (shipmentIds.length > MAX_BULK_IDS) return setError(`Capture no more than ${MAX_BULK_IDS} shipments at a time.`)
    const run = ++token.current
    const stopped = () => run !== token.current
    const startedAt = Date.now()
    const done: ShipmentCapture[] = []
    const update = (id: string, row: Row) => { if (!stopped()) setRows((current) => ({ ...current, [id]: row })) }
    setRequested(shipmentIds)
    setRows(Object.fromEntries(shipmentIds.map((id) => [id, { state: "waiting" } satisfies Row])))
    setCaptures([])
    setError(null)
    setPhase("running")
    try {
      const tab = await openCaptureTab()
      closeTab.current = tab.close
      try {
        for (const shipmentId of shipmentIds) {
          if (stopped()) return
          update(shipmentId, { state: "running", message: "Starting…" })
          try {
            const result = await captureShipment(tab.target, shipmentId, stopped, (message) => update(shipmentId, { state: "running", message }))
            done.push(result)
            update(shipmentId, { state: "done", capture: result })
          } catch (caught) {
            if (caught instanceof StoppedError || stopped()) return
            const message = errorMessage(caught, "Couldn’t capture this shipment.")
            done.push({ shipmentId, files: [], notes: [message] })
            update(shipmentId, { state: "failed", error: message })
            if (/signed out/iu.test(message)) throw caught
          }
        }
      } finally {
        closeTab.current = null
        await tab.close()
      }
      if (stopped()) return
      setCaptures(done)
      setFinishedAt(new Date())
      setElapsedMs(Date.now() - startedAt)
      setPhase("done")
    } catch (caught) {
      if (stopped()) return
      setError(errorMessage(caught, "Couldn’t capture shipments. Please try again."))
      setCaptures(done)
      setPhase(done.some((item) => item.files.length) ? "done" : "input")
    }
  }

  const stop = () => {
    token.current += 1
    void closeTab.current?.()
    setPhase("input")
  }

  const shots = captures.reduce((sum, item) => sum + item.files.length, 0)
  const download = () => {
    try {
      saveFile(shipmentsZip(captures), shipmentsZipName(requested, finishedAt))
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t save the file."))
    }
  }

  useTabKeys(!hidden, (event) => {
    if (phase === "running" && event.key === "Escape") {
      event.preventDefault()
      stop()
    }
  })

  const storeLabel = status?.currentStore?.name || "Seller Central"
  const failedCount = requested.filter((id) => rows[id]?.state === "failed").length
  const finished = requested.filter((id) => rows[id]?.state === "done" || rows[id]?.state === "failed").length

  return (
    <section aria-labelledby="workspace-tab-shipments" className="flex min-h-0 flex-1 flex-col" hidden={hidden} id="workspace-panel-shipments" role="tabpanel">
      {phase === "input" ? <>
        <WorkspaceBody>
          <StoreStrip onChange={onChangeStore} onOpenSellerCentral={onOpenSellerCentral} session={session} status={status} />
          <div className="flex shrink-0 flex-col gap-2 px-0.5">
            <label className="text-xs leading-4 font-medium text-muted-foreground" htmlFor="workspace-shipment-ids">Shipment IDs to capture</label>
            <textarea
              ref={inputRef}
              aria-describedby="workspace-shipment-count"
              data-autofocus
              aria-invalid={Boolean(error)}
              aria-label="Shipment IDs"
              className="h-34 w-full resize-none rounded-[0.625rem] border border-input bg-transparent px-3 py-2.5 font-mono text-[0.8125rem] leading-5 text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
              id="workspace-shipment-ids"
              onChange={(event) => { setInput(event.target.value); setError(null) }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
                event.preventDefault()
                void capture()
              }}
              placeholder="Paste shipment IDs, links or text…"
              value={input}
            />
            <p className="sr-only" id="workspace-shipment-count">{plural(ids.length, "unique shipment ID")}</p>
            {ids.length ? (
              <ul aria-label="Detected shipment IDs" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {ids.slice(0, MAX_CHIPS).map((id) => (
                  <li key={id} className="inline-flex h-[1.375rem] items-center rounded-full bg-muted px-2 font-mono text-xs leading-4 text-foreground/80">{id}</li>
                ))}
                {ids.length > MAX_CHIPS ? <li className="inline-flex h-[1.375rem] items-center px-1 text-xs leading-4 text-muted-foreground">+{ids.length - MAX_CHIPS} more</li> : null}
                {duplicates > 0 ? <li className="inline-flex h-[1.375rem] items-center px-1 text-xs leading-4 text-muted-foreground">{plural(duplicates, "duplicate")} ignored</li> : null}
              </ul>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-xs leading-4 text-foreground/70 ring-1 ring-border ring-inset">
            <Camera aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span>Saves a 4K screenshot of each Send to Amazon step and every UPS Proof of Delivery, in one zip. Runs in a background tab; the shipments must belong to {storeLabel}.</span>
          </div>
          {error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null}
        </WorkspaceBody>
        <PanelFooter action end={<PrimaryButton disabled={ids.length === 0} onClick={() => void capture()} type="button">{ids.length ? `Capture ${plural(ids.length, "shipment")}` : "Capture"}</PrimaryButton>}>
          <KeyHint keys={["⇧↵"]}>New line</KeyHint>
        </PanelFooter>
      </> : <>
        <WorkspaceBody className="pt-4">
          <ResultHeader
            aside={phase === "done" ? <HeaderButton onClick={() => setPhase("input")} type="button">New capture</HeaderButton> : undefined}
            meta={phase === "done"
              ? `${storeLabel} · ${plural(shots, "screenshot")} · finished in ${formatDuration(elapsedMs)}`
              : `${storeLabel} · one shipment at a time`}
            percent={phase === "done" ? 100 : Math.round((finished / Math.max(1, requested.length)) * 100)}
            title={phase === "done"
              ? failedCount ? `Captured ${requested.length - failedCount} of ${plural(requested.length, "shipment")}` : `Captured ${plural(requested.length, "shipment")}`
              : `Capturing ${plural(requested.length, "shipment")}…`}
          />
          <div aria-label="Shipments" className="flex flex-col" role="list">
            {requested.map((id) => {
              const row = rows[id] ?? { state: "waiting" }
              return (
                <div key={id} className={cn("flex min-h-13 items-center gap-2.5 rounded-[0.375rem] py-1.5 pr-1 pl-2", row.state === "failed" && "bg-destructive/5")} role="listitem">
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {row.state === "running" ? <Spinner aria-hidden="true" className="size-4 text-foreground/70" role="presentation" />
                      : row.state === "done" ? <CheckBubble />
                      : row.state === "failed" ? <CircleAlert aria-hidden="true" className="size-4 text-destructive" />
                      : <span aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground/40" />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-mono text-[0.8125rem] leading-[1.125rem]">{id}</span>
                    <span className={cn("text-xs leading-4", row.state === "failed" ? "text-destructive" : "text-muted-foreground")}>{rowDetail(row)}</span>
                  </div>
                </div>
              )
            })}
          </div>
          {error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null}
        </WorkspaceBody>
        <PanelFooter
          action
          end={(
            <PrimaryButton autoFocus={phase === "done"} disabled={phase !== "done" || shots === 0} onClick={download} type="button">
              <Download aria-hidden="true" />
              Download ZIP
            </PrimaryButton>
          )}
        >
          {phase === "done"
            ? <span className="truncate font-mono">{shots ? shipmentsZipName(requested, finishedAt) : "Nothing to download"}</span>
            : <KeyHint keys={["esc"]}>Stop</KeyHint>}
        </PanelFooter>
      </>}
    </section>
  )
}
