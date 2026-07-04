/**
 * Per-key upstream throttle: Brave rate-limits each subscription key at
 * ~1 request/second, so request STARTS are serialized ≥1.1s apart per key.
 * Endpoints on different keys (search / suggest / spellcheck / answers)
 * proceed in parallel; endpoints sharing a key share a queue. Anchored on
 * globalThis to survive dev-mode HMR reloads.
 */

const MIN_INTERVAL_MS = 1100;

interface ThrottleState {
  chain: Promise<void>;
  lastStart: number;
  pending: number;
}

declare global {
  var __braveThrottle: Map<string, ThrottleState> | undefined;
}

// instanceof check (not just ??=): an HMR-surviving value from an older
// module version may have a different shape — never trust it blindly.
if (!(globalThis.__braveThrottle instanceof Map)) {
  globalThis.__braveThrottle = new Map();
}
const queues: Map<string, ThrottleState> = globalThis.__braveThrottle;

function queueFor(key: string): ThrottleState {
  let state = queues.get(key);
  if (!state) {
    state = { chain: Promise.resolve(), lastStart: 0, pending: 0 };
    queues.set(key, state);
  }
  return state;
}

/** Thrown when a sheddable request (suggest) finds the queue already backed up. */
export class ThrottleShedError extends Error {
  constructor() {
    super('Throttle queue full — request shed');
    this.name = 'ThrottleShedError';
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function throttled<T>(
  key: string,
  fn: () => Promise<T>,
  opts?: { shedWhenBusy?: boolean },
): Promise<T> {
  const state = queueFor(key);
  if (opts?.shedWhenBusy && state.pending > 2) throw new ThrottleShedError();
  state.pending++;
  // Each caller chains onto the previous slot grant; spacing is enforced
  // between grants, so a slow response doesn't stall the next request start.
  const slot = state.chain.then(async () => {
    const wait = state.lastStart + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    state.lastStart = Date.now();
  });
  state.chain = slot;
  try {
    await slot;
    return await fn();
  } finally {
    state.pending--;
  }
}
