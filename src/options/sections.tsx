/** The Accounts page's sections: creating a vault, unlocking it, and editing its stores and credentials. */
import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Building2, ChevronRight, Download, KeyRound, Lock, Pencil, Plus, Trash2, Upload } from "lucide-react"

import {
  ActionRow,
  Field,
  HeaderButton,
  PanelFooter,
  PrimaryButton,
  Surface,
  SurfaceHeader,
  SurfaceList,
  surfaceRowClassName,
} from "@/components/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AccountVault, CredentialRecord, StoreRecord } from "@/lib/accounts"
import { cn } from "@/lib/utils"

type FormHandler = (event: React.FormEvent<HTMLFormElement>) => Promise<void>

export const FIELD_INPUT = "h-9 rounded-[0.5rem]"

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="m-0 px-2 py-6 text-center text-sm text-muted-foreground">{children}</p>
}

function SecretField({ label, name, value }: { label: string; name: string; value: string }) {
  const [revealed, setRevealed] = React.useState(false)

  React.useEffect(() => {
    if (!revealed) return
    const timer = window.setTimeout(() => setRevealed(false), 30_000)
    return () => window.clearTimeout(timer)
  }, [revealed])

  return (
    <span className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-[0.375rem] border bg-background pr-1 pl-2.5 dark:bg-input/30">
      <span className="shrink-0 text-xs leading-4 font-medium text-muted-foreground">{name}</span>
      <input
        aria-label={label}
        className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs leading-4 text-foreground/80 outline-none"
        onBlur={() => setRevealed(false)}
        readOnly
        type={revealed ? "text" : "password"}
        value={value}
      />
      <button
        className="h-5 shrink-0 rounded-[0.25rem] bg-muted px-1.5 text-[0.6875rem] leading-4 font-medium text-foreground/70 transition-colors hover:text-foreground"
        onClick={() => setRevealed((open) => !open)}
        type="button"
      >
        {revealed ? "Hide" : "Reveal"}
      </button>
    </span>
  )
}

/** Edit and delete for a row; they show when the row is hovered or focused. */
function RowActions({ name, onDelete, onEdit }: { name: string; onDelete: () => void; onEdit: () => void }) {
  const buttonClass = "size-7 rounded-[0.375rem] text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
  return (
    <span className="flex shrink-0 items-center opacity-0 transition-opacity duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100">
      <Button aria-label={`Edit ${name}`} className={buttonClass} onClick={onEdit} size="icon" type="button" variant="ghost">
        <Pencil aria-hidden="true" className="size-3.5" />
      </Button>
      <Button aria-label={`Delete ${name}`} className={buttonClass} onClick={onDelete} size="icon" type="button" variant="ghost">
        <Trash2 aria-hidden="true" className="size-3.5" />
      </Button>
    </span>
  )
}

