// satoriには (family, weight, style) + raw bytes のtripleを渡す pyon
// stylesで指定する fontFamily にこれをmatchしにいく仕組み
//
// font sourceは fontsource (npm). bun install で勝手に揃う pyon
// 静的 .woff per weight なのでsatoriの parser が幸せ. variable font事件は二度と起こさない.

const FONTSOURCE = "node_modules/@fontsource";

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

async function load(family: string, file: string): Promise<ArrayBuffer> {
  const path = `${FONTSOURCE}/${family}/files/${file}`;
  const f = Bun.file(path);
  if (!(await f.exists())) {
    throw new Error(
      `font missing pyon: ${path}\n\`bun install\` を走らせ直して pyon〜`,
    );
  }
  return await f.arrayBuffer();
}

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
    newsreaderRegular,
  ] = await Promise.all([
    load("inter", "inter-latin-400-normal.woff"),
    load("inter", "inter-latin-600-normal.woff"),
    // 900 はimmersionのbilling nameで使う pyon. ドカン
    load("inter", "inter-latin-900-normal.woff"),
    load("fraunces", "fraunces-latin-300-normal.woff"),
    load("fraunces", "fraunces-latin-400-normal.woff"),
    load("newsreader", "newsreader-latin-400-normal.woff"),
  ]);

  return [
    { name: "Inter", data: interRegular, weight: 400, style: "normal" },
    { name: "Inter", data: interSemibold, weight: 600, style: "normal" },
    { name: "Inter", data: interBlack, weight: 900, style: "normal" },
    { name: "Fraunces", data: frauncesLight, weight: 300, style: "normal" },
    { name: "Fraunces", data: frauncesRegular, weight: 400, style: "normal" },
    { name: "Newsreader", data: newsreaderRegular, weight: 400, style: "normal" },
  ];
}

type Face = { name: string; family: string; file: string; lang?: string };

// ※ japanese subset は JIS第1/第2水準くらい. 髙﨑みたいな異体字は豆腐 pyon.
// 足りなくなったら numbered slice を unicode-range で引く方式に昇格
const NOTO_JP: Face = {
  name: "Noto Serif JP",
  family: "noto-serif-jp",
  file: "noto-serif-jp-japanese-400-normal.woff",
  lang: "ja-JP",
};
const NOTO_SC: Face = {
  name: "Noto Serif SC",
  family: "noto-serif-sc",
  file: "noto-serif-sc-chinese-simplified-400-normal.woff",
  lang: "zh-CN",
};
const NOTO_THAI: Face = {
  name: "Noto Serif Thai",
  family: "noto-serif-thai",
  file: "noto-serif-thai-thai-400-normal.woff",
  lang: "th-TH",
};

// satoriのfallbackは name ごとに1面しか見ない. 同名で足すと後から来た方が消えるので全部別名 pyon
const LATIN_EXT: Face[] = [
  { name: "Fraunces Ext", family: "fraunces", file: "fraunces-latin-ext-400-normal.woff" },
  { name: "Fraunces Viet", family: "fraunces", file: "fraunces-vietnamese-400-normal.woff" },
  { name: "Noto Serif Cyrl", family: "noto-serif-jp", file: "noto-serif-jp-cyrillic-400-normal.woff" },
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
  const p = load(face.family, face.file).then(
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
