/** Serializes vault and switch work, so Lock, Reset and Cancel can invalidate it mid-flight. */

let vaultOperations: Promise<unknown> = Promise.resolve()
export let vaultGeneration = 0
export let operationGeneration = 0
export let switchGeneration = 0
export let operationSwitchGeneration = 0

export function assertVaultOperationCurrent(): void {
  if (operationGeneration !== vaultGeneration) throw new Error("The vault changed while this operation was running. Please try again.")
}

export function assertSwitchOperationCurrent(): void {
  assertVaultOperationCurrent()
  if (operationSwitchGeneration !== switchGeneration) throw new Error("The account switch was cancelled.")
}

export function queueVaultOperation<T>(action: () => Promise<T>): Promise<T> {
  const generation = vaultGeneration
  const switchVersion = switchGeneration
  const result = vaultOperations.catch(() => undefined).then(async () => {
    operationGeneration = generation
    operationSwitchGeneration = switchVersion
    assertVaultOperationCurrent()
    const response = await action()
    assertVaultOperationCurrent()
    return response
  })
  vaultOperations = result.catch(() => undefined)
  return result
}

/** Lock, Reset and a new master password end vault work already running. */
export function invalidateVaultOperations(): void {
  vaultGeneration += 1
}

/** Cancel ends switch work already running. */
export function invalidateSwitchOperations(): void {
  switchGeneration += 1
}
