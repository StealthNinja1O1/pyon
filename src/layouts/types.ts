import type { ReactElement } from "react";

export type LayoutInput = {
  text: string;
  displayName: string;
  username: string;
  // data: url, already inlined by avatar.ts
  avatar: string;
  // hex with `#` prefix, already defaulted by render.ts
  accent: string;
  bg: string;
  ink: string;
};

export type Layout = (input: LayoutInput) => ReactElement;
