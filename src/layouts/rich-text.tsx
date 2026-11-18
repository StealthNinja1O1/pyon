import type { CSSProperties, ReactElement } from "react";
import { NAV_LABELS, type Block, type Inline, type List, type TimeStyle } from "../markdown";

// か、勘違いしないでよね！Discord emojiのことなんて何も考えてないんだから！
// ...でも <:name:id> が来たらちゃんと<img>にしてあげる。ほら、感謝なんてしなくていいわよ pyon.
const EMOJI_CDN = "https://cdn.discordapp.com/emojis";

export type MdOpts = {
  size: number;
  ink: string;
  accent: string;
  quoted?: boolean;
};

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// satoriのlinebreakはタイ語の単語境界を知らない. ZWSPを縫い込んで教える pyon
const THAI = /[฀-๿]/;
const thaiWords = new Intl.Segmenter("th", { granularity: "word" });
function breakable(s: string): string {
  if (!THAI.test(s)) return s;
  let out = "";
  for (const { segment } of thaiWords.segment(s)) out += segment + "​";
  return out;
}

const TIME_OPTS: Record<Exclude<TimeStyle, "R">, Intl.DateTimeFormatOptions> = {
  t: { hour: "2-digit", minute: "2-digit" },
  T: { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  d: { day: "2-digit", month: "2-digit", year: "numeric" },
  D: { day: "numeric", month: "long", year: "numeric" },
  f: { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" },
  F: { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" },
  s: { dateStyle: "short", timeStyle: "short" },
  S: { dateStyle: "medium", timeStyle: "medium" },
};

// ※ tz/localeはT9のbot契約待ち. それまではUTC+en固定、Rだけはrender時刻基準 pyon
function formatTime(unix: number, style: TimeStyle): string {
  if (style === "R") {
    const s = Math.round(unix - Date.now() / 1000);
    const a = Math.abs(s);
    const [n, unit]: [number, Intl.RelativeTimeFormatUnit] =
      a < 60 ? [s, "second"] :
      a < 3600 ? [Math.round(s / 60), "minute"] :
      a < 86400 ? [Math.round(s / 3600), "hour"] :
      a < 2592000 ? [Math.round(s / 86400), "day"] :
      a < 31536000 ? [Math.round(s / 2592000), "month"] :
      [Math.round(s / 31536000), "year"];
    return new Intl.RelativeTimeFormat("en").format(n, unit);
  }
  return new Intl.DateTimeFormat("en-GB", { ...TIME_OPTS[style], timeZone: "UTC" }).format(unix * 1000);
}

type Bits = (string | ReactElement)[];

function pill(label: string, fg: string, bg: string, key: number): ReactElement {
  return (
    <span key={key} style={{ color: fg, backgroundColor: bg, borderRadius: 6, padding: "0 0.22em" }}>
      {label}
    </span>
  );
}

function inlines(nodes: Inline[], o: MdOpts): Bits {
  const out: Bits = [];
  let k = 0;
  for (const n of nodes) {
    switch (n.type) {
      case "text": out.push(breakable(n.text)); break;
      case "br": out.push("\n"); break;
      case "bold": out.push(<span key={k++} style={{ fontWeight: 600 }}>{inlines(n.children, o)}</span>); break;
      case "italic": out.push(<span key={k++} style={{ fontStyle: "italic" }}>{inlines(n.children, o)}</span>); break;
      case "underline": out.push(<span key={k++} style={{ textDecoration: "underline" }}>{inlines(n.children, o)}</span>); break;
      case "strike": out.push(<span key={k++} style={{ textDecoration: "line-through" }}>{inlines(n.children, o)}</span>); break;
      case "spoiler":
        // 中身はopacity 0で描く: サイズは本物、読めなさも本物 pyon
        out.push(
          <span key={k++} style={{ backgroundColor: tint(o.ink, 0.16), borderRadius: 5, padding: "0 0.2em" }}>
            <span style={{ opacity: 0 }}>{inlines(n.children, o)}</span>
          </span>,
        );
        break;
      case "code":
        out.push(
          <span key={k++} style={{ backgroundColor: tint(o.ink, 0.1), borderRadius: 6, padding: "0 0.28em" }}>
            {n.text}
          </span>,
        );
        break;
      case "link":
        out.push(<span key={k++} style={{ color: o.accent, textDecoration: "underline" }}>{inlines(n.children, o)}</span>);
        break;
      case "url": out.push(n.url); break;
      case "user": out.push(pill("@user", o.accent, tint(o.accent, 0.16), k++)); break;
      case "role": out.push(pill("@role", o.accent, tint(o.accent, 0.16), k++)); break;
      case "channel": out.push(pill("#channel", o.accent, tint(o.accent, 0.16), k++)); break;
      case "game": out.push(pill("@game", o.accent, tint(o.accent, 0.16), k++)); break;
      case "everyone": case "here": out.push(pill(`@${n.type}`, o.accent, tint(o.accent, 0.16), k++)); break;
      case "command": out.push(pill(`/${n.name}`, o.accent, tint(o.accent, 0.16), k++)); break;
      case "nav": out.push(pill(NAV_LABELS[n.nav], o.accent, tint(o.accent, 0.16), k++)); break;
      case "time": out.push(pill(formatTime(n.unix, n.style), o.ink, tint(o.ink, 0.12), k++)); break;
      case "emoji":
        out.push(<img key={k++} src={`${EMOJI_CDN}/${n.id}.png?size=128`} width={o.size} height={o.size} />);
        break;
    }
  }
  return out;
}

function listEl(l: List, o: MdOpts, key: number): ReactElement {
  return (
    <div key={key} style={{ display: "flex", flexDirection: "column", gap: o.size * 0.12 }}>
      {l.items.map((item, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "block" }}>
            {(l.ordered ? `${l.start + i}. ` : "• ") as string}
            {inlines(item.children, o)}
          </div>
          {item.list && <div style={{ paddingLeft: o.size * 0.9, display: "flex" }}>{listEl(item.list, o, 0)}</div>}
        </div>
      ))}
    </div>
  );
}

function blockEl(b: Block, o: MdOpts, key: number): ReactElement {
  switch (b.type) {
    case "paragraph":
      return <div key={key} style={{ display: "block" }}>{inlines(b.children, o)}</div>;
    case "heading": {
      const scale = [1.25, 1.12, 1.02][b.level - 1]!;
      return (
        <div key={key} style={{ display: "block", fontWeight: 600, fontSize: o.size * scale }}>
          {inlines(b.children, o)}
        </div>
      );
    }
    case "subtext":
      return (
        <div key={key} style={{ display: "block", fontFamily: "Inter", fontSize: o.size * 0.62, color: tint(o.ink, 0.65) }}>
          {inlines(b.children, o)}
        </div>
      );
    case "quote":
      return (
        <div
          key={key}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: o.size * 0.25,
            borderLeft: `4px solid ${tint(o.accent, 0.65)}`,
            paddingLeft: o.size * 0.45,
            color: tint(o.ink, 0.85),
          }}
        >
          {b.children.map((c, i) => blockEl(c, o, i))}
        </div>
      );
    case "codeblock":
      return (
        <div
          key={key}
          style={{
            display: "block",
            textAlign: "left",
            backgroundColor: tint(o.ink, 0.08),
            borderRadius: 10,
            padding: `${o.size * 0.3}px ${o.size * 0.5}px`,
            fontSize: o.size * 0.72,
            lineHeight: 1.4,
          }}
        >
          {b.text}
        </div>
      );
    case "list":
      return listEl(b, o, key);
  }
}

