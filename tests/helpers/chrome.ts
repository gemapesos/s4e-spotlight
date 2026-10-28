import { vi } from "vitest"

/** A chrome.storage area kept in `values`, which tests can seed and read directly. */
export function storageArea(values: Record<string, unknown>) {
  return {
    get: vi.fn(async (keys: string | string[] | null) => keys === null ? structuredClone(values) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter((key) => key in values).map((key) => [key, structuredClone(values[key])]))),
    set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(values, structuredClone(items)) }),
    remove: vi.fn(async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete values[key] }),
  }
}
