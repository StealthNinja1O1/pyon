export type TimeStyle = "t" | "T" | "d" | "D" | "f" | "F" | "s" | "S" | "R";
export type NavKind = "customize" | "browse" | "guide" | "linked-roles";

export type Inline =
  | { type: "text"; text: string }
  | { type: "br" }
  | { type: "bold" | "italic" | "underline" | "strike" | "spoiler"; children: Inline[] }
  | { type: "code"; text: string }
  | { type: "link"; url: string; children: Inline[] }
  | { type: "url"; url: string; suppressed: boolean }
  | { type: "user" | "role" | "channel" | "game"; id: string }
  | { type: "everyone" | "here" }
  | { type: "command"; name: string; id: string }
  | { type: "nav"; nav: NavKind; role?: string }
  | { type: "time"; unix: number; style: TimeStyle }
  | { type: "emoji"; name: string; id: string; animated: boolean };

export type List = { type: "list"; ordered: boolean; start: number; items: ListItem[] };
export type ListItem = { children: Inline[]; list?: List };

export type Block =
  | { type: "paragraph"; children: Inline[] }
  | { type: "heading"; level: 1 | 2 | 3; children: Inline[] }
  | { type: "subtext"; children: Inline[] }
  | { type: "quote"; children: Block[] }
  | { type: "codeblock"; lang: string; text: string }
  | List;

export const NAV_LABELS: Record<NavKind, string> = {
  customize: "Channels & Roles",
  browse: "Browse Channels",
  guide: "Server Guide",
  "linked-roles": "Linked Roles",
};

type Rule = [RegExp, (m: RegExpExecArray) => Inline];

const wrap = (type: "bold" | "italic" | "underline" | "strike" | "spoiler") =>
  (m: RegExpExecArray): Inline => ({ type, children: inline(m[1]!) });

