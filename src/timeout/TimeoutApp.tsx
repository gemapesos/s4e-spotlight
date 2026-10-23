import * as React from "react"

import { CheckIcon } from "lucide-react"

import { Notice, PageShell, Surface, SurfaceHeader } from "@/components/panel"
import { Input } from "@/components/ui/input"
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
const PAGE_DESCRIPTION = "Prefilled when you run Time Out. Date is always today, and changes save as you go."
const timeoutLog = createLogger("timeout")

/** A label on the left and its control on the right, like a settings row. */
function FieldRow({ children, htmlFor, label }: { children: React.ReactNode; htmlFor: string; label: string }) {
  return (
    <div className="flex min-h-13 flex-col items-stretch justify-between gap-2 border-t border-border/60 px-4 py-2.5 first:border-t-0 sm:flex-row sm:items-center sm:gap-4 sm:py-2">
      <label className="text-foreground/80" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

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
    <FieldRow htmlFor={id} label={label}>
      <Select
        onValueChange={(next) => onChange(next === BLANK_SELECT_VALUE ? "" : next)}
        value={selectValue}
      >
        <SelectTrigger
          className="h-8! w-full shrink-0 rounded-[0.5rem] data-[value=__blank__]:text-muted-foreground sm:w-64"
          data-value={selectValue}
          id={id}
        >
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
    </FieldRow>
  )
}

export function TimeoutApp() {
  const [settings, setSettings] = React.useState<ExtensionSettings | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
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
    setSaving(true)
    void saveSettings(next).then(
      () => setError(null),
      (caught: unknown) => {
        timeoutLog.error("settings.saveFailed", { error: describeError(caught) })
        setError(errorMessage(caught, "Couldn’t save the form values."))
      },
    ).finally(() => setSaving(Boolean(textSaveTimerRef.current)))
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
    setSaving(true)
    window.clearTimeout(textSaveTimerRef.current)
    textSaveTimerRef.current = window.setTimeout(() => {
      textSaveTimerRef.current = 0
      if (settingsRef.current) save(settingsRef.current)
    }, TEXT_SAVE_DEBOUNCE_MS)
  }, [save, update])

  const errorView = error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null
  const status = !settings || error ? undefined : saving ? "Saving…" : (
    <>
      <CheckIcon aria-hidden="true" className="size-3.5" />
      Saved
    </>
  )

  if (!settings) {
    return (
      <PageShell description={PAGE_DESCRIPTION} title="Time Out form">
        {errorView ?? <p className="m-0 px-1 text-muted-foreground">Loading…</p>}
      </PageShell>
    )
  }

  const form = settings.timeOutForm
  const textInput = "h-8 w-full shrink-0 rounded-[0.5rem] sm:w-64"

  return (
    <PageShell description={PAGE_DESCRIPTION} status={<span aria-live="polite" className="inline-flex items-center gap-1.5">{status}</span>} title="Time Out form">
      {errorView}
      <Surface aria-labelledby="you-heading">
        <SurfaceHeader id="you-heading" title="You" />
        <div>
          <FormSelect id="staff-name" label="Staff name" onChange={(staffName) => persistForm({ staffName })} options={TIME_OUT_STAFF_NAMES} value={form.staffName} />
          <FormSelect id="business" label="Business" onChange={(business) => persistForm({ business })} options={TIME_OUT_BUSINESSES} value={form.business} />
          <FormSelect id="supervisor" label="Supervisor" onChange={(supervisor) => persistForm({ supervisor })} options={TIME_OUT_SUPERVISORS} value={form.supervisor} />
        </div>
      </Surface>

      <Surface aria-labelledby="today-heading">
        <SurfaceHeader id="today-heading" title="Today" />
        <div>
          <FieldRow htmlFor="hours-worked" label="Total hours worked">
            <Input
              className="h-8 w-24 shrink-0 rounded-[0.5rem] text-right"
              id="hours-worked"
              inputMode="decimal"
              onChange={(event) => persistTextField({ hoursWorked: event.target.value })}
              type="text"
              value={form.hoursWorked}
            />
          </FieldRow>
          <FormSelect
            id="scheduled-accounts"
            label="Scheduled accounts completed today?"
            onChange={(scheduledAccountsCompleted) => persistForm({ scheduledAccountsCompleted })}
            options={TIME_OUT_SCHEDULED_OPTIONS}
            value={form.scheduledAccountsCompleted}
          />
          <div className="flex flex-col gap-2 border-t border-border/60 px-4 pt-3.5 pb-4">
            <label className="text-foreground/80" htmlFor="short-daily-update">Short Daily Update</label>
            <Textarea
              className="min-h-22 rounded-[0.5rem]"
              id="short-daily-update"
              onChange={(event) => persistTextField({ shortDailyUpdate: event.target.value })}
              value={form.shortDailyUpdate}
            />
          </div>
        </div>
      </Surface>

      <Surface aria-labelledby="blockers-heading">
        <SurfaceHeader id="blockers-heading" title="Blockers and follow-up" />
        <div>
          <FormSelect id="blockers" label="Any blockers or red flags today?" onChange={(blockersOrRedFlags) => persistForm({ blockersOrRedFlags })} options={TIME_OUT_BLOCKERS_OPTIONS} value={form.blockersOrRedFlags} />
          <FieldRow htmlFor="client-account-name" label="Client/account name">
            <Input
              className={textInput}
              id="client-account-name"
              onChange={(event) => persistTextField({ clientAccountName: event.target.value })}
              placeholder="Leave blank if none"
              type="text"
              value={form.clientAccountName}
            />
          </FieldRow>
          <FormSelect allowBlank id="issue-type" label="Issue type" onChange={(issueType) => persistForm({ issueType })} options={TIME_OUT_ISSUE_TYPES} value={form.issueType} />
          <FormSelect allowBlank id="waiting-on-whom" label="Waiting on whom?" onChange={(waitingOnWhom) => persistForm({ waitingOnWhom })} options={TIME_OUT_WAITING_ON_OPTIONS} value={form.waitingOnWhom} />
          <FormSelect id="follow-up-needed" label="Follow-up needed?" onChange={(followUpNeeded) => persistForm({ followUpNeeded })} options={TIME_OUT_YES_NO_OPTIONS} value={form.followUpNeeded} />
          <FormSelect id="escalated-to-supervisor" label="Blockers or red flags escalated/advised to supervisor?" onChange={(escalatedToSupervisor) => persistForm({ escalatedToSupervisor })} options={TIME_OUT_YES_NO_OPTIONS} value={form.escalatedToSupervisor} />
          <FormSelect id="supervisor-review-needed" label="Supervisor review needed?" onChange={(supervisorReviewNeeded) => persistForm({ supervisorReviewNeeded })} options={TIME_OUT_YES_NO_OPTIONS} value={form.supervisorReviewNeeded} />
          <FormSelect id="karen-review-needed" label="Karen review/approval needed?" onChange={(karenReviewNeeded) => persistForm({ karenReviewNeeded })} options={TIME_OUT_YES_NO_OPTIONS} value={form.karenReviewNeeded} />
        </div>
      </Surface>
    </PageShell>
  )
}
