import { isAllowedAvatarUrl } from "./allowlist";

// avatarをhttps fetch -> data url にしてからsatoriに渡す pyon
// satori自体はurl直接食えるけど、自分でinlineした方が
//   1. round tripをcontrolできる (satoriの裏で何やってるか分からんの怖い)
//   2. CDNがbuggyになった時のerror surfaceがcleanになる
//   3. 後でcacheしたい時に楽 pyon

const MAX_BYTES = 4 * 1024 * 1024; // 4 mb. discord cdnのavatarはちっちゃいけど一応defensive pyon
const TIMEOUT_MS = 5_000;          // 5秒で切る. CDN死んでてもserver全体が詰まないように
const MAX_REDIRECTS = 3;           // 3xx踏むなら3回まで. それ以上は怪しい挙動なので諦める

export async function fetchAvatar(url: string): Promise<string> {
  if (!isAllowedAvatarUrl(url)) {
    // schema側でも弾いてるけど defense in depth pyon
    throw new Error("avatar host not allowed");
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetchFollow(url, ctrl);

    if (!res.ok) {
      throw new Error(`avatar fetch failed: ${res.status} ${res.statusText}`);
    }

    const ct = res.headers.get("content-type") ?? "image/png";
    if (!ct.startsWith("image/")) {
      throw new Error(`avatar is not an image: ${ct}`);
    }

    // content-length 嘘つくserver もいるけど、宣言値で先に蹴れるならtaipa神 pyon
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (Number.isFinite(declared) && declared > MAX_BYTES) {
      throw new Error("avatar too large");
    }

    const buf = await readWithCap(res);
    const b64 = buf.toString("base64");
    return `data:${ct};base64,${b64}`;
  } finally {
    clearTimeout(t);
  }
}

// redirectを手動で踏む pyon. 各hopをallowlistで再check.
// fetchのdefault `redirect: "follow"` は最初のURLしかguardかけないので、SSRFバイパスの王道. ここで止める.
async function fetchFollow(initialUrl: string, ctrl: AbortController): Promise<Response> {
  let url = initialUrl;
  for (let hop = 0; hop < MAX_REDIRECTS + 1; hop++) {
    if (!isAllowedAvatarUrl(url)) {
      throw new Error("avatar redirect target not allowed");
    }
    const res = await fetch(url, { signal: ctrl.signal, redirect: "manual" });
    const isRedirect = res.status >= 300 && res.status < 400 && res.headers.has("location");
    if (!isRedirect) return res;
    if (hop === MAX_REDIRECTS) {
      await res.body?.cancel().catch(() => {});
      throw new Error("too many redirects");
    }
    const loc = res.headers.get("location")!;
    // relative redirect 対応 pyon
    url = new URL(loc, url).toString();
    await res.body?.cancel().catch(() => {});
  }
  // unreachable
  throw new Error("too many redirects");
}

async function readWithCap(res: Response): Promise<Buffer> {
  if (!res.body) throw new Error("empty response body");
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) throw new Error("avatar too large");
      chunks.push(value);
    }
  } catch (e) {
    await reader.cancel().catch(() => {});
    throw e;
  }
  return Buffer.concat(chunks);
}
