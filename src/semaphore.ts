// in-process slot counter pyon. busy なら 503 で蹴る、queue はしない (memory grow 防止).
// global semaphore なのでhorizontal scale したら意味失う、その時は外部にずらす.

const MAX = Number(process.env.PYON_MAX_CONCURRENT ?? 4);

let active = 0;

export function tryAcquireSlot(): boolean {
  if (active >= MAX) return false;
  active++;
  return true;
}

export function releaseSlot(): void {
  if (active > 0) active--;
}
