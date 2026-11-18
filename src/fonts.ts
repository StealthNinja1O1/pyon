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
import newsreaderRegularPath from "@fontsource/newsreader/files/newsreader-latin-400-normal.woff" with { type: "file" };

export type FontSpec = {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
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
    newsreaderRegular,
  ] = await Promise.all([
    Bun.file(interRegularPath).arrayBuffer(),
    Bun.file(interSemiboldPath).arrayBuffer(),
    Bun.file(interBlackPath).arrayBuffer(),
    Bun.file(frauncesLightPath).arrayBuffer(),
    Bun.file(frauncesRegularPath).arrayBuffer(),
    Bun.file(newsreaderRegularPath).arrayBuffer(),
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
