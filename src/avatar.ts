// avatarをhttps fetch -> data url にしてからsatoriに渡す pyon
// satori自体はurl直接食えるけど、自分でinlineした方が
//   1. round tripをcontrolできる (satoriの裏で何やってるか分からんの怖い)
//   2. CDNがbuggyになった時のerror surfaceがcleanになる
//   3. 後でcacheしたい時に楽 pyon

const MAX_BYTES = 4 * 1024 * 1024; // 4 mb. discord cdnのavatarはちっちゃいけど一応defensive pyon
const TIMEOUT_MS = 5_000;          // 5秒で切る. CDN死んでてもserver全体が詰まないように

export async function fetchAvatar(url: string): Promise<string> {
  if (!url.startsWith("https://")) {
    throw new Error("avatar url must be https");
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) throw new Error(`avatar fetch failed: ${res.status} ${res.statusText}`);

  const ct = res.headers.get("content-type") ?? "image/png";
  if (!ct.startsWith("image/")) throw new Error(`avatar is not an image: ${ct}`);

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) throw new Error("avatar too large");

  const b64 = Buffer.from(buf).toString("base64");
  return `data:${ct};base64,${b64}`;
}
