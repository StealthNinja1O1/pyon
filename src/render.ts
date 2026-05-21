import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getFonts } from "./fonts";
import { layouts, pickLayout, type LayoutName } from "./layouts";
import type { QuoteRequest } from "./schema";

const W = 1200;
const H = 630;
const DEFAULT_ACCENT = "#ff5fa2"; // brand pink pyon
const DEFAULT_BG = "#0e0e14";
const DEFAULT_INK = "#f4f4f6";

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
  const tree = layouts[style]({
    text: req.text,
    displayName: req.displayName,
    username: req.username,
    avatar,
    accent: req.accentColor ?? DEFAULT_ACCENT,
    bg: req.bgColor ?? DEFAULT_BG,
    ink: req.textColor ?? DEFAULT_INK,
  });

  const svg = await satori(tree, {
    width: W,
    height: H,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
  });

  // fitTo width = canvas widthなのでresvgはscaleしない pyon. きっちり1200x630で出る. 神.
  const buf = new Resvg(svg, { fitTo: { mode: "width", value: W } })
    .render()
    .asPng();

  // resvgのBufferは runtime ではArrayBuffer-backed pyon. TSは ArrayBufferLike (Shared含む) で
  // 来るのでBlobPartに合致しないと文句言う. cast一発で許してもらう.
  return { png: new Blob([buf as BlobPart], { type: "image/png" }), style };
}
