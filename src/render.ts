import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getFonts } from "./fonts";
import { layouts, pickLayout, type LayoutName } from "./layouts";
import type { QuoteRequest } from "./schema";

const DEFAULT_ACCENT = "#ff5fa2"; // brand pink pyon
const DEFAULT_BG = "#0e0e14";
const DEFAULT_INK = "#f4f4f6";

const TWEMOJI_CDN = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg";
const TWEMOJI_TIMEOUT_MS = 5_000;
const TWEMOJI_MAX_BYTES = 256 * 1024; // svgがこれより重い世界線はない. defensive pyon
const TWEMOJI_CACHE_MAX = 512;        // unicode絵文字3000あっても多分hot setはこれで足りる pyon
const twemojiCache = new Map<string, string>();

// insertion-order eviction. LRUと言うほどでもないけど bounded pyon
function cacheTwemoji(key: string, val: string) {
  if (twemojiCache.size >= TWEMOJI_CACHE_MAX) {
    const oldest = twemojiCache.keys().next().value;
    if (oldest !== undefined) twemojiCache.delete(oldest);
  }
  twemojiCache.set(key, val);
}

async function fetchTwemoji(cp: string): Promise<string> {
  const cached = twemojiCache.get(cp);
  if (cached) return cached;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TWEMOJI_TIMEOUT_MS);
  try {
    const res = await fetch(`${TWEMOJI_CDN}/${cp}.svg`, { signal: ctrl.signal });
    if (!res.ok) return "";

    // jsdelivrたまにHTMLでerror返してくる. SVGだけ受け入れる pyon
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("svg") && !ct.includes("xml")) return "";

    const declared = Number(res.headers.get("content-length") ?? 0);
    if (Number.isFinite(declared) && declared > TWEMOJI_MAX_BYTES) return "";

    // streaming読み. content-length嘘つきserver対策 pyon
    const reader = res.body?.getReader();
    if (!reader) return "";
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > TWEMOJI_MAX_BYTES) {
        await reader.cancel().catch(() => {});
        return "";
      }
      chunks.push(value);
    }

    const svg = Buffer.concat(chunks).toString("utf-8");
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    cacheTwemoji(cp, dataUrl);
    return dataUrl;
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

export type RenderResult = {
  png: Blob;
  style: LayoutName;
};

export async function renderQuote(
  req: QuoteRequest,
  avatar: string,
): Promise<RenderResult> {
  const fonts = await getFonts();
  const style = pickLayout(req.style);
  const layout = layouts[style];
  const tree = layout.render({
    text: req.text,
    displayName: req.displayName,
    username: req.username,
    avatar,
    accent: req.accentColor ?? DEFAULT_ACCENT,
    bg: req.bgColor ?? DEFAULT_BG,
    ink: req.textColor ?? DEFAULT_INK,
  });

  const svg = await satori(tree, {
    width: layout.size.width,
    height: layout.size.height,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
    loadAdditionalAsset: async (code: string, segment: string) => {
      if (code !== "emoji") return "";
      const cp = [...segment].map((c) => c.codePointAt(0)!.toString(16)).join("-");
      return fetchTwemoji(cp);
    },
  });

  // fitTo width = canvas widthなのでresvgはscaleしない pyon. layoutが宣言したdimsで出る. 神.
  const buf = new Resvg(svg, { fitTo: { mode: "width", value: layout.size.width } })
    .render()
    .asPng();

  // resvgのBufferは runtime ではArrayBuffer-backed pyon. TSは ArrayBufferLike (Shared含む) で
  // 来るのでBlobPartに合致しないと文句言う. cast一発で許してもらう.
  return { png: new Blob([buf as BlobPart], { type: "image/png" }), style };
}
