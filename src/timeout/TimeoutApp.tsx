import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/PageShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createLogger, describeError, errorMessage } from "@/lib/log"
import {
  loadSettings,
  optionsWithCurrent,
  parseSettings,
  saveSettings,
  TIME_OUT_BLOCKERS_OPTIONS,
  TIME_OUT_BUSINESSES,
  TIME_OUT_ISSUE_TYPES,
  TIME_OUT_SCHEDULED_OPTIONS,
  TIME_OUT_STAFF_NAMES,
  TIME_OUT_SUPERVISORS,
  TIME_OUT_WAITING_ON_OPTIONS,
  TIME_OUT_YES_NO_OPTIONS,
  type ExtensionSettings,
  type TimeOutFormValues,
} from "@/lib/settings"

const BLANK_SELECT_VALUE = "__blank__"
const TEXT_SAVE_DEBOUNCE_MS = 350
const PAGE_DESCRIPTION = "These values are prefilled when you run Time Out. Date is always set to today."
const timeoutLog = createLogger("timeout")

function FormSelect({
  allowBlank = false,
  id,
  label,
  options,
  value,
  onChange,
}: {
  allowBlank?: boolean
  id: string
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}) {
  const items = value ? optionsWithCurrent(options, value) : [...options]
  const selectValue = value === "" && allowBlank ? BLANK_SELECT_VALUE : value
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        onValueChange={(next) => onChange(next === BLANK_SELECT_VALUE ? "" : next)}
        value={selectValue}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowBlank ? <SelectItem value={BLANK_SELECT_VALUE}>Leave blank</SelectItem> : null}
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function TimeoutApp() {
  const [settings, setSettings] = React.useState<ExtensionSettings | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const settingsRef = React.useRef(settings)
  const textSaveTimerRef = React.useRef(0)

  React.useEffect(() => {
    void loadSettings().then(
      (loaded) => {
        settingsRef.current = loaded
        setSettings(loaded)
      },
      (caught: unknown) => {
        timeoutLog.error("settings.loadFailed", { error: describeError(caught) })
        setError(errorMessage(caught, "Couldn’t load the form values."))
      },
    )
  }, [])

  const save = React.useCallback((next: ExtensionSettings) => {
    void saveSettings(next).then(
      () => setError(null),
      (caught: unknown) => {
        timeoutLog.error("settings.saveFailed", { error: describeError(caught) })
        setError(errorMessage(caught, "Couldn’t save the form values."))
      },
    )
  }, [])

  React.useEffect(() => () => {
    if (!textSaveTimerRef.current) return
    window.clearTimeout(textSaveTimerRef.current)
    if (settingsRef.current) void saveSettings(settingsRef.current)
  }, [])

  /** Applies a change to the latest values, so a pending text save never overwrites a newer change. */
  const update = React.useCallback((patch: Partial<TimeOutFormValues>): ExtensionSettings | null => {
    const current = settingsRef.current
    if (!current) return null
    const next = parseSettings({ ...current, timeOutForm: { ...current.timeOutForm, ...patch } })
    settingsRef.current = next
    setSettings(next)
    return next
  }, [])

  const persistForm = React.useCallback((patch: Partial<TimeOutFormValues>) => {
    const next = update(patch)
    if (!next) return
    window.clearTimeout(textSaveTimerRef.current)
    textSaveTimerRef.current = 0
    save(next)
  }, [save, update])

  const persistTextField = React.useCallback((patch: Partial<TimeOutFormValues>) => {
    if (!update(patch)) return
    window.clearTimeout(textSaveTimerRef.current)
    textSaveTimerRef.current = window.setTimeout(() => {
      textSaveTimerRef.current = 0
      if (settingsRef.current) save(settingsRef.current)
    }, TEXT_SAVE_DEBOUNCE_MS)
  }, [save, update])

  const errorView = error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null

  if (!settings) {
    return (
      <PageShell description={PAGE_DESCRIPTION} title="Time Out form">
        {errorView ?? <p className="text-sm text-muted-foreground">Loading…</p>}
      </PageShell>
    )
  }

  const form = settings.timeOutForm

  return (
    <PageShell description={PAGE_DESCRIPTION} title="Time Out form">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Prefill values</CardTitle>
          <CardDescription>Changes save automatically.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {errorView}
          <FormSelect
            id="staff-name"
            label="Staff name"
            onChange={(staffName) => persistForm({ staffName })}
            options={TIME_OUT_STAFF_NAMES}
            value={form.staffName}
          />
          <FormSelect
            id="business"
            label="Business"
            onChange={(business) => persistForm({ business })}
            options={TIME_OUT_BUSINESSES}
            value={form.business}
          />
          <FormSelect
            id="supervisor"
            label="Supervisor"
            onChange={(supervisor) => persistForm({ supervisor })}
            options={TIME_OUT_SUPERVISORS}
            value={form.supervisor}
          />
          <div className="grid gap-2">
            <Label htmlFor="hours-worked">Total hours worked</Label>
            <Input
              id="hours-worked"
              inputMode="decimal"
              onChange={(event) => persistTextField({ hoursWorked: event.target.value })}
              type="text"
              value={form.hoursWorked}
            />
          </div>
          <FormSelect
            id="scheduled-accounts"
            label="Scheduled accounts completed today?"
            onChange={(scheduledAccountsCompleted) => persistForm({ scheduledAccountsCompleted })}
            options={TIME_OUT_SCHEDULED_OPTIONS}
            value={form.scheduledAccountsCompleted}
          />
          <div className="grid gap-2">
            <Label htmlFor="short-daily-update">Short Daily Update</Label>
            <Textarea
              id="short-daily-update"
              onChange={(event) => persistTextField({ shortDailyUpdate: event.target.value })}
              value={form.shortDailyUpdate}
            />
          </div>
          <FormSelect
            id="blockers"
            label="Any blockers or red flags today?"
            onChange={(blockersOrRedFlags) => persistForm({ blockersOrRedFlags })}
            options={TIME_OUT_BLOCKERS_OPTIONS}
            value={form.blockersOrRedFlags}
          />
          <div className="grid gap-2">
            <Label htmlFor="client-account-name">Client/account name</Label>
            <Input
              id="client-account-name"
              onChange={(event) => persistTextField({ clientAccountName: event.target.value })}
              type="text"
              value={form.clientAccountName}
            />
          </div>
          <FormSelect
            allowBlank
            id="issue-type"
            label="Issue type"
            onChange={(issueType) => persistForm({ issueType })}
            options={TIME_OUT_ISSUE_TYPES}
            value={form.issueType}
          />
          <FormSelect
            allowBlank
            id="waiting-on-whom"
            label="Waiting on whom?"
            onChange={(waitingOnWhom) => persistForm({ waitingOnWhom })}
            options={TIME_OUT_WAITING_ON_OPTIONS}
            value={form.waitingOnWhom}
          />
          <FormSelect
            id="follow-up-needed"
            label="Follow-up needed?"
            onChange={(followUpNeeded) => persistForm({ followUpNeeded })}
            options={TIME_OUT_YES_NO_OPTIONS}
            value={form.followUpNeeded}
          />
          <FormSelect
            id="escalated-to-supervisor"
            label="Blockers or red flags escalated/advised to supervisor?"
            onChange={(escalatedToSupervisor) => persistForm({ escalatedToSupervisor })}
            options={TIME_OUT_YES_NO_OPTIONS}
            value={form.escalatedToSupervisor}
          />
          <FormSelect
            id="supervisor-review-needed"
            label="Supervisor review needed?"
            onChange={(supervisorReviewNeeded) => persistForm({ supervisorReviewNeeded })}
            options={TIME_OUT_YES_NO_OPTIONS}
            value={form.supervisorReviewNeeded}
          />
          <FormSelect
            id="karen-review-needed"
            label="Karen review/approval needed?"
            onChange={(karenReviewNeeded) => persistForm({ karenReviewNeeded })}
            options={TIME_OUT_YES_NO_OPTIONS}
            value={form.karenReviewNeeded}
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
