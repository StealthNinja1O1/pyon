import type { CSSProperties, ReactElement } from "react";

// か、勘違いしないでよね！Discord emojiのことなんて何も考えてないんだから！
// ...でも <:name:id> が来たらちゃんと<img>にしてあげる。ほら、感謝なんてしなくていいわよ pyon.
const DISCORD_EMOJI_RE = /<a?:[a-zA-Z0-9_]+:(\d+)>/g;
// CDNのURL...べ、別にあんたのために用意したんじゃないんだから！pyon
const EMOJI_CDN = "https://cdn.discordapp.com/emojis";

/**
 * Renderer that also handles images for emojis
 * emojiSize should match the container's fontSize so images scale with text
 */
export function renderRichText(text: string, emojiSize: number): string | ReactElement[] {
  DISCORD_EMOJI_RE.lastIndex = 0;
  if (!DISCORD_EMOJI_RE.test(text)) return text;
  DISCORD_EMOJI_RE.lastIndex = 0;

  const parts: ReactElement[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const m of text.matchAll(DISCORD_EMOJI_RE)) {
    if (m.index! > lastIndex) parts.push(<span key={key++}>{text.slice(lastIndex, m.index!)}</span>);
    parts.push(<img key={key++} src={`${EMOJI_CDN}/${m[1]}.png?size=128`} width={emojiSize} height={emojiSize} />);
    lastIndex = m.index! + m[0].length;
  }

  if (lastIndex < text.length) parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);

  return parts;
}

/**
 * When no Discord emojis are present, renders a plain div with text
 * When emojis exist, switches to flex layout so inline <img> elements flow with text.
 */
export function richTextContainer(text: string, style: CSSProperties, emojiSize: number): ReactElement {
  const content = renderRichText(text, emojiSize);

  if (typeof content === "string") return <div style={style}>{content}</div>;
  // textAlign は span の wrap 挙動に効くので残す pyon. justifyContent は flex 子要素の整列担当.
  const justifyContent = style.textAlign === "center" ? "center" : style.textAlign === "right" ? "flex-end" : "flex-start";

  return (
    <div
      style={{
        ...style,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.05em",
        justifyContent,
      }}
    >
      {content}
    </div>
  );
}
