/** Requests from the sign-in automation content script running in the switch's tab. */
import { generateTotp, parseOtpAuthUri } from "@/lib/accounts"
import type { BackgroundReply } from "@/shared/messages"
import { assertSwitchOperationCurrent } from "../operations"
import { setCurrentStoreId } from "../vault"
import { assertWorkflowSender, getActiveJob, getJobRecords, jobContext, jobLog, setJobStage, withJobDebugger } from "./job"
import { advanceLogoutToSignIn, openStoreAfterSignIn, signInUrlFor } from "./signIn"
import { finishAccountSwitch, pauseSwitch } from "./tabs"

const MAX_OTP_CODES = 2
const AUTOMATION_CLICK_ACTIONS = new Set(["continue", "password-submit", "otp-submit"])

export async function automationJob(_message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_GET_JOB">> {
  const job = await getActiveJob()
  if (!job || sender.tab?.id !== job.tabId || sender.frameId !== 0 || !sender.documentId || !sender.url || new URL(sender.url).origin !== "https://sellercentral.amazon.com") return { ok: true, job: null }
  return { ok: true, job: { id: job.id, stage: job.stage, ...(job.resumeStage ? { resumeStage: job.resumeStage } : {}) } }
}

export async function automationSecret(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_SECRET">> {
  const job = await assertWorkflowSender(sender, message.jobId)
  if (!sender.url || !new URL(sender.url).pathname.startsWith("/ap/")) throw new Error("Credentials are only available on an Amazon sign-in page.")
  const stage = job.resumeStage ?? job.stage
  if (stage === "logout" || stage === "store" || stage === "authenticated" || new URL(sender.url).searchParams.get("openid.return_to")?.includes("/sign-out")) {
    throw new Error("Credentials are not available during this login step.")
  }
  const { credential } = await getJobRecords(job)
  if (message.kind === "email") {
    await setJobStage(job, "email")
    return { ok: true, value: credential.domain }
  }
  if (message.kind === "password") {
    await setJobStage(job, "password")
    return { ok: true, value: credential.password }
  }
  if (message.kind === "otp") {
    // Submit at once, even late in a time step: RFC 6238 verifiers accept the previous step.
    // A rejected code is retried once with a later step's code, never the same one.
    const attempts = job.otpAttempts ?? 0
    if (attempts >= MAX_OTP_CODES || (message.retry === true && attempts === 0)) {
      throw new Error("Amazon rejected the verification code. Check the saved authenticator key or this computer's clock.")
    }
    const { period } = parseOtpAuthUri(credential.otpAuthUri)
    const current = Math.floor(Date.now() / 1000 / period)
    const counter = job.otpCounter === undefined ? current : Math.max(current, job.otpCounter + 1)
    if (message.retry === true) jobLog(job).warn("account.switch.otpRetry", { ...jobContext(job), stepsAhead: counter - current })
    job.otpCounter = counter
    job.otpAttempts = attempts + 1
    await setJobStage(job, "otp")
    return { ok: true, value: await generateTotp(credential.otpAuthUri, counter * period * 1000) }
  }
  throw new Error("Unknown credential stage.")
}

export async function automationClick(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_CLICK">> {
  const job = await assertWorkflowSender(sender, message.jobId)
  if (typeof message.action !== "string" || !AUTOMATION_CLICK_ACTIONS.has(message.action)) {
    throw new Error("Unsupported login click action.")
  }
  const { x, y } = message
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
    throw new Error("Invalid login click coordinates.")
  }
  const expectedStage = { continue: "email", "password-submit": "password", "otp-submit": "otp" }[message.action]
  if (job.stage !== expectedStage) throw new Error("This click does not match the current login step.")
  await withJobDebugger(job, async (target) => {
    const send = (type: string, extra: Record<string, unknown> = {}) => {
      assertSwitchOperationCurrent()
      return chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type, x, y, ...extra })
    }
    await send("mouseMoved")
    await send("mousePressed", { button: "left", clickCount: 1 })
    await send("mouseReleased", { button: "left", clickCount: 1 })
  })
  jobLog(job).info("account.switch.click", { ...jobContext(job), action: message.action })
  return { ok: true }
}

export async function automationPaused(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_PAUSED">> {
  const job = await assertWorkflowSender(sender, message.jobId)
  const reason = typeof message.reason === "string" ? message.reason : "captcha"
  await pauseSwitch(job, reason)
  jobLog(job).warn("account.switch.paused", { ...jobContext(job), reason })
  return { ok: true }
}

export async function automationLeaveLogout(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_LEAVE_LOGOUT">> {
  const job = await assertWorkflowSender(sender, message.jobId)
  if ((job.resumeStage ?? job.stage) !== "logout" || sender.url === job.signOutFallbackFrom) return { ok: true }
  await advanceLogoutToSignIn(job)
  return { ok: true }
}

export async function automationComplete(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_COMPLETE">> {
  const job = await assertWorkflowSender(sender, message.jobId)
  await openStoreAfterSignIn(job, sender.url, sender.documentId)
  return { ok: true }
}

export async function automationStoreReady(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_STORE_READY">> {
  const job = await assertWorkflowSender(sender, message.jobId)
  return finishAccountSwitch(job, sender)
}

export async function automationReauth(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_REAUTH">> {
  const job = await assertWorkflowSender(sender, message.jobId)
  if ((job.resumeStage ?? job.stage) !== "store" || !new URL(sender.url!).pathname.startsWith("/ap/")) throw new Error("Unexpected sign-in step.")
  await setCurrentStoreId(undefined)
  job.signIn = true
  job.otpAttempts = 0
  await setJobStage(job, "signin")
  await chrome.tabs.update(job.tabId, { url: signInUrlFor((await getJobRecords(job)).store.storeUrl) })
  return { ok: true }
}

export async function automationError(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_ERROR">> {
  const job = await assertWorkflowSender(sender, message.jobId)
  await pauseSwitch(job, "error")
  const error = typeof message.error === "string" ? message.error : "Unknown error."
  jobLog(job).error("account.switch.failed", { ...jobContext(job), error })
  return { ok: true }
}
