import { timingSafeEqual } from "node:crypto";

// 未設定だと素通し (dev用) pyon. timing-safe比較は習慣で残してる、短い shared secret には実用上ほぼ意味ない
const KEY = process.env.PYON_KEY;
const KEY_BUF = KEY && KEY.length > 0 ? Buffer.from(KEY) : null;

if (!KEY_BUF) {
  console.warn(
    "[pyon] PYON_KEY 未設定 pyon〜 auth 無効になってるので公開deployする前にちゃんと設定して〜",
  );
}

export function authOk(req: Request): boolean {
  if (!KEY_BUF) return true;
  const provided = req.headers.get("x-pyon-key");
  if (!provided) return false;
  const provBuf = Buffer.from(provided);
  if (provBuf.length !== KEY_BUF.length) return false;
  return timingSafeEqual(provBuf, KEY_BUF);
}
