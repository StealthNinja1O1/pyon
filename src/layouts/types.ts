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

// 各layoutが自分のcanvas dim持つ pyon. landscape/portraitはlayout側の判断.
export type LayoutSize = { width: number; height: number };

export type Layout = {
  size: LayoutSize;
  render: (input: LayoutInput) => ReactElement;
};
