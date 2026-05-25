import type { Layout } from "./types";
import { richTextContainer } from "./rich-text";

// 02 editorial pyon. magazine margin-note路線. これなら硬いedgeが暴れない.

// hex -> rgbaのhelper pyon. layoutにrgba直書きするとnoise多すぎたのでまとめた
function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// column ~650px. editorialは広いぶん気持ち大きめ pyon
// スペースなし → 1.5倍換算 (cinematic同様)
function quoteSize(text: string): number {
  const len = text.includes(" ") ? text.length : Math.round(text.length * 1.5);
  if (len <= 60)  return 68;
  if (len <= 120) return 56;
  if (len <= 200) return 46;
  if (len <= 300) return 38;
  if (len <= 400) return 30;
  return 28;
}

export const editorial: Layout = {
  size: { width: 1200, height: 630 },
  render: ({ text, displayName, username, avatar, accent, bg, ink }) => {
    const accentSoft = tint(accent, 0.12);
    const inkFaint = tint(ink, 0.55);

    return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: bg,
        backgroundImage: `linear-gradient(90deg, ${bg} 0%, ${bg} 64%, ${tint(bg, 0.85)} 100%)`,
      }}
    >
      {/* quiet little spine. just a hint pyon */}
      <div
        style={{
          position: "absolute",
          top: 46,
          right: 462,
          width: 2,
          height: 116,
          display: "flex",
          backgroundColor: accent,
          opacity: 0.9,
        }}
      />

      {/* content column */}
      <div
        style={{
          width: 780,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 54px 62px 72px",
        }}
      >
        {/* meta row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: accent,
              marginRight: 10,
              boxShadow: `0 0 14px ${accent}`,
            }}
          />
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: accent,
            }}
          >
            quote
          </div>
        </div>

        {richTextContainer(`"${text}"`, {
          display: "flex",
          maxWidth: 650,
          fontFamily: "Newsreader",
          fontWeight: 400,
          fontSize: quoteSize(text),
          lineHeight: 1.1,
          wordBreak: "break-word",
          color: ink,
        }, quoteSize(text))}

        {/* citation-style pyon: barはnameの左 */}
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div
            style={{
              width: 30,
              height: 2,
              backgroundColor: accent,
              marginTop: 13,
              marginRight: 14,
              borderRadius: 2,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 20,
                color: ink,
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: 15,
                color: inkFaint,
                marginTop: 3,
              }}
            >
              {`@${username}`}
            </div>
          </div>
        </div>
      </div>

      {/* inset portrait rail */}
      <div
        style={{
          width: 420,
          height: 630,
          display: "flex",
          position: "relative",
          padding: "38px 44px 38px 0",
        }}
      >
        <div
          style={{
            width: 376,
            height: 554,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            boxShadow: "-24px 0 46px rgba(0,0,0,0.26)",
          }}
        >
          <img src={avatar} width={376} height={554} style={{ objectFit: "cover" }} />

          {/* a little print-treatment glaze. subtle, or it starts yelling */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 376,
              height: 554,
              display: "flex",
              backgroundImage: `linear-gradient(180deg, ${accentSoft} 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 70%, ${accentSoft} 100%), linear-gradient(90deg, rgba(14,14,20,0.32) 0%, rgba(0,0,0,0) 48%)`,
            }}
          />
        </div>
      </div>
    </div>
    );
  },
};
