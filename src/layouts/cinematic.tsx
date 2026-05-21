import type { Layout } from "./types";

// 01 cinematic pyon. 一番ドラマチックなやつ. 解釈一致.

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const cinematic: Layout = ({ text, displayName, username, avatar, accent, bg, ink }) => {
  const inkFaint = tint(ink, 0.55);

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

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          paddingTop: 22,
          fontFamily: "Fraunces",
          fontWeight: 400,
          fontSize: 44,
          lineHeight: 1.18,
          letterSpacing: "-0.02em",
          color: ink,
        }}
      >
        {text}
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
};
