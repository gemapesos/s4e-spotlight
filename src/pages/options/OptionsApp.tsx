import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  CancelButton,
  Field,
  Notice,
  PageShell,
  PanelDialogContent,
  PanelFooter,
  PrimaryButton,
  StatusDot,
} from "@/components/panel"
import { Button } from "@/components/ui/button"
import { Dialog, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SESSION_KEY_STORAGE_KEY, VAULT_STORAGE_KEY, SHARE_FILE_NAME, type AccountVault, type CredentialRecord, type StoreRecord, type VaultMergeCounts } from "@/shared/accounts"
import { errorMessage } from "@/shared/log"
import { cn } from "@/lib/utils"
import { saveJsonFile } from "@/shared/download"
import { sendToBackground } from "@/shared/messages"
import { CreateVaultSection, FIELD_INPUT, LockedVaultSection, VaultEditor } from "./sections"

type Page = "loading" | "create" | "locked" | "editor"
type DeleteTarget = { kind: "store" | "credential"; id: string; name: string }
type Notice = { message: string; error: boolean }

const RESET_CONFIRMATION = "RESET"

function formatCount(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`
}

function formatChange(credentials: number, stores: number): string | undefined {
  const parts = [
    credentials ? formatCount(credentials, "credential") : "",
    stores ? formatCount(stores, "store") : "",
  ].filter(Boolean)
  return parts.length ? parts.join(" and ") : undefined
}

function importSummary(added: VaultMergeCounts, updated: VaultMergeCounts): string {
  const addedText = formatChange(added.credentials, added.stores)
  const updatedText = formatChange(updated.credentials, updated.stores)
  const parts = [
    addedText ? `Added ${addedText}` : "",
    updatedText ? `Updated ${updatedText}` : "",
  ].filter(Boolean)
  return parts.length ? `${parts.join(". ")}.` : "Shared vault imported. No accounts changed."
}

async function readShareFile(file: File): Promise<unknown> {
  try {
    const parsed = JSON.parse(await file.text()) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("This file is not a shared vault.")
    return parsed
  } catch (error) {
    if (error instanceof Error && error.message === "This file is not a shared vault.") throw error
    throw new Error("This file is not a shared vault.")
  }
}

/** A confirmation in the panel anatomy, for deleting and resetting. */
function ConfirmDialogContent({
  children,
  confirm,
  description,
  title,
}: {
  children?: React.ReactNode
  confirm: React.ReactNode
  description: React.ReactNode
  title: string
}) {
  return (
    <AlertDialogContent className="gap-0 overflow-hidden p-0 shadow-[0_1.5rem_3rem_-1rem_rgb(0_0_0/0.22)] data-[size=default]:sm:max-w-[26rem]">
      <div className="flex h-11 items-center px-4">
        <AlertDialogTitle className="text-sm leading-5 font-medium">{title}</AlertDialogTitle>
      </div>
      <div aria-hidden="true" className="h-px bg-border" />
      <div className="flex flex-col gap-4 p-4">
        <AlertDialogDescription className="text-left">{description}</AlertDialogDescription>
        {children}
      </div>
      <PanelFooter action end={<>
        <AlertDialogPrimitive.Cancel asChild>
          <CancelButton type="button" />
        </AlertDialogPrimitive.Cancel>
        {confirm}
      </>} />
    </AlertDialogContent>
  )
}

/** A destructive confirm: tinted, never a solid red block. */
function DestructiveButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button className={cn("rounded-[0.5rem] px-3", className)} variant="destructive" {...props} />
}

export function OptionsApp() {
  const stateVersion = React.useRef(0)
  const [page, setPage] = React.useState<Page>("loading")
  const [busy, setBusy] = React.useState(false)
  const [vault, setVault] = React.useState<AccountVault | null>(null)
  const [notice, setNotice] = React.useState<Notice | null>(null)
  const [credentialOpen, setCredentialOpen] = React.useState(false)
  const [editingCredential, setEditingCredential] = React.useState<CredentialRecord | null>(null)
  const [storeOpen, setStoreOpen] = React.useState(false)
  const [editingStore, setEditingStore] = React.useState<StoreRecord | null>(null)
  const [passwordOpen, setPasswordOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [exportFormKey, setExportFormKey] = React.useState(0)
  const [importFormKey, setImportFormKey] = React.useState(0)
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null)
  const [resetOpen, setResetOpen] = React.useState(false)
  const [resetConfirmation, setResetConfirmation] = React.useState("")
  const [storeCredentialId, setStoreCredentialId] = React.useState("")
  const credentialsById = React.useMemo(
    () => new Map((vault?.credentials ?? []).map((item) => [item.id, item])),
    [vault],
  )

  const showNotice = React.useCallback((message = "", error = false) => {
    setNotice(message ? { message, error } : null)
  }, [])

  /**
   * Runs one vault action at a time (key derivation is slow enough to invite double submits)
   * and resolves whether it succeeded.
   */
  const runBusy = React.useCallback(async <T,>(action: () => Promise<T>, failure: string): Promise<T | undefined> => {
    const version = stateVersion.current
    setBusy(true)
    try {
      const result = await action()
      return version === stateVersion.current ? result : undefined
    } catch (error) {
      showNotice(errorMessage(error, failure), true)
      return undefined
    } finally {
      setBusy(false)
    }
  }, [showNotice])

  React.useEffect(() => {
    if (!notice || notice.error) return
    const timer = window.setTimeout(() => setNotice(null), 5_000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const load = React.useCallback(async () => {
    const version = ++stateVersion.current
    showNotice()
    setBusy(true)
    try {
      const status = await sendToBackground({ type: "ACCOUNTS_STATUS" })
      if (version !== stateVersion.current) return
      if (!status.initialized) {
        setVault(null)
        setPage("create")
      } else if (!status.unlocked) {
        setVault(null)
        setPage("locked")
      } else {
        const response = await sendToBackground({ type: "ACCOUNTS_GET_VAULT" })
        if (version !== stateVersion.current) return
        setVault(response.vault)
        setPage("editor")
      }
    } catch (error) {
      if (version === stateVersion.current) showNotice(errorMessage(error, "Could not load accounts."), true)
    } finally {
      if (version === stateVersion.current) setBusy(false)
    }
  }, [showNotice])

  React.useEffect(() => {
    void load()
    const invalidate = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (!(area === "session" && SESSION_KEY_STORAGE_KEY in changes) && !(area === "local" && VAULT_STORAGE_KEY in changes)) return
      stateVersion.current += 1
      setVault(null)
      setEditingCredential(null)
      setEditingStore(null)
      setCredentialOpen(false)
      setStoreOpen(false)
      setPasswordOpen(false)
      setExportOpen(false)
      setImportOpen(false)
      setDeleteTarget(null)
      setResetOpen(false)
      setResetConfirmation("")
      setExportFormKey((key) => key + 1)
      setImportFormKey((key) => key + 1)
      setPage("loading")
      void load()
    }
    chrome.storage?.onChanged?.addListener(invalidate)
    return () => {
      stateVersion.current += 1
      chrome.storage?.onChanged?.removeListener(invalidate)
    }
  }, [load])

  const save = React.useCallback(async (next: AccountVault, success: string) => {
    const version = stateVersion.current
    setBusy(true)
    try {
      await sendToBackground({ type: "ACCOUNTS_SAVE_VAULT", vault: next })
      if (version !== stateVersion.current) return
      setVault(next)
      setPage("editor")
      setCredentialOpen(false)
      setStoreOpen(false)
      setDeleteTarget(null)
      showNotice(success)
    } catch (error) {
      showNotice(errorMessage(error, "Could not save the vault."), true)
    } finally {
      setBusy(false)
    }
  }, [showNotice])

  const openCredential = (record?: CredentialRecord) => {
    setEditingCredential(record ?? null)
    setCredentialOpen(true)
  }

  const openStore = (record?: StoreRecord) => {
    setEditingStore(record ?? null)
    setStoreCredentialId(record?.credentialId ?? vault?.credentials[0]?.id ?? "")
    setStoreOpen(true)
  }

  const requestDelete = (kind: "store" | "credential", id: string, name: string) => {
    if (kind === "credential" && vault?.stores.some(({ credentialId }) => credentialId === id)) {
      showNotice("Delete or reassign stores using this credential first.", true)
      return
    }
    setDeleteTarget({ kind, id, name })
  }

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    if (password !== String(form.get("confirm") ?? "")) return showNotice("Master passwords do not match.", true)
    if (await runBusy(() => sendToBackground({ type: "ACCOUNTS_CREATE", masterPassword: password }), "Could not create the vault.")) {
      await load()
    }
  }

  async function onUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const password = String(new FormData(event.currentTarget).get("password") ?? "")
    if (await runBusy(() => sendToBackground({ type: "ACCOUNTS_UNLOCK", masterPassword: password }), "Could not unlock accounts.")) {
      await load()
    }
  }

  async function onReset() {
    if (resetConfirmation !== RESET_CONFIRMATION) return showNotice("Type RESET exactly to delete the vault.", true)
    const reset = await runBusy(async () => {
      await sendToBackground({ type: "ACCOUNTS_RESET" })
      setResetOpen(false)
      setResetConfirmation("")
      return true
    }, "Could not reset the vault.")
    if (reset) await load()
  }

  async function onLock() {
    if (await runBusy(() => sendToBackground({ type: "ACCOUNTS_LOCK" }), "Could not lock accounts.")) await load()
  }

  async function onSaveCredential(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vault) return
    const form = new FormData(event.currentTarget)
    const id = editingCredential?.id ?? crypto.randomUUID()
    const record: CredentialRecord = {
      id,
      domain: String(form.get("domain") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      otpAuthUri: String(form.get("otpAuthUri") ?? "").trim(),
    }
    const credentials = vault.credentials.some((item) => item.id === id)
      ? vault.credentials.map((item) => item.id === id ? record : item)
      : [...vault.credentials, record]
    await save({ ...vault, credentials }, "Credential saved.")
  }

  async function onSaveStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vault) return
    const form = new FormData(event.currentTarget)
    const id = editingStore?.id ?? crypto.randomUUID()
    const record: StoreRecord = {
      id,
      name: String(form.get("name") ?? "").trim(),
      credentialId: storeCredentialId,
      storeUrl: String(form.get("storeUrl") ?? "").trim(),
    }
    const stores = vault.stores.some((item) => item.id === id)
      ? vault.stores.map((item) => item.id === id ? record : item)
      : [...vault.stores, record]
    await save({ ...vault, stores }, "Store saved.")
  }

  async function onChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    if (password !== String(form.get("confirm") ?? "")) return showNotice("Master passwords do not match.", true)
    await runBusy(async () => {
      await sendToBackground({ type: "ACCOUNTS_CHANGE_MASTER_PASSWORD", masterPassword: password })
      setPasswordOpen(false)
      showNotice("Master password changed.")
    }, "Could not change the master password.")
  }

  function closeExport(open: boolean) {
    setExportOpen(open)
    if (!open) setExportFormKey((key) => key + 1)
  }

  function closeImport(open: boolean) {
    setImportOpen(open)
    if (!open) setImportFormKey((key) => key + 1)
  }

  function selectedShareFile(form: HTMLFormElement): File | undefined {
    const field = form.elements.namedItem("file")
    const selected = field instanceof HTMLInputElement ? field.files?.[0] : undefined
    return selected?.name ? selected : undefined
  }

  async function onExportShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get("sharePassword") ?? "")
    if (password !== String(form.get("confirm") ?? "")) return showNotice("Share passwords do not match.", true)
    const response = await runBusy(
      () => sendToBackground({ type: "ACCOUNTS_EXPORT_SHARE", sharePassword: password }),
      "Could not export the vault.",
    )
    if (!response) return
    saveJsonFile(response.file, SHARE_FILE_NAME)
    closeExport(false)
    showNotice("Vault share file downloaded. Give the share password to the other person separately from the file.")
  }

  async function onImportShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const selected = selectedShareFile(event.currentTarget)
    if (!selected) return showNotice("Choose a share file.", true)
    const password = String(new FormData(event.currentTarget).get("sharePassword") ?? "")
    let file: unknown
    try {
      file = await readShareFile(selected)
    } catch (error) {
      showNotice(errorMessage(error, "This file is not a shared vault."), true)
      return
    }
    const response = await runBusy(
      () => sendToBackground({
        type: "ACCOUNTS_IMPORT_SHARE",
        file,
        sharePassword: password,
      }),
      "Could not import the shared vault.",
    )
    if (!response) return
    setVault(response.vault)
    setPage("editor")
    closeImport(false)
    showNotice(importSummary(response.added, response.updated))
  }

  async function onCreateFromShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const selected = selectedShareFile(event.currentTarget)
    if (!selected) return showNotice("Choose a share file.", true)
    const masterPassword = String(form.get("password") ?? "")
    if (masterPassword !== String(form.get("confirm") ?? "")) return showNotice("Master passwords do not match.", true)
    let file: unknown
    try {
      file = await readShareFile(selected)
    } catch (error) {
      showNotice(errorMessage(error, "This file is not a shared vault."), true)
      return
    }
    const created = await runBusy(
      () => sendToBackground({
        type: "ACCOUNTS_CREATE_FROM_SHARE",
        file,
        sharePassword: String(form.get("sharePassword") ?? ""),
        masterPassword,
      }),
      "Could not import the shared vault.",
    )
    if (created) await load()
  }

  async function onConfirmDelete() {
    if (!vault || !deleteTarget) return
    const next = deleteTarget.kind === "store"
      ? { ...vault, stores: vault.stores.filter((item) => item.id !== deleteTarget.id) }
      : { ...vault, credentials: vault.credentials.filter((item) => item.id !== deleteTarget.id) }
    await save(next, deleteTarget.kind === "store" ? "Store deleted." : "Credential deleted.")
  }

  const storeCount = (credentialId: string) => vault?.stores.filter((store) => store.credentialId === credentialId).length ?? 0
  const pendingLabel = (idle: string, pending: string) => busy ? pending : idle

  return (
    <PageShell
      description={page === "editor" ? "Encrypted Seller Central stores and the credentials they sign in with." : undefined}
      heading={page === "editor" || page === "loading"}
      status={page === "editor" ? <StatusDot active>Unlocked</StatusDot> : page === "locked" ? <StatusDot active={false}>Locked</StatusDot> : undefined}
      title="Accounts"
    >
      <div aria-busy={busy || page === "loading"} className={cn("flex flex-col gap-4 transition-opacity", busy && "opacity-60")}>
        {notice ? <Notice error={notice.error} message={notice.message} onDismiss={() => showNotice()} /> : null}

        {page === "loading" ? <p className="m-0 px-1 text-muted-foreground">Loading…</p> : null}

        {page === "create" ? (
          <CreateVaultSection busy={busy} onCreate={onCreate} onCreateFromShare={onCreateFromShare} pendingLabel={pendingLabel} />
        ) : null}

        {page === "locked" ? (
          <LockedVaultSection busy={busy} onRequestReset={() => { setResetConfirmation(""); setResetOpen(true) }} onUnlock={onUnlock} pendingLabel={pendingLabel} />
        ) : null}

        {page === "editor" && vault ? (
          <VaultEditor
            busy={busy}
            credentialsById={credentialsById}
            onChangePassword={() => setPasswordOpen(true)}
            onExport={() => setExportOpen(true)}
            onImport={() => setImportOpen(true)}
            onLock={onLock}
            openCredential={openCredential}
            openStore={openStore}
            requestDelete={requestDelete}
            storeCount={storeCount}
            vault={vault}
          />
        ) : null}
      </div>

      <Dialog onOpenChange={setCredentialOpen} open={credentialOpen}>
        <PanelDialogContent title={editingCredential ? "Edit credential" : "Add credential"}>
          <form onSubmit={(event) => void onSaveCredential(event)}>
            <div className="flex flex-col gap-4 p-4">
              <DialogDescription>The sign-in details shared by one or more stores.</DialogDescription>
              <Field htmlFor="credential-domain" label="Domain / email">
                <Input className={FIELD_INPUT} defaultValue={editingCredential?.domain} id="credential-domain" name="domain" required type="email" />
              </Field>
              <Field htmlFor="credential-password" label="Password">
                <Input autoComplete="off" className={FIELD_INPUT} defaultValue={editingCredential?.password} id="credential-password" name="password" required type="password" />
              </Field>
              <Field htmlFor="credential-otp" label="TOTP URI">
                <Input autoComplete="off" className={FIELD_INPUT} defaultValue={editingCredential?.otpAuthUri} id="credential-otp" name="otpAuthUri" placeholder="otpauth://totp/…" required type="password" />
              </Field>
            </div>
            <PanelFooter action end={<>
              <CancelButton onClick={() => setCredentialOpen(false)} type="button" />
              <PrimaryButton disabled={busy} type="submit">Save credential</PrimaryButton>
            </>} />
          </form>
        </PanelDialogContent>
      </Dialog>

      <Dialog onOpenChange={setStoreOpen} open={storeOpen}>
        <PanelDialogContent title={editingStore ? "Edit store" : "Add store"}>
          <form onSubmit={(event) => void onSaveStore(event)}>
            <div className="flex flex-col gap-4 p-4">
              <DialogDescription>Connect a Seller Central store to a saved credential.</DialogDescription>
              <Field htmlFor="store-name" label="Store name">
                <Input className={FIELD_INPUT} defaultValue={editingStore?.name} id="store-name" name="name" placeholder="JMG Outdoors" required />
              </Field>
              <Field htmlFor="store-credential" label="Credential">
                <Select onValueChange={setStoreCredentialId} required value={storeCredentialId}>
                  <SelectTrigger className="h-9! w-full rounded-[0.5rem]" id="store-credential">
                    <SelectValue placeholder="Choose a credential" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vault?.credentials ?? []).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field htmlFor="store-url" label="Seller Central store URL">
                <Input className={FIELD_INPUT} defaultValue={editingStore?.storeUrl} id="store-url" name="storeUrl" placeholder="https://sellercentral.amazon.com/home?…" required type="url" />
              </Field>
            </div>
            <PanelFooter action end={<>
              <CancelButton onClick={() => setStoreOpen(false)} type="button" />
              <PrimaryButton disabled={busy} type="submit">Save store</PrimaryButton>
            </>} />
          </form>
        </PanelDialogContent>
      </Dialog>

      <Dialog onOpenChange={closeExport} open={exportOpen}>
        <PanelDialogContent title="Export vault">
          <form key={exportFormKey} onSubmit={(event) => void onExportShare(event)}>
            <div className="flex flex-col gap-4 p-4">
              <DialogDescription>
                Choose a share password of at least 10 characters and give it to the other person separately from the file. It isn’t saved and can’t be recovered.
              </DialogDescription>
              <Field htmlFor="export-share-password" label="Share password">
                <Input autoComplete="off" className={FIELD_INPUT} id="export-share-password" minLength={10} name="sharePassword" required type="password" />
              </Field>
              <Field htmlFor="export-share-confirm" label="Confirm share password">
                <Input autoComplete="off" className={FIELD_INPUT} id="export-share-confirm" minLength={10} name="confirm" required type="password" />
              </Field>
            </div>
            <PanelFooter action end={<>
              <CancelButton onClick={() => closeExport(false)} type="button" />
              <PrimaryButton disabled={busy} type="submit">{pendingLabel("Export", "Exporting…")}</PrimaryButton>
            </>} />
          </form>
        </PanelDialogContent>
      </Dialog>

      <Dialog onOpenChange={closeImport} open={importOpen}>
        <PanelDialogContent title="Import vault">
          <form key={importFormKey} onSubmit={(event) => void onImportShare(event)}>
            <div className="flex flex-col gap-4 p-4">
              <DialogDescription>Accounts already on this device stay. Matching shared accounts are updated.</DialogDescription>
              <Field htmlFor="import-share-file" label="Share file">
                <Input accept=".json,application/json" className={FIELD_INPUT} id="import-share-file" name="file" type="file" />
              </Field>
              <Field htmlFor="import-share-password" label="Share password">
                <Input autoComplete="off" className={FIELD_INPUT} id="import-share-password" minLength={10} name="sharePassword" required type="password" />
              </Field>
            </div>
            <PanelFooter action end={<>
              <CancelButton onClick={() => closeImport(false)} type="button" />
              <PrimaryButton disabled={busy} type="submit">{pendingLabel("Import", "Importing…")}</PrimaryButton>
            </>} />
          </form>
        </PanelDialogContent>
      </Dialog>

      <Dialog onOpenChange={setPasswordOpen} open={passwordOpen}>
        <PanelDialogContent title="Change master password">
          <form onSubmit={(event) => void onChangePassword(event)}>
            <div className="flex flex-col gap-4 p-4">
              <DialogDescription>Choose a new password with at least 10 characters.</DialogDescription>
              <Field htmlFor="new-password" label="New master password">
                <Input autoComplete="new-password" className={FIELD_INPUT} id="new-password" minLength={10} name="password" required type="password" />
              </Field>
              <Field htmlFor="new-confirm" label="Confirm password">
                <Input autoComplete="new-password" className={FIELD_INPUT} id="new-confirm" minLength={10} name="confirm" required type="password" />
              </Field>
            </div>
            <PanelFooter action end={<>
              <CancelButton onClick={() => setPasswordOpen(false)} type="button" />
              <PrimaryButton disabled={busy} type="submit">{pendingLabel("Change password", "Changing…")}</PrimaryButton>
            </>} />
          </form>
        </PanelDialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} open={Boolean(deleteTarget)}>
        <ConfirmDialogContent
          confirm={
            <AlertDialogPrimitive.Action asChild>
              <DestructiveButton onClick={() => void onConfirmDelete()} type="button">Delete</DestructiveButton>
            </AlertDialogPrimitive.Action>
          }
          description={<>“{deleteTarget?.name}” will be permanently removed from this vault.</>}
          title={`Delete ${deleteTarget?.kind ?? "item"}?`}
        />
      </AlertDialog>

      <AlertDialog onOpenChange={(open) => { setResetOpen(open); if (!open) setResetConfirmation("") }} open={resetOpen}>
        <ConfirmDialogContent
          confirm={
            <AlertDialogPrimitive.Action asChild>
              <DestructiveButton
                disabled={busy || resetConfirmation !== RESET_CONFIRMATION}
                onClick={() => void onReset()}
                type="button"
              >
                Reset vault
              </DestructiveButton>
            </AlertDialogPrimitive.Action>
          }
          description="Type RESET to permanently delete the encrypted account vault. This can’t be undone."
          title="Reset vault?"
        >
          <Field htmlFor="reset-confirmation" label="Type RESET">
            <Input
              autoComplete="off"
              className={FIELD_INPUT}
              id="reset-confirmation"
              onChange={(event) => setResetConfirmation(event.target.value)}
              value={resetConfirmation}
            />
          </Field>
        </ConfirmDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