/** The icon tile, title and description at the top of a vault-setup surface. */
function SetupHeading({ description, icon: Icon, title }: { description: string; icon: LucideIcon; title: string }) {
  return (
    <div className="flex gap-3 px-4 pt-5 pb-4">
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-muted text-foreground/80">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-base leading-6 font-medium">{title}</h2>
        <p className="m-0 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function CreateVaultSection({ busy, onCreate, onCreateFromShare, pendingLabel }: {
  busy: boolean
  onCreate: FormHandler
  onCreateFromShare: FormHandler
  pendingLabel: (idle: string, pending: string) => string
}) {
  return (
      <div className="mx-auto flex w-full max-w-[25rem] flex-col gap-4 pt-16">
        <Surface>
          <form onSubmit={(event) => void onCreate(event)}>
            <SetupHeading
              description="Your master password encrypts every account on this device. It can’t be recovered."
              icon={Lock}
              title="Create encrypted vault"
            />
            <div className="flex flex-col gap-4 px-4 pb-4">
              <Field htmlFor="create-password" label="Master password">
                <Input autoComplete="new-password" className={FIELD_INPUT} id="create-password" minLength={10} name="password" required type="password" />
              </Field>
              <Field htmlFor="create-confirm" label="Confirm master password">
                <Input autoComplete="new-password" className={FIELD_INPUT} id="create-confirm" minLength={10} name="confirm" required type="password" />
              </Field>
            </div>
            <PanelFooter action end={<PrimaryButton disabled={busy} type="submit">{pendingLabel("Create vault", "Creating…")}</PrimaryButton>}>
              At least 10 characters
            </PanelFooter>
          </form>
        </Surface>
        <Surface>
          <form onSubmit={(event) => void onCreateFromShare(event)}>
            <SetupHeading
              description="Use a share file from someone else. The share password opens it; your new master password protects it here."
              icon={Upload}
              title="Import a shared vault"
            />
            <div className="flex flex-col gap-4 px-4 pb-4">
              <Field htmlFor="create-share-file" label="Share file">
                <Input accept=".json,application/json" className={FIELD_INPUT} id="create-share-file" name="file" type="file" />
              </Field>
              <Field htmlFor="create-share-password" label="Share password">
                <Input autoComplete="off" className={FIELD_INPUT} id="create-share-password" minLength={10} name="sharePassword" required type="password" />
              </Field>
              <Field htmlFor="create-share-master" label="New master password">
                <Input autoComplete="new-password" className={FIELD_INPUT} id="create-share-master" minLength={10} name="password" required type="password" />
              </Field>
              <Field htmlFor="create-share-master-confirm" label="Confirm master password">
                <Input autoComplete="new-password" className={FIELD_INPUT} id="create-share-master-confirm" minLength={10} name="confirm" required type="password" />
              </Field>
            </div>
            <PanelFooter action end={<PrimaryButton disabled={busy} type="submit">{pendingLabel("Import vault", "Importing…")}</PrimaryButton>} />
          </form>
        </Surface>
      </div>
  )
}

export function LockedVaultSection({ busy, onRequestReset, onUnlock, pendingLabel }: {
  busy: boolean
  onRequestReset: () => void
  onUnlock: FormHandler
  pendingLabel: (idle: string, pending: string) => string
}) {
  return (
      <div className="mx-auto w-full max-w-[25rem] pt-16">
        <Surface>
          <form onSubmit={(event) => void onUnlock(event)}>
            <SetupHeading
              description="Enter the master password to edit stores and credentials."
              icon={Lock}
              title="Unlock accounts"
            />
            <div className="px-4 pb-4">
              <Field htmlFor="unlock-password" label="Master password">
                <Input autoComplete="current-password" autoFocus className="h-10 rounded-[0.625rem] px-3" id="unlock-password" name="password" required type="password" />
              </Field>
            </div>
            <PanelFooter action end={<PrimaryButton disabled={busy} type="submit">{pendingLabel("Unlock", "Unlocking…")}</PrimaryButton>}>
              <span className="inline-flex items-center gap-1">
                Forgot it?
                <Button
                  className="h-7 rounded-[0.375rem] px-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={busy}
                  onClick={onRequestReset}
                  type="button"
                  variant="ghost"
                >
                  Reset vault
                </Button>
              </span>
            </PanelFooter>
          </form>
        </Surface>
      </div>
  )
}

