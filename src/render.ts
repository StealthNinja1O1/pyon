import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getFonts } from "./fonts";
import { layouts, pickLayout, type LayoutName } from "./layouts";
import type { QuoteRequest } from "./schema";

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
  });

  // fitTo width = canvas widthなのでresvgはscaleしない pyon. layoutが宣言したdimsで出る. 神.
  const buf = new Resvg(svg, { fitTo: { mode: "width", value: layout.size.width } })
    .render()
    .asPng();

  // resvgのBufferは runtime ではArrayBuffer-backed pyon. TSは ArrayBufferLike (Shared含む) で
  // 来るのでBlobPartに合致しないと文句言う. cast一発で許してもらう.
  return { png: new Blob([buf as BlobPart], { type: "image/png" }), style };
}
