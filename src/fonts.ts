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
    frauncesLight,
    frauncesRegular,
    newsreaderRegular,
  ] = await Promise.all([
    load("inter", "inter-latin-400-normal.woff"),
    load("inter", "inter-latin-600-normal.woff"),
    load("fraunces", "fraunces-latin-300-normal.woff"),
    load("fraunces", "fraunces-latin-400-normal.woff"),
    load("newsreader", "newsreader-latin-400-normal.woff"),
  ]);

  return [
    { name: "Inter", data: interRegular, weight: 400, style: "normal" },
    { name: "Inter", data: interSemibold, weight: 600, style: "normal" },
    { name: "Fraunces", data: frauncesLight, weight: 300, style: "normal" },
    { name: "Fraunces", data: frauncesRegular, weight: 400, style: "normal" },
    { name: "Newsreader", data: newsreaderRegular, weight: 400, style: "normal" },
  ];
}