export function VaultEditor({
  busy,
  credentialsById,
  onChangePassword,
  onExport,
  onImport,
  onLock,
  openCredential,
  openStore,
  requestDelete,
  storeCount,
  vault,
}: {
  busy: boolean
  credentialsById: ReadonlyMap<string, CredentialRecord>
  onChangePassword: () => void
  onExport: () => void
  onImport: () => void
  onLock: () => Promise<void>
  openCredential: (record?: CredentialRecord) => void
  openStore: (record?: StoreRecord) => void
  requestDelete: (kind: "store" | "credential", id: string, name: string) => void
  storeCount: (credentialId: string) => number
  vault: AccountVault
}) {
  return <>
    <Surface aria-labelledby="stores-heading">
      <SurfaceHeader
        action={
          <HeaderButton disabled={vault.credentials.length === 0} onClick={() => openStore()} type="button">
            <Plus aria-hidden="true" />
            Add store
          </HeaderButton>
        }
        count={vault.stores.length}
        id="stores-heading"
        title="Stores"
      />
      <SurfaceList>
        {vault.stores.length === 0 ? (
          <EmptyRow>{vault.credentials.length === 0 ? "Add a credential, then add your first store." : "No stores yet."}</EmptyRow>
        ) : vault.stores.map((item) => (
          <article className={surfaceRowClassName} key={item.id}>
            <Building2 aria-hidden="true" />
            <h3 className="m-0 min-w-0 flex-1 truncate text-sm font-normal sm:w-52 sm:flex-none" title={item.storeUrl}>{item.name}</h3>
            <span className="min-w-0 flex-1 truncate text-xs leading-4 text-muted-foreground">
              {credentialsById.get(item.credentialId)?.domain ?? "Missing credential"}
            </span>
            <RowActions
              name={item.name}
              onDelete={() => requestDelete("store", item.id, item.name)}
              onEdit={() => openStore(item)}
            />
          </article>
        ))}
      </SurfaceList>
    </Surface>

    <Surface aria-labelledby="credentials-heading">
      <SurfaceHeader
        action={
          <HeaderButton onClick={() => openCredential()} type="button">
            <Plus aria-hidden="true" />
            Add credential
          </HeaderButton>
        }
        count={vault.credentials.length}
        id="credentials-heading"
        title="Credentials"
      />
      <SurfaceList className="gap-0.5">
        {vault.credentials.length === 0 ? (
          <EmptyRow>No credentials yet.</EmptyRow>
        ) : vault.credentials.map((item) => {
          const used = storeCount(item.id)
          return (
            <article className={cn(surfaceRowClassName, "flex-wrap gap-y-1.5 pt-1.5 pb-2")} key={item.id}>
              <KeyRound aria-hidden="true" />
              <h3 className="m-0 min-w-0 flex-1 truncate text-sm font-normal sm:w-52 sm:flex-none">{item.domain}</h3>
              <span className="min-w-0 flex-1 truncate text-xs leading-4 text-muted-foreground">
                {used ? `Used by ${used} ${used === 1 ? "store" : "stores"}` : "Not used by a store"}
              </span>
              <RowActions
                name={item.domain}
                onDelete={() => requestDelete("credential", item.id, item.domain)}
                onEdit={() => openCredential(item)}
              />
              <div className="flex basis-full gap-2 pl-6">
                <SecretField label={`Password for ${item.domain}`} name="Password" value={item.password} />
                <SecretField label={`OTP URI for ${item.domain}`} name="TOTP" value={item.otpAuthUri} />
              </div>
            </article>
          )
        })}
      </SurfaceList>
    </Surface>

    <Surface aria-labelledby="vault-heading">
      <SurfaceHeader id="vault-heading" title="Vault" />
      <SurfaceList>
        <ActionRow
          description="An encrypted file that opens with a separate share password"
          disabled={busy}
          icon={Download}
          label="Export vault"
          onClick={onExport}
          trailing={<ChevronRight aria-hidden="true" className="mr-1.5 size-3.5 shrink-0 text-ring" />}
        />
        <ActionRow
          description="Adds and updates accounts; nothing here is removed"
          disabled={busy}
          icon={Upload}
          label="Import shared vault"
          onClick={onImport}
          trailing={<ChevronRight aria-hidden="true" className="mr-1.5 size-3.5 shrink-0 text-ring" />}
        />
        <ActionRow
          disabled={busy}
          icon={KeyRound}
          label="Change master password"
          onClick={onChangePassword}
          trailing={<ChevronRight aria-hidden="true" className="mr-1.5 size-3.5 shrink-0 text-ring" />}
        />
        <ActionRow
          description="Asks for the master password again"
          disabled={busy}
          icon={Lock}
          label="Lock"
          onClick={() => void onLock()}
        />
      </SurfaceList>
    </Surface>
  </>
}
