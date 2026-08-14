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
import type { AccountVault, CredentialRecord, StoreRecord } from "@/lib/accounts"
import { api } from "@/options/api"

type Page = "loading" | "create" | "locked" | "editor"
type DeleteTarget = { kind: "store" | "credential"; id: string; name: string }
type Notice = { message: string; error: boolean }

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
      showNotice(error instanceof Error ? error.message : "Could not load accounts.", true)
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
      showNotice(error instanceof Error ? error.message : "Could not save the vault.", true)
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
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    if (password !== String(form.get("confirm") ?? "")) return showNotice("Master passwords do not match.", true)
    try {
      await api({ type: "ACCOUNTS_CREATE", masterPassword: password })
      await load()
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not create the vault.", true)
    }
  }

  async function onUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const password = String(new FormData(event.currentTarget).get("password") ?? "")
    try {
      await api({ type: "ACCOUNTS_UNLOCK", masterPassword: password })
      await load()
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not unlock accounts.", true)
    }
  }

  async function onReset() {
    if (resetConfirmation !== "RESET") return showNotice("Type RESET exactly to delete the vault.", true)
    try {
      await api({ type: "ACCOUNTS_RESET" })
      setResetOpen(false)
      setResetConfirmation("")
      await load()
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not reset the vault.", true)
    }
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
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    if (password !== String(form.get("confirm") ?? "")) return showNotice("Master passwords do not match.", true)
    try {
      await api({ type: "ACCOUNTS_CHANGE_MASTER_PASSWORD", masterPassword: password })
      setPasswordOpen(false)
      showNotice("Master password changed.")
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not change the master password.", true)
    }
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
            <Button onClick={() => setPasswordOpen(true)} type="button" variant="outline">Change master password</Button>
            <Button onClick={() => void api({ type: "ACCOUNTS_LOCK" }).then(load, (error) => showNotice(error instanceof Error ? error.message : "Could not lock accounts.", true))} type="button" variant="outline">Lock</Button>
          </div>
        ) : undefined
      }
      description="Manage encrypted Seller Central stores and shared credentials."
      title="Accounts"
    >
      <main aria-busy={busy || page === "loading"} className={`grid gap-6${busy ? " opacity-60" : ""}`}>
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
          <Card className="max-w-xl">
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
                  <Button disabled={busy} type="submit">Create vault</Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
                    <Button disabled={busy} type="submit">Unlock</Button>
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
                <Button onClick={() => { setResetConfirmation(""); setResetOpen(true) }} type="button" variant="destructive">Reset vault</Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {page === "editor" && vault ? (
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
                  <div className="flex min-h-32 items-center justify-center rounded-xl text-sm text-muted-foreground ring-1 ring-foreground/10">No credentials yet.</div>
                ) : vault.credentials.map((item) => (
                  <article className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10" key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium">{item.domain}</h3>
                        <p className="text-sm text-muted-foreground">Shared credential</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => openCredential(item)} size="sm" type="button" variant="outline">Edit</Button>
                        <Button onClick={() => requestDelete("credential", item.id, item.domain)} size="sm" type="button" variant="destructive">Delete</Button>
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
                  <div className="flex min-h-32 items-center justify-center rounded-xl text-sm text-muted-foreground ring-1 ring-foreground/10">Add a credential, then add your first store.</div>
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
                          <Button onClick={() => requestDelete("store", item.id, item.name)} size="sm" type="button" variant="destructive">Delete</Button>
                        </div>
                      </div>
                      <p className="text-sm break-all text-muted-foreground">{item.storeUrl}</p>
                    </article>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>

      <Dialog onOpenChange={setCredentialOpen} open={credentialOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={(event) => void onSaveCredential(event)}>
            <DialogHeader>
              <DialogTitle>Credential</DialogTitle>
              <DialogDescription>Add the sign-in details shared by one or more stores.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="credential-domain">Domain / email</Label>
              <Input defaultValue={editingCredential?.domain} id="credential-domain" name="domain" required type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credential-password">Password</Label>
              <Input autoComplete="off" defaultValue={editingCredential?.password} id="credential-password" name="password" required type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credential-otp">TOTP URI</Label>
              <Input autoComplete="off" defaultValue={editingCredential?.otpAuthUri} id="credential-otp" name="otpAuthUri" placeholder="otpauth://totp/…" required type="password" />
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
              <DialogTitle>Store</DialogTitle>
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
              <Input defaultValue={editingStore?.storeUrl} id="store-url" name="storeUrl" placeholder="https://sellercentral.amazon.com/home?…" required type="url" />
            </div>
            <DialogFooter>
              <Button onClick={() => setStoreOpen(false)} type="button" variant="outline">Cancel</Button>
              <Button disabled={busy} type="submit">Save store</Button>
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
              <Button disabled={busy} type="submit">Change password</Button>
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
            <Input autoComplete="off" id="reset-confirmation" onChange={(event) => setResetConfirmation(event.target.value)} value={resetConfirmation} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onReset()} variant="destructive">Reset vault</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
