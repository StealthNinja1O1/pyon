import { cinematic } from "./cinematic";
import { editorial } from "./editorial";
import type { Layout } from "./types";

export const layouts = {
  cinematic,
  editorial,
} satisfies Record<string, Layout>;

export type LayoutName = keyof typeof layouts;

// true random per request pyon. hashでstableにする手もあったけど、毎回違うfeelの方が楽しいので却下
export function pickLayout(requested?: string): LayoutName {
  if (requested === "cinematic" || requested === "editorial") return requested;
  const names = Object.keys(layouts) as LayoutName[];
  return names[Math.floor(Math.random() * names.length)]!;
}