// 全部試して最長一致、同じ長さなら先に書いた方が勝つ (simple-markdown 流). ***x*** が italic(bold) になるのはこのせい pyon
const rules: Rule[] = [
  [/<(a)?:(\w+):(\d+)>/y, m => ({ type: "emoji", animated: !!m[1], name: m[2]!, id: m[3]! })],
  [/<@!?(\d+)>/y, m => ({ type: "user", id: m[1]! })],
  [/<@&(\d+)>/y, m => ({ type: "role", id: m[1]! })],
  [/<@\$(\d+)>/y, m => ({ type: "game", id: m[1]! })],
  [/<#(\d+)>/y, m => ({ type: "channel", id: m[1]! })],
  [/<\/([-_'\p{L}\p{N}\p{M}]+(?: [-_'\p{L}\p{N}\p{M}]+){0,2}):(\d+)>/uy, m => ({ type: "command", name: m[1]!, id: m[2]! })],
  // "id" は snowflake じゃなくて文字通りの id. discord-markdown-parser はここで数字待ってて外してる pyon
  [/<id:(?:(customize|browse|guide)|(linked-roles)(?::(\d+))?)>/y,
    m => ({ type: "nav", nav: (m[1] ?? m[2]) as NavKind, ...(m[3] ? { role: m[3] } : {}) })],
  [/<t:(-?\d+)(?::([tTdDfFsSR]))?>/y, m => ({ type: "time", unix: Number(m[1]), style: (m[2] ?? "f") as TimeStyle })],
  [/<(https?:\/\/[^\s>]+)>/y, m => ({ type: "url", url: m[1]!, suppressed: true })],
  [/(?<!\w)@(everyone|here)(?!\w)/y, m => ({ type: m[1] as "everyone" | "here" })],
  [/https?:\/\/[^\s<]+[^<.,:;"')\]\s]/y, m => ({ type: "url", url: m[0], suppressed: false })],
  [/(`+)([\s\S]*?[^`])\1(?!`)/y, m => ({ type: "code", text: m[2]! })],
  [/\[((?:\\[\s\S]|[^\\\]])+)\]\(<?(https?:\/\/[^\s<>()]+)>?\)/y, m => ({ type: "link", url: m[2]!, children: inline(m[1]!) })],
  [/\|\|([\s\S]+?)\|\|/y, wrap("spoiler")],
  [/~~([\s\S]+?)~~/y, wrap("strike")],
  [/\*(?=\S)((?:\*\*|\\[\s\S]|\s+(?:\\[\s\S]|[^\s*\\]|\*\*)|[^\s*\\])+?)\*(?!\*)/y, wrap("italic")],
  // 前後が単語文字なら _ は無視. snake_case_words を守る lookbehind pyon
  [/(?<![\p{L}\p{N}_])_((?:__|\\[\s\S]|[^\\_])+?)_(?![\p{L}\p{N}_])/uy, wrap("italic")],
  [/\*\*((?:\\[\s\S]|[^\\])+?)\*\*(?!\*)/y, wrap("bold")],
  [/__((?:\\[\s\S]|[^\\])+?)__(?!_)/y, wrap("underline")],
];

const ESCAPABLE = /[^0-9A-Za-z\s]/;

function inline(src: string): Inline[] {
  const out: Inline[] = [];
  let loose = "";
  const settle = () => {
    if (loose) out.push({ type: "text", text: loose });
    loose = "";
  };

  for (let at = 0; at < src.length; ) {
    const ch = src[at]!;
    if (ch === "\n") {
      settle();
      out.push({ type: "br" });
      at++;
      continue;
    }
    if (ch === "\\" && ESCAPABLE.test(src[at + 1] ?? " ")) {
      loose += src[at + 1];
      at += 2;
      continue;
    }

    let best: RegExpExecArray | null = null;
    let make: Rule[1] | null = null;
    for (const [re, build] of rules) {
      re.lastIndex = at;
      const m = re.exec(src);
      if (m && (!best || m[0].length > best[0].length)) [best, make] = [m, build];
    }
    if (best && make) {
      settle();
      out.push(make(best));
      at += best[0].length;
      continue;
    }

    loose += ch;
    at++;
  }

  settle();
  return out;
}

const QUOTE_REST = /^ *>>> /;
const QUOTE_LINE = /^ *> /;
const HEADING = /^(#{1,3}) +(\S.*)$/;
const SUBTEXT = /^-# +(\S.*)$/;
const LIST_ROW = /^( *)([-*]|\d+\.) +(\S.*)$/;
const FENCE = /```(?:([a-z0-9_+\-.#]+?)\n+)?\n*([\s\S]+?)\n*```/iy;
const ANSI = /\u001b(?:\[[\d;]*[A-Za-z]?)?/g;

function lineAt(src: string, at: number): [string, number] {
  const eol = src.indexOf("\n", at);
  return eol < 0 ? [src.slice(at), src.length] : [src.slice(at, eol), eol + 1];
}

function lists(rows: RegExpExecArray[]): List[] {
  const top: List[] = [];
  const open: List[] = [];

  for (const row of rows) {
    const mark = row[2]!;
    const ordered = mark !== "-" && mark !== "*";
    const depth = Math.min(row[1]!.length >> 1, open.length);

    let list = open[depth];
    open.length = depth;
    if (!list || (depth === 0 && list.ordered !== ordered)) {
      list = { type: "list", ordered, start: ordered ? parseInt(mark) : 1, items: [] };
      if (depth === 0) top.push(list);
      else open[depth - 1]!.items.at(-1)!.list = list;
    }
    open.push(list);
    list.items.push({ children: inline(row[3]!) });
  }

  return top;
}

function blocks(src: string, quoted: boolean): Block[] {
  const out: Block[] = [];
  let prose: string[] = [];
  const settle = () => {
    if (prose.length) out.push({ type: "paragraph", children: inline(prose.join("\n")) });
    prose = [];
  };

  let at = 0;
  while (at < src.length) {
    const [line, next] = lineAt(src, at);
    let m: RegExpExecArray | null;

    if (!quoted && (m = QUOTE_REST.exec(line))) {
      settle();
      out.push({ type: "quote", children: blocks(src.slice(at + m[0].length), true) });
      return out;
    }

    if (!quoted && QUOTE_LINE.test(line)) {
      settle();
      const held: string[] = [];
      while (at < src.length) {
        const [l, n] = lineAt(src, at);
        if (!QUOTE_LINE.test(l)) break;
        held.push(l.replace(QUOTE_LINE, ""));
        at = n;
      }
      out.push({ type: "quote", children: blocks(held.join("\n"), true) });
      continue;
    }

    if ((m = HEADING.exec(line))) {
      settle();
      out.push({ type: "heading", level: m[1]!.length as 1 | 2 | 3, children: inline(m[2]!) });
      at = next;
      continue;
    }

    if ((m = SUBTEXT.exec(line))) {
      settle();
      out.push({ type: "subtext", children: inline(m[1]!) });
      at = next;
      continue;
    }

    if (LIST_ROW.test(line)) {
      settle();
      const rows: RegExpExecArray[] = [];
      while (at < src.length) {
        const [l, n] = lineAt(src, at);
        const row = LIST_ROW.exec(l);
        if (!row) break;
        rows.push(row);
        at = n;
      }
      out.push(...lists(rows));
      continue;
    }

    const tick = line.indexOf("```");
    if (tick >= 0) {
      FENCE.lastIndex = at + tick;
      const fence = FENCE.exec(src);
      if (fence) {
        if (tick) prose.push(line.slice(0, tick));
        settle();
        const lang = fence[1] ?? "";
        const text = lang.toLowerCase() === "ansi" ? fence[2]!.replace(ANSI, "") : fence[2]!;
        out.push({ type: "codeblock", lang, text });
        at = FENCE.lastIndex + (src[FENCE.lastIndex] === "\n" ? 1 : 0);
        continue;
      }
    }

    prose.push(line);
    at = next;
  }

  settle();
  return out;
}

export function parseMarkdown(content: string): Block[] {
  return blocks(content.replace(/\r\n?/g, "\n").trim(), false);
}

const EMOJI_WIDTH = 2;
const MENTION_WIDTH = 10;
// discord reference の例文の長さ. 実物は bot の locale/tz 次第 pyon
const TIME_WIDTH: Record<TimeStyle, number> = { t: 5, T: 8, d: 10, D: 14, f: 23, F: 32, s: 17, S: 20, R: 11 };

const graphemes = new Intl.Segmenter();
const PICTOGRAPH = /\p{Extended_Pictographic}/u;

function textLength(s: string): number {
  let n = 0;
  for (const { segment } of graphemes.segment(s)) n += PICTOGRAPH.test(segment) ? EMOJI_WIDTH : 1;
  return n;
}

function spanLength(nodes: Inline[]): number {
  let n = 0;
  for (const node of nodes) {
    switch (node.type) {
      case "text": case "code": n += textLength(node.text); break;
      case "br": n += 1; break;
      case "bold": case "italic": case "underline": case "strike": case "spoiler": case "link":
        n += spanLength(node.children); break;
      case "url": n += node.url.length; break;
      case "user": case "role": case "channel": case "game": n += MENTION_WIDTH; break;
      case "everyone": case "here": n += 1 + node.type.length; break;
      case "command": n += 1 + node.name.length; break;
      case "nav": n += NAV_LABELS[node.nav].length; break;
      case "time": n += TIME_WIDTH[node.style]; break;
      case "emoji": n += EMOJI_WIDTH; break;
    }
  }
  return n;
}

function listLength(list: List): number {
  return list.items.reduce((n, item, i) => {
    const marker = list.ordered ? `${list.start + i}. `.length : 2;
    return n + marker + spanLength(item.children) + (item.list ? 1 + listLength(item.list) : 0);
  }, list.items.length - 1);
}

function blockLength(block: Block): number {
  switch (block.type) {
    case "paragraph": case "heading": case "subtext": return spanLength(block.children);
    case "quote": return visibleLength(block.children);
    case "codeblock": return textLength(block.text);
    case "list": return listLength(block);
  }
}

export function visibleLength(ast: Block[]): number {
  return ast.reduce((n, block) => n + blockLength(block), Math.max(ast.length - 1, 0));
}