// “ ” は最初/最後のinline-blockに縫い込む. headerの行頭 # を壊さないよう parse後に入れる.
// 縫い込み先がcodeblock/list/quoteなら黙って付けない (迷子の “ が写真上に浮くよりマシ) pyon
function withQuoteMarks(ast: Block[]): Block[] {
  const mark = (text: string): Inline => ({ type: "text", text });
  const open = ast[0];
  const close = ast[ast.length - 1];
  const result = [...ast];
  if (open && open.type !== "codeblock" && open.type !== "list" && open.type !== "quote") {
    result[0] = { ...open, children: [mark("“"), ...open.children] } as Block;
  }
  if (close && close.type !== "codeblock" && close.type !== "list" && close.type !== "quote") {
    const idx = result.length - 1;
    const last = result[idx]! as Extract<Block, { children: Inline[] }>;
    result[idx] = { ...last, children: [...last.children, mark("”")] } as Block;
  }
  return result;
}

export function markdownContainer(ast: Block[], style: CSSProperties, o: MdOpts): ReactElement {
  const blocks = o.quoted ? withQuoteMarks(ast) : ast;
  return (
    <div
      style={{
        whiteSpace: "pre-wrap",
        display: "flex",
        flexDirection: "column",
        gap: o.size * 0.3,
        ...style,
      }}
    >
      {blocks.map((b, i) => blockEl(b, o, i))}
    </div>
  );
}
