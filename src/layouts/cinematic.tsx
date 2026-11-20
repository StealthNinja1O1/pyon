import type { Layout } from "./types";
import { markdownContainer } from "./rich-text";
import { parseMarkdown, visibleLength } from "../markdown";

// 01 cinematic pyon. 一番ドラマチックなやつ. 解釈一致.

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// column ~540px. 感覚値だから見た目おかしかったら普通に直して pyon
function quoteSize(len: number): number {
  if (len <= 60)  return 68;
  if (len <= 120) return 52;
  if (len <= 150) return 44;
  if (len <= 200) return 36;
  if (len <= 300) return 30;
  if (len <= 400) return 28;
  return 26;
}

export const cinematic: Layout = {
  size: { width: 1200, height: 630 },
  render: ({ text, displayName, username, avatar, accent, bg, ink }) => {
    const inkFaint = tint(ink, 0.55);
    const ast = parseMarkdown(text);
    // markup抜きの見た目文字数でtierを決める. スペースなし(AAAAAの人)は1.5倍換算 pyon
    const len = text.includes(" ") ? visibleLength(ast) : Math.round(visibleLength(ast) * 1.5);

    return (
  <div
    style={{
      width: 1200,
      height: 630,
      display: "flex",
      backgroundColor: bg,
    }}
  >
    {/* avatar bleed pyon */}
    <div style={{ width: 540, height: 630, display: "flex", position: "relative" }}>
      <img src={avatar} width={540} height={630} style={{ objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 540,
          height: 630,
          // このfadeがこのlayoutの全て pyon. stops いじったら詰むので触らないで〜
          backgroundImage: `linear-gradient(90deg, ${tint(bg, 0)} 0%, ${tint(bg, 0)} 35%, ${tint(bg, 0.85)} 80%, ${bg} 100%)`,
        }}
      />
    </div>

    {/* content column */}
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        padding: "40px 80px 64px 40px",
      }}
    >
      {/* でっかい “ pyon. 切らずに全部見せるのが正解 (cropはbuggyに見える) */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 40,
          display: "flex",
          fontFamily: "Fraunces",
          fontWeight: 300,
          fontSize: 180,
          lineHeight: 1,
          color: accent,
          opacity: 0.92,
        }}
      >
        {"“"}
      </div>

      {/* satoriはwidth明示しないとtextAlign完全無視する. 30分溶かした pyon */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 22 }}>
        {markdownContainer(ast, {
          width: 540,
          fontFamily: "Fraunces",
          fontWeight: 400,
          fontSize: quoteSize(len),
          lineHeight: 1.18,
          letterSpacing: "-0.02em",
          // 60字超えると詩になる. 実証済み pyon
          textAlign: len <= 60 ? "center" : "left",
          wordBreak: "break-word",
          color: ink,
        }, { size: quoteSize(len), ink, accent })}
      </div>

      {/* attribution. bar は name の左に置く方が citation っぽく読める pyon */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 28,
              height: 2,
              backgroundColor: accent,
              marginRight: 14,
              borderRadius: 1,
            }}
          />
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 20,
              color: ink,
              letterSpacing: "-0.01em",
            }}
          >
            {displayName}
          </div>
        </div>
        <div
          style={{
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 16,
            color: inkFaint,
            marginTop: 2,
            paddingLeft: 42,
          }}
        >
          {`@${username}`}
        </div>
      </div>
    </div>
  </div>
    );
  },
};
