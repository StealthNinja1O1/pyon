// Wrapper for @resvg/resvg-js that embeds the native addon in compiled binaries.
//
// __COMPILED__ is injected via --define during `bun build --compile`.
// - Compiled binary: dead-code elimination removes the npm import; .node is embedded
// - Dev mode: __COMPILED__ is undeclared, typeof returns "undefined", loads from npm

const isCompiled = typeof __COMPILED__ !== "undefined" && __COMPILED__;

declare const __COMPILED__: boolean;

const native = isCompiled
  ? require("./resvgjs.linux-x64-musl.node")
  : require("@resvg/resvg-js/js-binding.js");

export class Resvg extends native.Resvg {
  constructor(svg: string | Uint8Array, options?: Record<string, unknown>) {
    super(svg, options ? JSON.stringify(options) : undefined);
  }
}

export const { renderAsync } = native;
