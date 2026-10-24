import * as React from "react"

import { CommandPalette } from "@/CommandPalette"
import { HeaderButton, Notice, PageShell, PrimaryButton, Surface, SurfaceHeader } from "@/components/panel"
import { isReportProgressMessage, type ReportSource } from "@/lib/reportProgress"
import { api } from "@/options/api"
import {
  cancelAccountSwitch, dispatchReportProgress, focusAccountSwitch, focusCurrentStore,
  generateReports, getAccountsStatus, manageAccounts, openCaseIds, openRemovalOrderIds,
  openShipmentIds, openSkuIds, openTimeOut, prepareReports, scrapeProtectedCaseIds,
  startAccountSwitch, unlockAccounts,
} from "@/paletteApp"

interface Launch { mode: "reports" | "cases"; caseIds: string[] }

/** This document is packaged, is not web-accessible, and owns every result and download. */
export function ResultsApp() {
  const [launch, setLaunch] = React.useState<Launch | null>(null)
  const [error, setError] = React.useState("")
  const [open, setOpen] = React.useState(true)
  const [generation, setGeneration] = React.useState(0)
  const runId = React.useRef<string | undefined>(undefined)
  const epoch = React.useRef(0)

  const cancel = React.useCallback(async () => {
    epoch.current += 1
    const id = runId.current
    runId.current = undefined
    if (id) await api({ type: "RESULTS_CANCEL", runId: id }).catch(() => undefined)
  }, [])

  React.useEffect(() => {
    let alive = true
    const launchId = new URLSearchParams(window.location.search).get("launch")
    void api<Launch>({ type: "RESULTS_INIT", launchId }).then(
      (value) => { if (alive) setLaunch(value) },
      () => { if (alive) setError("Couldn’t open Results. Open it again from the palette.") },
    )
    const onProgress = (message: unknown, sender: chrome.runtime.MessageSender, respond: (value: unknown) => void) => {
      if (sender.id !== chrome.runtime.id || sender.tab || (sender.url && sender.url !== chrome.runtime.getURL("background.js"))) return
      if (message && typeof message === "object" && "type" in message && message.type === "ACCOUNTS_RESUME_CHECK") { respond({ ok: true }); return }
      if (!isReportProgressMessage(message) || (message as { runId?: unknown }).runId !== runId.current) return
      dispatchReportProgress(message)
    }
    chrome.runtime.onMessage?.addListener(onProgress)
    const onLeave = () => { void cancel() }
    window.addEventListener("pagehide", onLeave)
    return () => {
      alive = false
      chrome.runtime.onMessage?.removeListener(onProgress)
      window.removeEventListener("pagehide", onLeave)
      void cancel()
    }
  }, [cancel])

  const prepare = async (sections?: readonly ReportSource[]) => {
    const current = epoch.current
    const prepared = await prepareReports(sections)
    if (!prepared.loggedInToStore) return prepared
    if (!prepared.runId) throw new Error("Couldn’t start this report. Please try again.")
    if (current !== epoch.current) {
      await api({ type: "RESULTS_CANCEL", runId: prepared.runId })
      throw new Error("Report cancelled.")
    }
    runId.current = prepared.runId
    return prepared
  }

  const finish = async (id: string) => {
    if (runId.current === id) runId.current = undefined
    await api({ type: "RESULTS_FINISH", runId: id }).catch(() => undefined)
  }

  const scrape = async (caseIds: string[]) => {
    const current = epoch.current
    const prepared = await api<{ runId: string }>({ type: "REPORTS_PREPARE", mode: "cases", caseIds })
    if (current !== epoch.current) {
      await api({ type: "RESULTS_CANCEL", runId: prepared.runId })
      return
    }
    runId.current = prepared.runId
    try { await scrapeProtectedCaseIds(caseIds, prepared.runId) }
    finally { await finish(prepared.runId) }
  }

  const setPanelOpen = (next: boolean) => {
    setOpen(next)
    if (!next) void cancel()
  }

  return (
    <PageShell title={launch?.mode === "cases" ? "Case results" : "Reports"} description="Generate and download results from your signed-in Seller Central store.">
      {error ? <Notice error message={error} onDismiss={() => setError("")} /> : null}
      <Surface>
        <SurfaceHeader title={launch?.mode === "cases" ? "Scrape cases" : "Generate reports"} />
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <HeaderButton onClick={() => void api({ type: "RESULTS_OPEN_SELLER" }).catch(() => setError("Couldn’t open Seller Central."))}>Open Seller Central</HeaderButton>
          <PrimaryButton disabled={!launch} onClick={() => { setGeneration((value) => value + 1); setOpen(true) }}>Start {launch?.mode === "cases" ? "case scrape" : "report"}</PrimaryButton>
        </div>
      </Surface>
      {launch ? <CommandPalette
        key={generation}
        container={document.body}
        open={open}
        initialMode={launch.mode === "cases" ? "scrape-case" : "report-options"}
        initialIdentifierInput={launch.caseIds.join("\n")}
        protectedResults
        onOpenChange={setPanelOpen}
        onOpenCaseIds={openCaseIds}
        onScrapeCases={scrape}
        onOpenShipmentIds={openShipmentIds}
        onOpenRemovalOrderIds={openRemovalOrderIds}
        onOpenSkuIds={openSkuIds}
        onGetAccountsStatus={getAccountsStatus}
        onUnlockAccounts={unlockAccounts}
        onStartAccountSwitch={startAccountSwitch}
        onFocusCurrentStore={focusCurrentStore}
        onFocusAccountSwitch={focusAccountSwitch}
        onCancelAccountSwitch={cancelAccountSwitch}
        onManageAccounts={manageAccounts}
        onPrepareReports={prepare}
        onCancelReports={cancel}
        onGenerateReports={async (storeName, onProgress, sections) => {
          const id = runId.current
          if (!id) throw new Error("Start this report again.")
          try { return await generateReports(new Date(), storeName, onProgress, sections, id) }
          finally { await finish(id) }
        }}
        onOpenTimeOut={openTimeOut}
      /> : null}
    </PageShell>
  )
}
