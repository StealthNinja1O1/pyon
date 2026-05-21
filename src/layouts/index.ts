import { cinematic } from "./cinematic";
import { editorial } from "./editorial";
import { immersion } from "./immersion";
import type { Layout } from "./types";

export const layouts = {
  cinematic,
  editorial,
  immersion,
} satisfies Record<string, Layout>;

export type LayoutName = keyof typeof layouts;

// random pool pyon. portraitのimmersionは混ぜない (aspect ratio変わるとbot側で詰む).
// 明示的に `style: "immersion"` で呼んだ時だけ出る.
const RANDOM_POOL: LayoutName[] = ["cinematic", "editorial"];

// 明示requestあればそれ、なければrandom pool から pick pyon.
// hashでstableにする手もあったけど毎回違うfeelの方が楽しいので却下
export function pickLayout(requested?: string): LayoutName {
  if (requested && requested in layouts) return requested as LayoutName;
  return RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)]!;
}
