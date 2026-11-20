// satoriには (family, weight, style) + raw bytes のtripleを渡す pyon
// stylesで指定する fontFamily にこれをmatchしにいく仕組み
//
// font sourceは fontsource (npm). `import ... with { type: "file" }` で
// bun build --compile 時に実行ファイルに埋め込まれる pyon.
// dev中は通常のファイルパスとして解決される. 静的 .woff per weight なので
// satoriの parser が幸せ. variable font事件は二度と起こさない.

import interRegularPath from "@fontsource/inter/files/inter-latin-400-normal.woff" with { type: "file" };
import interSemiboldPath from "@fontsource/inter/files/inter-latin-600-normal.woff" with { type: "file" };
// 900 はimmersionのbilling nameで使う pyon. ドカン
import interBlackPath from "@fontsource/inter/files/inter-latin-900-normal.woff" with { type: "file" };
import frauncesLightPath from "@fontsource/fraunces/files/fraunces-latin-300-normal.woff" with { type: "file" };
import frauncesRegularPath from "@fontsource/fraunces/files/fraunces-latin-400-normal.woff" with { type: "file" };
import frauncesSemiboldPath from "@fontsource/fraunces/files/fraunces-latin-600-normal.woff" with { type: "file" };
import frauncesItalicPath from "@fontsource/fraunces/files/fraunces-latin-400-italic.woff" with { type: "file" };
import frauncesLatinExtPath from "@fontsource/fraunces/files/fraunces-latin-ext-400-normal.woff" with { type: "file" };
import frauncesVietnamesePath from "@fontsource/fraunces/files/fraunces-vietnamese-400-normal.woff" with { type: "file" };
import newsreaderRegularPath from "@fontsource/newsreader/files/newsreader-latin-400-normal.woff" with { type: "file" };
import newsreaderSemiboldPath from "@fontsource/newsreader/files/newsreader-latin-600-normal.woff" with { type: "file" };
import newsreaderItalicPath from "@fontsource/newsreader/files/newsreader-latin-400-italic.woff" with { type: "file" };
import notoJpJpPath from "@fontsource/noto-serif-jp/files/noto-serif-jp-japanese-400-normal.woff" with { type: "file" };
import notoJpCyrlPath from "@fontsource/noto-serif-jp/files/noto-serif-jp-cyrillic-400-normal.woff" with { type: "file" };
import notoScPath from "@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-400-normal.woff" with { type: "file" };
import notoThaiPath from "@fontsource/noto-serif-thai/files/noto-serif-thai-thai-400-normal.woff" with { type: "file" };
import notoMathPath from "@fontsource/noto-sans-math/files/noto-sans-math-math-400-normal.woff" with { type: "file" };
import notoSymPath from "@fontsource/noto-sans-symbols/files/noto-sans-symbols-symbols-400-normal.woff" with { type: "file" };
import notoSym2Path from "@fontsource/noto-sans-symbols-2/files/noto-sans-symbols-2-symbols-400-normal.woff" with { type: "file" };

export type FontSpec = {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
  lang?: string;
};

// promise自体をcacheする pyon. result じゃない理由:
// concurrent な初回呼び出しでもPromise.all 一回しか走らない (thundering herd 回避)
let cachePromise: Promise<FontSpec[]> | null = null;

export function getFonts(): Promise<FontSpec[]> {
  if (!cachePromise) {
    const p = loadFonts();
    cachePromise = p;
    // 失敗promiseが居座ると永遠にretryできなくなるので、rejection時はcacheクリア pyon
    p.catch(() => {
      if (cachePromise === p) cachePromise = null;
    });
  }
  return cachePromise;
}

