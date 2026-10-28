import * as React from "react"
import { CircleAlert, Download, ExternalLink, FileJson } from "lucide-react"

import { HeaderButton, KeyHint, Notice, PanelFooter, PrimaryButton } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { extractCaseIds, findCaseIds } from "@/shared/identifiers"
import { errorMessage } from "@/shared/log"
import type { SellerCentralSessionState } from "@/sellerCentral/session"
import { cn } from "@/lib/utils"
import { caseScrapeFileName, casePageUrl, downloadCaseScrape, type ScrapeCasesFile, type ScrapedCase } from "@/sellerCentral/viewCase"
import {
  formatDuration,
  plural,
  ResultHeader,
  StoreStrip,
  useTabKeys,
  WorkspaceBody,
  type WorkspaceLaunch,
  type WorkspaceRuns,
} from "@/pages/workspace/workspaceParts"
import { CheckBubble } from "@/components/switch/SwitchProgress"
import { MAX_BULK_IDS, sendToBackground, type AccountsStatus } from "@/shared/messages"

type Phase = "input" | "running" | "done"

const MAX_CHIPS = 12
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-10-05T19:21:54.913+08:00" as "5 Oct 2026", read from the date itself so no time zone shifts it. */
function openedOn(scraped: ScrapedCase): string | undefined {
  const iso = scraped.viewCaseMetaData.creationDateIso
  const match = typeof iso === "string" ? /^(\d{4})-(\d{2})-(\d{2})/u.exec(iso) : null
  if (!match) return undefined
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`
}

function replyCount(scraped: ScrapedCase): number {
  return Number.isFinite(scraped.totalNumberOfContacts) ? scraped.totalNumberOfContacts : scraped.contacts.length
}

/** Opens a case in the user's own browser window, not in this popup window. */
async function openCase(caseId: string): Promise<void> {
  const target = await chrome.windows.getLastFocused({ windowTypes: ["normal"] }).catch(() => undefined)
  await chrome.tabs.create({ url: casePageUrl(caseId), ...(target?.id === undefined ? {} : { windowId: target.id }) })
  if (target?.id !== undefined) await chrome.windows.update(target.id, { focused: true })
}

export function CasesTab({
  hidden,
  launch,
  onChangeStore,
  onOpenSellerCentral,
  runs,
  session,
  status,
}: {
  hidden: boolean
  launch: WorkspaceLaunch | null
  onChangeStore?: () => void
  onOpenSellerCentral: () => void
  runs: React.RefObject<WorkspaceRuns>
  session: SellerCentralSessionState
  status: AccountsStatus | null
}) {
  const [input, setInput] = React.useState(() => launch?.mode === "cases" ? launch.caseIds.join("\n") : "")
  const [phase, setPhase] = React.useState<Phase>("input")
  const [requested, setRequested] = React.useState<string[]>([])
  const [file, setFile] = React.useState<ScrapeCasesFile | null>(null)
  const [finishedAt, setFinishedAt] = React.useState(() => new Date())
  const [elapsedMs, setElapsedMs] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const token = React.useRef(0)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const ids = React.useMemo(() => extractCaseIds(input), [input])
  const duplicates = React.useMemo(() => findCaseIds(input).length - ids.length, [ids.length, input])

  // Case IDs chosen in the palette arrive with each launch; a running scrape keeps its own.
  const appliedLaunch = React.useRef(launch?.serial)
  const launchSerial = launch?.serial
  React.useEffect(() => {
    if (!launch || launch.serial === appliedLaunch.current) return
    appliedLaunch.current = launch.serial
    if (launch.mode !== "cases" || launch.caseIds.length === 0 || phase === "running") return
    setInput(launch.caseIds.join("\n"))
    setPhase("input")
    setError(null)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [launchSerial])

  const scrape = async () => {
    if (phase === "running") return
    const caseIds = extractCaseIds(input)
    if (caseIds.length === 0) return setError("Enter at least one 11-digit Case ID.")
    if (caseIds.length > MAX_BULK_IDS) return setError(`Scrape no more than ${MAX_BULK_IDS} cases at a time.`)
    const run = ++token.current
    const startedAt = Date.now()
    setRequested(caseIds)
    setFile(null)
    setError(null)
    setPhase("running")
    let runId: string | undefined
    try {
      const prepared = await sendToBackground({ type: "REPORTS_PREPARE", mode: "cases", caseIds })
      runId = prepared.runId
      if (run !== token.current) return
      if (!runId) throw new Error("Couldn’t start this scrape. Please try again.")
      runs.current.cases = runId
      const response = await sendToBackground({ type: "SCRAPE_CASES", runId })
      if (run !== token.current) return
      if (!response.file || !Array.isArray(response.file.cases)) throw new Error("Couldn’t scrape cases. Please try again.")
      setFile(response.file)
      setFinishedAt(new Date())
      setElapsedMs(Date.now() - startedAt)
      setPhase("done")
    } catch (caught) {
      if (run !== token.current) return
      setError(errorMessage(caught, "Couldn’t scrape cases. Please try again."))
      setPhase("input")
    } finally {
      if (runId) {
        if (runs.current.cases === runId) runs.current.cases = undefined
        await sendToBackground({ type: run === token.current ? "RESULTS_FINISH" : "RESULTS_CANCEL", runId }).catch(() => undefined)
      }
    }
  }

  const stop = () => {
    token.current += 1
    const runId = runs.current.cases
    runs.current.cases = undefined
    if (runId) void sendToBackground({ type: "RESULTS_CANCEL", runId }).catch(() => undefined)
    setPhase("input")
  }

  const download = () => {
    if (!file) return
    try {
      downloadCaseScrape(file, requested, document, finishedAt)
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
  const scraped = new Map((file?.cases ?? []).map((item) => [item.caseId, item]))
  const failures = new Map((file?.errors ?? []).map((item) => [item.caseId, item.error]))
  const replies = (file?.cases ?? []).reduce((sum, item) => sum + replyCount(item), 0)
  const failedCount = requested.filter((id) => !scraped.has(id)).length
  const submitLabel = ids.length ? `Scrape ${plural(ids.length, "case")}` : "Scrape"

  return (
    <section aria-labelledby="workspace-tab-cases" className="flex min-h-0 flex-1 flex-col" hidden={hidden} id="workspace-panel-cases" role="tabpanel">
      {phase === "input" ? <>
        <WorkspaceBody>
          <StoreStrip onChange={onChangeStore} onOpenSellerCentral={onOpenSellerCentral} session={session} status={status} />
          <div className="flex shrink-0 flex-col gap-2 px-0.5">
            <label className="text-xs leading-4 font-medium text-muted-foreground" htmlFor="workspace-case-ids">Case IDs to scrape</label>
            <textarea
              ref={inputRef}
              aria-describedby="workspace-case-count"
              data-autofocus
              aria-invalid={Boolean(error)}
              aria-label="Case IDs"
              className="h-34 w-full resize-none rounded-[0.625rem] border border-input bg-transparent px-3 py-2.5 font-mono text-[0.8125rem] leading-5 text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
              id="workspace-case-ids"
              onChange={(event) => { setInput(event.target.value); setError(null) }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
                event.preventDefault()
                void scrape()
              }}
              placeholder="Paste case IDs, links or text…"
              value={input}
            />
            <p className="sr-only" id="workspace-case-count">{plural(ids.length, "unique case ID")}</p>
            {ids.length ? (
              <ul aria-label="Detected case IDs" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {ids.slice(0, MAX_CHIPS).map((id) => (
                  <li key={id} className="inline-flex h-[1.375rem] animate-in items-center rounded-full bg-muted px-2 font-mono text-xs leading-4 text-foreground/80 duration-150 fade-in-0 zoom-in-90 motion-reduce:animate-none">{id}</li>
                ))}
                {ids.length > MAX_CHIPS ? <li className="inline-flex h-[1.375rem] items-center px-1 text-xs leading-4 text-muted-foreground">+{ids.length - MAX_CHIPS} more</li> : null}
                {duplicates > 0 ? <li className="inline-flex h-[1.375rem] items-center px-1 text-xs leading-4 text-muted-foreground">{plural(duplicates, "duplicate")} ignored</li> : null}
              </ul>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-xs leading-4 text-foreground/70 ring-1 ring-border ring-inset">
            <FileJson aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span>Saves one JSON file with each case’s details and every reply, timestamped in your time zone. Up to {MAX_BULK_IDS} cases at a time.</span>
          </div>
          {error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null}
        </WorkspaceBody>
        <PanelFooter action end={<PrimaryButton disabled={ids.length === 0} onClick={() => void scrape()} type="button">{submitLabel}</PrimaryButton>}>
          <KeyHint keys={["⇧↵"]}>New line</KeyHint>
        </PanelFooter>
      </> : <>
        <WorkspaceBody className="pt-4">
          <ResultHeader
            aside={phase === "done" ? <HeaderButton onClick={() => setPhase("input")} type="button">New scrape</HeaderButton> : undefined}
            meta={phase === "done"
              ? `${storeLabel} · ${plural(replies, "reply", "replies")} · finished in ${formatDuration(elapsedMs)}`
              : `${storeLabel} · every reply, page by page`}
            percent={phase === "done" ? 100 : null}
            title={phase === "done"
              ? failedCount ? `Scraped ${requested.length - failedCount} of ${plural(requested.length, "case")}` : `Scraped ${plural(requested.length, "case")}`
              : `Scraping ${plural(requested.length, "case")}…`}
          />
          <div aria-label="Cases" className="flex flex-col" role="list">
            {requested.map((id) => {
              const item = scraped.get(id)
              const failed = phase === "done" && !item
              const opened = item ? openedOn(item) : undefined
              return (
                <div
                  key={id}
                  className={cn("flex min-h-13 items-center gap-2.5 rounded-[0.375rem] py-1.5 pr-1 pl-2", failed && "bg-destructive/5")}
                  role="listitem"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {phase === "running"
                      ? <Spinner aria-hidden="true" className="size-4 text-foreground/70" role="presentation" />
                      : item ? <CheckBubble /> : <CircleAlert aria-hidden="true" className="size-4 text-destructive" />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-mono text-[0.8125rem] leading-[1.125rem]">{id}</span>
                    <span className={cn("truncate text-xs leading-4", failed ? "text-destructive" : "text-muted-foreground")}>
                      {phase === "running"
                        ? "Loading…"
                        : item
                          ? `${plural(replyCount(item), "reply", "replies")}${opened ? ` · opened ${opened}` : ""}`
                          : failures.get(id) ?? "Couldn’t scrape this case."}
                    </span>
                  </div>
                  <Button
                    aria-label={`Open case ${id} in Seller Central`}
                    className="size-7 rounded-[0.375rem] text-muted-foreground hover:text-foreground"
                    onClick={() => void openCase(id).catch(() => setError("Couldn’t open this case."))}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
          {phase === "done" && failedCount ? (
            <p className="m-0 px-2 text-xs leading-4 text-muted-foreground">
              {scraped.size
                ? `The file lists the ${failedCount === 1 ? "case that failed" : "cases that failed"}, so you can scrape ${failedCount === 1 ? "it" : "them"} again later.`
                : "Nothing was scraped. Check that Seller Central is signed in to the right store, then try again."}
            </p>
          ) : null}
          {error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null}
        </WorkspaceBody>
        <PanelFooter
          action
          end={phase === "done" && scraped.size === 0
            ? <PrimaryButton autoFocus onClick={() => void scrape()} type="button">Try again</PrimaryButton>
            : (
              <PrimaryButton autoFocus={phase === "done"} disabled={phase !== "done"} onClick={download} type="button">
                <Download aria-hidden="true" />
                Download JSON
              </PrimaryButton>
            )}
        >
          {phase === "done"
            ? <span className="truncate font-mono">{scraped.size ? caseScrapeFileName(requested, finishedAt) : "Nothing to download"}</span>
            : <KeyHint keys={["esc"]}>Stop</KeyHint>}
        </PanelFooter>
      </>}
    </section>
  )
}
