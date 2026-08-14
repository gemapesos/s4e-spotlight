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
        <SelectTrigger id={id}>
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
  const settingsRef = React.useRef(settings)
  settingsRef.current = settings
  const textSaveTimerRef = React.useRef(0)

  React.useEffect(() => {
    void loadSettings().then(setSettings)
  }, [])

  React.useEffect(() => () => {
    if (!textSaveTimerRef.current) return
    window.clearTimeout(textSaveTimerRef.current)
    if (settingsRef.current) void saveSettings(settingsRef.current)
  }, [])

  const persistForm = React.useCallback(
    async (patch: Partial<TimeOutFormValues>) => {
      if (!settings) return
      const next = parseSettings({
        ...settings,
        timeOutForm: { ...settings.timeOutForm, ...patch },
      })
      setSettings(next)
      await saveSettings(next)
    },
    [settings],
  )

  const persistTextField = React.useCallback((patch: Partial<TimeOutFormValues>) => {
    const current = settingsRef.current
    if (!current) return
    const next = parseSettings({
      ...current,
      timeOutForm: { ...current.timeOutForm, ...patch },
    })
    setSettings(next)
    window.clearTimeout(textSaveTimerRef.current)
    textSaveTimerRef.current = window.setTimeout(() => {
      textSaveTimerRef.current = 0
      void saveSettings(next)
    }, TEXT_SAVE_DEBOUNCE_MS)
  }, [])

  if (!settings) {
    return (
      <PageShell
        description="These values are prefilled when you run Time Out. Date is always set to today."
        title="Time Out form"
      >
        <p className="text-sm text-muted-foreground">Loading…</p>
      </PageShell>
    )
  }

  const form = settings.timeOutForm

  return (
    <PageShell
      description="These values are prefilled when you run Time Out. Date is always set to today."
      title="Time Out form"
    >
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Prefill values</CardTitle>
          <CardDescription>Changes save automatically.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormSelect
            id="staff-name"
            label="Staff name"
            onChange={(staffName) => void persistForm({ staffName })}
            options={TIME_OUT_STAFF_NAMES}
            value={form.staffName}
          />
          <FormSelect
            id="business"
            label="Business"
            onChange={(business) => void persistForm({ business })}
            options={TIME_OUT_BUSINESSES}
            value={form.business}
          />
          <FormSelect
            id="supervisor"
            label="Supervisor"
            onChange={(supervisor) => void persistForm({ supervisor })}
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
            onChange={(scheduledAccountsCompleted) => void persistForm({ scheduledAccountsCompleted })}
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
            onChange={(blockersOrRedFlags) => void persistForm({ blockersOrRedFlags })}
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
            onChange={(issueType) => void persistForm({ issueType })}
            options={TIME_OUT_ISSUE_TYPES}
            value={form.issueType}
          />
          <FormSelect
            allowBlank
            id="waiting-on-whom"
            label="Waiting on whom?"
            onChange={(waitingOnWhom) => void persistForm({ waitingOnWhom })}
            options={TIME_OUT_WAITING_ON_OPTIONS}
            value={form.waitingOnWhom}
          />
          <FormSelect
            id="follow-up-needed"
            label="Follow-up needed?"
            onChange={(followUpNeeded) => void persistForm({ followUpNeeded })}
            options={TIME_OUT_YES_NO_OPTIONS}
            value={form.followUpNeeded}
          />
          <FormSelect
            id="escalated-to-supervisor"
            label="Blockers or red flags escalated/advised to supervisor?"
            onChange={(escalatedToSupervisor) => void persistForm({ escalatedToSupervisor })}
            options={TIME_OUT_YES_NO_OPTIONS}
            value={form.escalatedToSupervisor}
          />
          <FormSelect
            id="supervisor-review-needed"
            label="Supervisor review needed?"
            onChange={(supervisorReviewNeeded) => void persistForm({ supervisorReviewNeeded })}
            options={TIME_OUT_YES_NO_OPTIONS}
            value={form.supervisorReviewNeeded}
          />
          <FormSelect
            id="karen-review-needed"
            label="Karen review/approval needed?"
            onChange={(karenReviewNeeded) => void persistForm({ karenReviewNeeded })}
            options={TIME_OUT_YES_NO_OPTIONS}
            value={form.karenReviewNeeded}
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