async function loadFonts(): Promise<FontSpec[]> {
  const [
    interRegular,
    interSemibold,
    interBlack,
    frauncesLight,
    frauncesRegular,
    frauncesSemibold,
    frauncesItalic,
    newsreaderRegular,
    newsreaderSemibold,
    newsreaderItalic,
  ] = await Promise.all([
    Bun.file(interRegularPath).arrayBuffer(),
    Bun.file(interSemiboldPath).arrayBuffer(),
    Bun.file(interBlackPath).arrayBuffer(),
    Bun.file(frauncesLightPath).arrayBuffer(),
    Bun.file(frauncesRegularPath).arrayBuffer(),
    Bun.file(frauncesSemiboldPath).arrayBuffer(),
    Bun.file(frauncesItalicPath).arrayBuffer(),
    Bun.file(newsreaderRegularPath).arrayBuffer(),
    Bun.file(newsreaderSemiboldPath).arrayBuffer(),
    Bun.file(newsreaderItalicPath).arrayBuffer(),
  ]);

  return [
    { name: "Inter", data: interRegular, weight: 400, style: "normal" },
    { name: "Inter", data: interSemibold, weight: 600, style: "normal" },
    { name: "Inter", data: interBlack, weight: 900, style: "normal" },
    { name: "Fraunces", data: frauncesLight, weight: 300, style: "normal" },
    { name: "Fraunces", data: frauncesRegular, weight: 400, style: "normal" },
    { name: "Fraunces", data: frauncesSemibold, weight: 600, style: "normal" },
    { name: "Fraunces", data: frauncesItalic, weight: 400, style: "italic" },
    { name: "Newsreader", data: newsreaderRegular, weight: 400, style: "normal" },
    { name: "Newsreader", data: newsreaderSemibold, weight: 600, style: "normal" },
    { name: "Newsreader", data: newsreaderItalic, weight: 400, style: "italic" },
  ];
}

type Face = { name: string; path: string; file: string; lang?: string };

// ※ japanese subset は JIS第1/第2水準くらい. 髙﨑みたいな異体字は豆腐 pyon.
// 足りなくなったら numbered slice を unicode-range で引く方式に昇格
const NOTO_JP: Face = {
  name: "Noto Serif JP",
  path: notoJpJpPath,
  file: "noto-serif-jp-japanese-400-normal.woff",
  lang: "ja-JP",
};
const NOTO_SC: Face = {
  name: "Noto Serif SC",
  path: notoScPath,
  file: "noto-serif-sc-chinese-simplified-400-normal.woff",
  lang: "zh-CN",
};
const NOTO_THAI: Face = {
  name: "Noto Serif Thai",
  path: notoThaiPath,
  file: "noto-serif-thai-thai-400-normal.woff",
  lang: "th-TH",
};

// satoriのfallbackは name ごとに1面しか見ない. 同名で足すと後から来た方が消えるので全部別名 pyon
// "unknown" locale (→ ✓ ⚠ ★ 等の記号) はlatin fontsに居ないのでmath/symbolsで穴埋め pyon
const LATIN_EXT: Face[] = [
  { name: "Fraunces Ext", path: frauncesLatinExtPath, file: "fraunces-latin-ext-400-normal.woff" },
  { name: "Fraunces Viet", path: frauncesVietnamesePath, file: "fraunces-vietnamese-400-normal.woff" },
  { name: "Noto Serif Cyrl", path: notoJpCyrlPath, file: "noto-serif-jp-cyrillic-400-normal.woff" },
  { name: "Noto Math", path: notoMathPath, file: "noto-sans-math-math-400-normal.woff" },
  { name: "Noto Symbols 2", path: notoSym2Path, file: "noto-sans-symbols-2-symbols-400-normal.woff" },
  { name: "Noto Symbols", path: notoSymPath, file: "noto-sans-symbols-symbols-400-normal.woff" },
];

// 漢字は "ja-JP|zh-CN|zh-TW|zh-HK" でまとめて聞かれる. JPが先に入るので字形は日本、SCは簡体字の穴埋め pyon
const FACES_BY_LOCALE: Record<string, Face[]> = {
  "ja-JP": [NOTO_JP],
  "zh-CN": [NOTO_JP, NOTO_SC],
  "zh-TW": [NOTO_JP, NOTO_SC],
  "zh-HK": [NOTO_JP, NOTO_SC],
  "th-TH": [NOTO_THAI],
  unknown: LATIN_EXT,
};

// 同じArrayBufferを返し続けるのが大事. satoriはbufferのidentityでparse結果をcacheしてる pyon
const faceCache = new Map<string, Promise<FontSpec>>();

function loadFace(face: Face): Promise<FontSpec> {
  const hit = faceCache.get(face.file);
  if (hit) return hit;
  const p = Bun.file(face.path).arrayBuffer().then(
    (data): FontSpec => ({ name: face.name, data, weight: 400, style: "normal", lang: face.lang }),
  );
  faceCache.set(face.file, p);
  p.catch(() => {
    if (faceCache.get(face.file) === p) faceCache.delete(face.file);
  });
  return p;
}

export function getScriptFonts(code: string): Promise<FontSpec[]> {
  const faces = new Set(code.split("|").flatMap((locale) => FACES_BY_LOCALE[locale] ?? []));
  return Promise.all([...faces].map(loadFace));
}
