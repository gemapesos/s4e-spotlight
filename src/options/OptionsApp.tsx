import * as React from "react"
import { CircleAlert, CircleCheck } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageShell } from "@/components/PageShell"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SHARE_FILE_NAME, type AccountVault, type CredentialRecord, type SharedVaultFile, type StoreRecord, type VaultMergeCounts } from "@/lib/accounts"
import { errorMessage } from "@/lib/log"
import { cn } from "@/lib/utils"
import { api } from "@/options/api"

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

function downloadShareFile(file: SharedVaultFile, targetDocument: Document = document): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }))
  const anchor = targetDocument.createElement("a")
  anchor.href = url
  anchor.download = SHARE_FILE_NAME
  targetDocument.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
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

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl px-4 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
      {children}
    </div>
  )
}

function SecretField({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = React.useState(false)

  React.useEffect(() => {
    if (!revealed) return
    const timer = window.setTimeout(() => setRevealed(false), 30_000)
    return () => window.clearTimeout(timer)
  }, [revealed])

  return (
    <InputGroup>
      <InputGroupInput
        aria-label={label}
        onBlur={() => setRevealed(false)}
        readOnly
        type={revealed ? "text" : "password"}
        value={value}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton onClick={() => setRevealed((open) => !open)}>
          {revealed ? "Hide" : "Reveal"}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

export function OptionsApp() {
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
    setBusy(true)
    try {
      return await action()
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
    showNotice()
    setBusy(true)
    try {
      const status = await api<{ ok: true; initialized?: boolean; unlocked?: boolean }>({ type: "ACCOUNTS_STATUS" })
      if (!status.initialized) {
        setVault(null)
        setPage("create")
      } else if (!status.unlocked) {
        setVault(null)
        setPage("locked")
      } else {
        const response = await api<{ ok: true; vault: AccountVault }>({ type: "ACCOUNTS_GET_VAULT" })
        setVault(response.vault)
        setPage("editor")
      }
    } catch (error) {
      showNotice(errorMessage(error, "Could not load accounts."), true)
    } finally {
      setBusy(false)
    }
  }, [showNotice])

  React.useEffect(() => {
    void load()
  }, [load])

  const save = React.useCallback(async (next: AccountVault, success: string) => {
    setBusy(true)
    try {
      await api({ type: "ACCOUNTS_SAVE_VAULT", vault: next })
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
    if (await runBusy(() => api({ type: "ACCOUNTS_CREATE", masterPassword: password }), "Could not create the vault.")) {
      await load()
    }
  }

  async function onUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const password = String(new FormData(event.currentTarget).get("password") ?? "")
    if (await runBusy(() => api({ type: "ACCOUNTS_UNLOCK", masterPassword: password }), "Could not unlock accounts.")) {
      await load()
    }
  }

  async function onReset() {
    if (resetConfirmation !== RESET_CONFIRMATION) return showNotice("Type RESET exactly to delete the vault.", true)
    const reset = await runBusy(async () => {
      await api({ type: "ACCOUNTS_RESET" })
      setResetOpen(false)
      setResetConfirmation("")
      return true
    }, "Could not reset the vault.")
    if (reset) await load()
  }

  async function onLock() {
    if (await runBusy(() => api({ type: "ACCOUNTS_LOCK" }), "Could not lock accounts.")) await load()
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
      await api({ type: "ACCOUNTS_CHANGE_MASTER_PASSWORD", masterPassword: password })
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
      () => api<{ ok: true; file: SharedVaultFile }>({ type: "ACCOUNTS_EXPORT_SHARE", sharePassword: password }),
      "Could not export the vault.",
    )
    if (!response) return
    downloadShareFile(response.file)
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
      () => api<{ ok: true; vault: AccountVault; added: VaultMergeCounts; updated: VaultMergeCounts }>({
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
      () => api({
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

  return (
    <PageShell
      actions={
        page === "editor" ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => setPasswordOpen(true)} type="button" variant="outline">
              Change master password
            </Button>
            <Button disabled={busy} onClick={() => void onLock()} type="button" variant="outline">Lock</Button>
          </div>
        ) : undefined
      }
      description="Manage encrypted Seller Central stores and shared credentials."
      title="Accounts"
    >
      <main aria-busy={busy || page === "loading"} className={cn("grid gap-6 transition-opacity", busy && "opacity-60")}>
        {notice ? (
          <Alert
            role={notice.error ? "alert" : "status"}
            variant={notice.error ? "destructive" : "default"}
          >
            {notice.error ? <CircleAlert /> : <CircleCheck />}
            <AlertTitle>{notice.error ? "Something went wrong" : "Success"}</AlertTitle>
            <AlertDescription>{notice.message}</AlertDescription>
            <AlertAction>
              <Button aria-label="Close notification" onClick={() => showNotice()} size="xs" type="button" variant="outline">Dismiss</Button>
            </AlertAction>
          </Alert>
        ) : null}

        {page === "loading" ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {page === "create" ? (
          <div className="grid max-w-xl gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Create encrypted vault</CardTitle>
                <CardDescription>Your master password encrypts every account locally. It cannot be recovered.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={(event) => void onCreate(event)}>
                  <div className="grid gap-2">
                    <Label htmlFor="create-password">Master password</Label>
                    <Input autoComplete="new-password" id="create-password" minLength={10} name="password" required type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-confirm">Confirm master password</Label>
                    <Input autoComplete="new-password" id="create-confirm" minLength={10} name="confirm" required type="password" />
                  </div>
                  <div>
                    <Button disabled={busy} type="submit">{busy ? "Creating…" : "Create vault"}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Import a shared vault</CardTitle>
                <CardDescription>Use a share file from someone else. The share password decrypts the file. Your new master password protects it on this device.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={(event) => void onCreateFromShare(event)}>
                  <div className="grid gap-2">
                    <Label htmlFor="create-share-file">Share file</Label>
                    <Input accept=".json,application/json" id="create-share-file" name="file" type="file" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-share-password">Share password</Label>
                    <Input autoComplete="off" id="create-share-password" minLength={10} name="sharePassword" required type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-share-master">New master password</Label>
                    <Input autoComplete="new-password" id="create-share-master" minLength={10} name="password" required type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-share-master-confirm">Confirm master password</Label>
                    <Input autoComplete="new-password" id="create-share-master-confirm" minLength={10} name="confirm" required type="password" />
                  </div>
                  <div>
                    <Button disabled={busy} type="submit">{busy ? "Importing…" : "Import vault"}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {page === "locked" ? (
          <div className="grid max-w-xl gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Unlock accounts</CardTitle>
                <CardDescription>Enter the master password to edit stores and credentials.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={(event) => void onUnlock(event)}>
                  <div className="grid gap-2">
                    <Label htmlFor="unlock-password">Master password</Label>
                    <Input autoComplete="current-password" autoFocus id="unlock-password" name="password" required type="password" />
                  </div>
                  <div>
                    <Button disabled={busy} type="submit">{busy ? "Unlocking…" : "Unlock"}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Forgotten master password</CardTitle>
                <CardDescription>Resetting permanently deletes the encrypted account vault. This action cannot be undone.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  disabled={busy}
                  onClick={() => { setResetConfirmation(""); setResetOpen(true) }}
                  type="button"
                  variant="destructive"
                >
                  Reset vault
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {page === "editor" && vault ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Share vault</CardTitle>
                <CardDescription>
                  Export an encrypted copy. The other person needs this extension, the file, and the share password. The share password is separate from your master password and is not saved.
                </CardDescription>
                <CardAction>
                  <div className="flex gap-2">
                    <Button disabled={busy} onClick={() => setExportOpen(true)} type="button" variant="outline">Export</Button>
                    <Button disabled={busy} onClick={() => setImportOpen(true)} type="button">Import</Button>
                  </div>
                </CardAction>
              </CardHeader>
            </Card>
            <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Credentials</CardTitle>
                <CardDescription>Domains, passwords, and TOTP secrets.</CardDescription>
                <CardAction>
                  <Button onClick={() => openCredential()} type="button">Add credential</Button>
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-3">
                {vault.credentials.length === 0 ? (
                  <EmptyState>No credentials yet.</EmptyState>
                ) : vault.credentials.map((item) => (
                  <article className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10" key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium">{item.domain}</h3>
                        <p className="text-sm text-muted-foreground">Shared credential</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => openCredential(item)} size="sm" type="button" variant="outline">Edit</Button>
                        <Button
                          onClick={() => requestDelete("credential", item.id, item.domain)}
                          size="sm"
                          type="button"
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <SecretField label={`Password for ${item.domain}`} value={item.password} />
                    <SecretField label={`OTP URI for ${item.domain}`} value={item.otpAuthUri} />
                  </article>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stores</CardTitle>
                <CardDescription>Seller Central destinations.</CardDescription>
                <CardAction>
                  <Button disabled={vault.credentials.length === 0} onClick={() => openStore()} type="button">Add store</Button>
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-3">
                {vault.stores.length === 0 ? (
                  <EmptyState>
                    {vault.credentials.length === 0 ? "Add a credential, then add your first store." : "No stores yet."}
                  </EmptyState>
                ) : vault.stores.map((item) => {
                  const domain = credentialsById.get(item.credentialId)?.domain ?? "Missing credential"
                  return (
                    <article className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10" key={item.id}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{domain}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => openStore(item)} size="sm" type="button" variant="outline">Edit</Button>
                          <Button
                            onClick={() => requestDelete("store", item.id, item.name)}
                            size="sm"
                            type="button"
                            variant="destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm break-all text-muted-foreground">{item.storeUrl}</p>
                    </article>
                  )
                })}
              </CardContent>
            </Card>
            </div>
          </div>
        ) : null}
      </main>

      <Dialog onOpenChange={setCredentialOpen} open={credentialOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={(event) => void onSaveCredential(event)}>
            <DialogHeader>
              <DialogTitle>{editingCredential ? "Edit credential" : "Add credential"}</DialogTitle>
              <DialogDescription>The sign-in details shared by one or more stores.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="credential-domain">Domain / email</Label>
              <Input defaultValue={editingCredential?.domain} id="credential-domain" name="domain" required type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credential-password">Password</Label>
              <Input
                autoComplete="off"
                defaultValue={editingCredential?.password}
                id="credential-password"
                name="password"
                required
                type="password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credential-otp">TOTP URI</Label>
              <Input
                autoComplete="off"
                defaultValue={editingCredential?.otpAuthUri}
                id="credential-otp"
                name="otpAuthUri"
                placeholder="otpauth://totp/…"
                required
                type="password"
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setCredentialOpen(false)} type="button" variant="outline">Cancel</Button>
              <Button disabled={busy} type="submit">Save credential</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setStoreOpen} open={storeOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={(event) => void onSaveStore(event)}>
            <DialogHeader>
              <DialogTitle>{editingStore ? "Edit store" : "Add store"}</DialogTitle>
              <DialogDescription>Connect a Seller Central destination to a saved credential.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="store-name">Store name</Label>
              <Input defaultValue={editingStore?.name} id="store-name" name="name" placeholder="JMG Outdoors" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="store-credential">Credential</Label>
              <Select onValueChange={setStoreCredentialId} required value={storeCredentialId}>
                <SelectTrigger className="w-full" id="store-credential">
                  <SelectValue placeholder="Choose a credential" />
                </SelectTrigger>
                <SelectContent>
                  {(vault?.credentials ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="store-url">Seller Central store URL</Label>
              <Input
                defaultValue={editingStore?.storeUrl}
                id="store-url"
                name="storeUrl"
                placeholder="https://sellercentral.amazon.com/home?…"
                required
                type="url"
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setStoreOpen(false)} type="button" variant="outline">Cancel</Button>
              <Button disabled={busy} type="submit">Save store</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={closeExport} open={exportOpen}>
        <DialogContent>
          <form className="grid gap-4" key={exportFormKey} onSubmit={(event) => void onExportShare(event)}>
            <DialogHeader>
              <DialogTitle>Export vault</DialogTitle>
              <DialogDescription>
                Choose a share password of at least 10 characters. Give it to the other person separately from the file. It is not saved and cannot be recovered.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="export-share-password">Share password</Label>
              <Input autoComplete="off" id="export-share-password" minLength={10} name="sharePassword" required type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="export-share-confirm">Confirm share password</Label>
              <Input autoComplete="off" id="export-share-confirm" minLength={10} name="confirm" required type="password" />
            </div>
            <DialogFooter>
              <Button onClick={() => closeExport(false)} type="button" variant="outline">Cancel</Button>
              <Button disabled={busy} type="submit">{busy ? "Exporting…" : "Export"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={closeImport} open={importOpen}>
        <DialogContent>
          <form className="grid gap-4" key={importFormKey} onSubmit={(event) => void onImportShare(event)}>
            <DialogHeader>
              <DialogTitle>Import vault</DialogTitle>
              <DialogDescription>Accounts already on this device stay. Matching shared accounts are updated.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="import-share-file">Share file</Label>
              <Input accept=".json,application/json" id="import-share-file" name="file" type="file" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="import-share-password">Share password</Label>
              <Input autoComplete="off" id="import-share-password" minLength={10} name="sharePassword" required type="password" />
            </div>
            <DialogFooter>
              <Button onClick={() => closeImport(false)} type="button" variant="outline">Cancel</Button>
              <Button disabled={busy} type="submit">{busy ? "Importing…" : "Import"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setPasswordOpen} open={passwordOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={(event) => void onChangePassword(event)}>
            <DialogHeader>
              <DialogTitle>Change master password</DialogTitle>
              <DialogDescription>Choose a new password with at least 10 characters.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New master password</Label>
              <Input autoComplete="new-password" id="new-password" minLength={10} name="password" required type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-confirm">Confirm password</Label>
              <Input autoComplete="new-password" id="new-confirm" minLength={10} name="confirm" required type="password" />
            </div>
            <DialogFooter>
              <Button onClick={() => setPasswordOpen(false)} type="button" variant="outline">Cancel</Button>
              <Button disabled={busy} type="submit">{busy ? "Changing…" : "Change password"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} open={Boolean(deleteTarget)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.kind}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.name}” will be permanently removed from this vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onConfirmDelete()} variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={(open) => { setResetOpen(open); if (!open) setResetConfirmation("") }} open={resetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset vault?</AlertDialogTitle>
            <AlertDialogDescription>Type RESET to permanently delete the encrypted account vault. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reset-confirmation">Type RESET</Label>
            <Input
              autoComplete="off"
              id="reset-confirmation"
              onChange={(event) => setResetConfirmation(event.target.value)}
              value={resetConfirmation}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || resetConfirmation !== RESET_CONFIRMATION}
              onClick={() => void onReset()}
              variant="destructive"
            >
              Reset vault
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
