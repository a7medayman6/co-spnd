// Stale-while-revalidate cache: memory-backed, localStorage-persisted.
// No TTL — cached data is always shown immediately; callers always
// fetch in the background and call cacheSet when fresh data arrives.

const LS_PREFIX = 'co_spnd_c_'
const mem = new Map<string, unknown>()

export function cacheGet<T>(key: string): T | null {
  if (mem.has(key)) return mem.get(key) as T
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (raw !== null) {
      const val = JSON.parse(raw) as T
      mem.set(key, val)
      return val
    }
  } catch {}
  return null
}

export function cacheSet<T>(key: string, data: T): void {
  mem.set(key, data)
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(data))
  } catch {}
}

// Removes all keys that start with `prefix` from both mem and localStorage.
export function cacheInvalidate(prefix: string): void {
  for (const k of [...mem.keys()]) {
    if (k.startsWith(prefix)) mem.delete(k)
  }
  try {
    const lsPrefix = LS_PREFIX + prefix
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(lsPrefix)) localStorage.removeItem(k)
    }
  } catch {}
}
