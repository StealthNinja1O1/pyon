import { z } from "zod";

// soft cap pyon. 500文字超えたらlayoutが先に詰む (text wrappingが死ぬ)
const MAX_TEXT = 500;
const MAX_NAME = 80;

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), "avatarUrl must be https");

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "accentColor must be a 6-digit hex like #ff5fa2");

export const QuoteRequest = z.object({
  text: z.string().min(1).max(MAX_TEXT),
  displayName: z.string().min(1).max(MAX_NAME),
  username: z.string().min(1).max(MAX_NAME),
  avatarUrl: httpsUrl,
  // optional pyon. botがcontext見てrole color渡したりtheme color渡したりする想定
  // 省略時はrender.tsでbrand pinkにfallback
  accentColor: hexColor.optional(),
  // 指定なかったらpyonがrandomで選ぶ pyon. 任せろ
  style: z.enum(["cinematic", "editorial"]).optional(),
});

export type QuoteRequest = z.infer<typeof QuoteRequest>;
