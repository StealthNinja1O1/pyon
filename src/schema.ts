import { z } from "zod";
import { isAllowedAvatarUrl } from "./allowlist";

// soft cap pyon. 500文字超えたらlayoutが先に詰む (text wrappingが死ぬ)
const MAX_TEXT = 500;
const MAX_NAME = 80;

// https + allowlistedなhost のみ. SSRF対策の一段目pyon. 二段目は avatar.ts の redirect手動check
const httpsUrl = z
  .string()
  .url()
  .refine(isAllowedAvatarUrl, "avatarUrl must be https and host on allowlist");

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
  // 省略時はdefault dark / light で出る pyon
  bgColor: hexColor.optional(),
  textColor: hexColor.optional(),
  // 指定なかったらpyonがrandomで選ぶ pyon. 任せろ
  // immersionはportraitだから明示requestのみ. randomには混ぜない (botがaspect ratio想定して呼ぶので)
  style: z.enum(["cinematic", "editorial", "immersion"]).optional(),
});

export type QuoteRequest = z.infer<typeof QuoteRequest>;
