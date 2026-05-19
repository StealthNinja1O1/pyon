// token bucket per IP pyon. in-memoryだけど discord bot client なら現実的に十分.

type Bucket = { tokens: number; last: number };

const CAPACITY = 10;            // burstはここまで許す pyon
const REFILL_PER_MS = 10 / 1000; // 平均 10 req/sec/IP
const SWEEP_MS = 60_000;
const IDLE_MS = 5 * 60_000;     // 5min触ってないbucketは捨てる

const buckets = new Map<string, Bucket>();

export function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);

  if (!b) {
    buckets.set(ip, { tokens: CAPACITY - 1, last: now });
    return true;
  }

  // 経過時間ぶん 補充. capacity 超えない
  const elapsed = now - b.last;
  b.tokens = Math.min(CAPACITY, b.tokens + elapsed * REFILL_PER_MS);
  b.last = now;

  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

// 放っとくとmapが膨らむので定期的に掃除 pyon
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of buckets) {
    if (now - b.last > IDLE_MS) buckets.delete(ip);
  }
}, SWEEP_MS);
// healthcheck等でprocess止めたい時にこのintervalで居座られないように
sweeper.unref?.();
